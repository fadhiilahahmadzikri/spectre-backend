#!/usr/bin/env python3
from __future__ import annotations

import argparse
import fnmatch
import sys
import threading
import time
from pathlib import Path

try:
    from rich.align import Align
    from rich.console import Console
    from rich.live import Live
    from rich.panel import Panel
    from rich.progress import BarColumn, Progress, SpinnerColumn, TaskProgressColumn, TextColumn, TimeElapsedColumn
    from rich.prompt import Confirm, Prompt
    from rich.rule import Rule
    from rich.table import Table
    from rich.text import Text
    from rich import box
except ImportError:
    print("ERROR: pip install rich")
    sys.exit(1)

try:
    from huggingface_hub import HfApi, SpaceInfo
except ImportError:
    print("ERROR: pip install huggingface_hub")
    sys.exit(1)

IS_WINDOWS = sys.platform == "win32"
if IS_WINDOWS:
    import msvcrt
else:
    import tty
    import termios

console = Console()

BANNER = """[bold cyan]
 ███████╗██████╗ ███████╗ ██████╗████████╗██████╗ ███████╗
 ██╔════╝██╔══██╗██╔════╝██╔════╝╚══██╔══╝██╔══██╗██╔════╝
 ███████╗██████╔╝█████╗  ██║        ██║   ██████╔╝█████╗  
 ╚════██║██╔═══╝ ██╔══╝  ██║        ██║   ██╔══██╗██╔══╝  
 ███████║██║     ███████╗╚██████╗   ██║   ██║  ██║███████╗
 ╚══════╝╚═╝     ╚══════╝ ╚═════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝
[/bold cyan][dim cyan]         HF Space Deployer — Sync. Robust. Clean.[/dim cyan]
"""

UPLOAD_MODES = {
    "sync": "SYNC — Upload baru/berubah + hapus file remote yang tidak ada di lokal",
    "additive": "ADDITIVE — Upload saja, tidak hapus apapun (perilaku lama)",
}

MAIN_MENU_OPTIONS = [
    "Upload / Redeploy Space",
    "Watch Space Status",
    "Manage Secrets",
    "Inspect Space Secrets (Keys Only)",
    "Audit Remote Env Values (Full Access)",
    "Inspect Spaces",
    "Preview Ignore Patterns",
    "Keluar",
]

STAGE_STYLE = {
    "RUNNING":       "bold green",
    "BUILDING":      "bold yellow",
    "STARTING":      "bold yellow",
    "RESTARTING":    "bold yellow",
    "STOPPED":       "dim",
    "PAUSED":        "dim",
    "BUILD_ERROR":   "bold red",
    "RUNTIME_ERROR": "bold red",
    "CONFIG_ERROR":  "bold red",
    "DELETING":      "bold red",
    "SLEEPING":      "dim cyan",
}


def parse_ignore_file(filepath: Path) -> list[str]:
    patterns = []
    if not filepath.exists():
        return patterns
    with open(filepath, encoding="utf-8", errors="ignore") as f:
        for line in f:
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            patterns.append(stripped)
    return patterns


def load_ignore_patterns(folder: Path) -> tuple[list[str], dict[str, int]]:
    """Load ignore patterns from .huggingfaceignore ONLY.

    This is the single source of truth for what gets deployed.
    .gitignore is intentionally NOT read — it serves a different purpose
    (local dev vs. HF Spaces deployment).
    """
    patterns = parse_ignore_file(folder / ".huggingfaceignore")
    return patterns, {"rule_count": len(patterns)}


def _is_ignored(rel_path: str, patterns: list[str]) -> bool:
    # Normalize to lower case for case-insensitive matching
    rel_path_lower = rel_path.lower()
    path_parts_lower = rel_path_lower.split('/')
    
    for pattern in patterns:
        p = pattern.strip().rstrip("/")
        if not p: continue
        p_lower = p.lower()
        
        # Anchored match (starts with /)
        if p_lower.startswith("/"):
            p_anchored = p_lower.lstrip("/")
            if fnmatch.fnmatch(rel_path_lower, p_anchored) or fnmatch.fnmatch(rel_path_lower, f"{p_anchored}/*"):
                return True
            continue

        # Standard matches (relative or name-based)
        if fnmatch.fnmatch(rel_path_lower, p_lower) or fnmatch.fnmatch(rel_path_lower, f"{p_lower}/*"):
            return True
        if fnmatch.fnmatch(Path(rel_path_lower).name, p_lower):
            return True
        
        # Directory segment match (e.g. "node_modules" matches any depth)
        if p_lower in path_parts_lower:
            return True
            
    return False


def _collect_local_files(folder: Path, ignore_patterns: list[str]) -> set[str]:
    local_files: set[str] = set()
    for path in folder.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(folder).as_posix()
        if _is_ignored(rel, ignore_patterns):
            continue
        local_files.add(rel)
    return local_files


def _collect_remote_files(api: HfApi, repo_id: str) -> set[str]:
    remote_files: set[str] = set()
    try:
        repo_files = api.list_repo_files(repo_id=repo_id, repo_type="space")
        for f in repo_files:
            remote_files.add(f)
    except Exception as e:
        console.print(f"[yellow]Warning: tidak bisa list remote files: {e}[/]")
    return remote_files


def _delete_stale_remote_files(
    api: HfApi,
    repo_id: str,
    local_files: set[str],
    remote_files: set[str],
) -> list[str]:
    """
    Hapus file-file di remote yang sudah tidak ada di lokal.
    File .gitattributes dan README.md dilindungi, tidak akan dihapus.
    """
    stale = remote_files - local_files
    protected = {".gitattributes", "README.md"}
    stale = {f for f in stale if f not in protected}

    if not stale:
        return []

    deleted = []
    with console.status(f"[red]Menghapus {len(stale)} file stale dari remote...[/]"):
        for path in sorted(stale):
            try:
                api.delete_file(
                    path_in_repo=path,
                    repo_id=repo_id,
                    repo_type="space",
                    commit_message=f"sync: remove stale {path}",
                )
                deleted.append(path)
                console.print(f"  [red]DEL[/] {path}")
            except Exception as e:
                console.print(f"  [yellow]SKIP[/] {path} — {e}")
    return deleted


def _patch_create_repo(api: HfApi, sdk: str):
    original = api.create_repo
    def patched(*args, **kwargs):
        if kwargs.get("repo_type") == "space" and "space_sdk" not in kwargs:
            kwargs["space_sdk"] = sdk
        return original(*args, **kwargs)
    api.create_repo = patched
    return original


def run_upload(
    api: HfApi,
    repo_id: str,
    folder: Path,
    patterns: list[str],
    workers: int,
    sdk: str = "docker",
    mode: str = "sync",
):
    import subprocess
    import shutil
    import tempfile
    
    console.print(Rule(f"[bold cyan]PRE-FLIGHT CHECK — mode=[yellow]{mode.upper()}[/][/]"))

    with console.status(f"[cyan]Verifikasi Space {repo_id}...[/]"):
        try:
            api.space_info(repo_id)
            console.print(f"  [green]OK[/] Space [bold]{repo_id}[/] ditemukan (sdk={sdk})")
        except Exception:
            try:
                api.create_repo(repo_id=repo_id, repo_type="space", space_sdk=sdk, exist_ok=True)
                console.print(f"  [green]OK[/] Space [bold]{repo_id}[/] dibuat (sdk={sdk})")
            except Exception as e:
                console.print(f"  [red]FAIL:[/] {e}")
                sys.exit(1)

    console.print(f"  [green]OK[/] Mode: [bold yellow]GIT LFS SYNC[/]")
    console.print(f"  [green]OK[/] Ignore patterns: [bold]{len(patterns)}[/] rules")
    console.print()

    console.print(Rule("[bold red]GIT LFS UPLOAD (Bypassing HTTP Rate Limit)[/]"))

    temp_dir = folder / ".hf_deploy_temp"
    if temp_dir.exists():
        shutil.rmtree(temp_dir, ignore_errors=True)

    try:
        # Clone repo
        with console.status("[cyan]Cloning remote repository (LFS enabled)...[/]"):
            subprocess.run(["git", "clone", f"https://huggingface.co/spaces/{repo_id}", str(temp_dir)], check=True, capture_output=True)

        # Clear existing non-git files
        for item in temp_dir.iterdir():
            if item.name not in (".git", ".gitattributes", "README.md"):
                if item.is_dir():
                    shutil.rmtree(item)
                else:
                    item.unlink()

        # Collect & Copy
        with console.status(f"[cyan]Filtering and copying backend files (using {len(patterns)} ignore rules)...[/]"):
            local_files = _collect_local_files(folder, patterns)
            for f in local_files:
                src_file = folder / f
                dest_file = temp_dir / f
                dest_file.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src_file, dest_file)
        
        console.print(f"  [green]OK[/] Copied {len(local_files)} files to temp git repo.")

        # Setup LFS and commit
        with console.status("[cyan]Committing and pushing via Git LFS...[/]"):
            subprocess.run(["git", "lfs", "install"], cwd=str(temp_dir), check=True, capture_output=True)
            subprocess.run(["git", "lfs", "track", "*.keras"], cwd=str(temp_dir), check=True, capture_output=True)
            subprocess.run(["git", "add", ".gitattributes"], cwd=str(temp_dir), check=True, capture_output=True)
            subprocess.run(["git", "add", "-A"], cwd=str(temp_dir), check=True, capture_output=True)
            
            # Check if there are changes
            status = subprocess.run(["git", "status", "--porcelain"], cwd=str(temp_dir), capture_output=True, text=True)
            if not status.stdout.strip():
                console.print("  [yellow]No changes detected. Repository is up-to-date.[/]")
            else:
                subprocess.run(["git", "commit", "-m", "Deploy update from deploy.py (Git LFS)"], cwd=str(temp_dir), check=True, capture_output=True)
                # Configure HTTP buffer for large pushes
                subprocess.run(["git", "config", "http.postBuffer", "524288000"], cwd=str(temp_dir))
                subprocess.run(["git", "config", "http.version", "HTTP/1.1"], cwd=str(temp_dir))
                
                push_result = subprocess.run(["git", "push", "origin", "main"], cwd=str(temp_dir), capture_output=True, text=True)
                if push_result.returncode != 0:
                    raise Exception(push_result.stderr)
                console.print("  [green]OK[/] Pushed successfully via Git.")

    except Exception as e:
        console.print(Panel(f"[red]Upload gagal:[/]
{e}", border_style="red", title="Error"))
        sys.exit(1)
    finally:
        if temp_dir.exists():
            shutil.rmtree(temp_dir, ignore_errors=True)

    console.print()
    console.print(Panel(
        f"[bold green]Upload selesai![/]

  Mode    : [yellow]GIT LFS SYNC[/]
  URL     : https://huggingface.co/spaces/{repo_id}",
        border_style="green",
        title="SUCCESS",
        padding=(1, 3),
    ))


def _getch_windows():
    ch = msvcrt.getwch()
    if ch in ("\x00", "\xe0"):
        ch2 = msvcrt.getwch()
        return {"H": "UP", "P": "DOWN", "M": "RIGHT", "K": "LEFT"}.get(ch2, ch2)
    if ch == "\r":
        return "ENTER"
    if ch == "\x03":
        raise KeyboardInterrupt
    return ch


def _getch_unix():
    fd  = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        ch = sys.stdin.read(1)
        if ch == "\x1b":
            ch2 = sys.stdin.read(2)
            return {"[A": "UP", "[B": "DOWN", "[C": "RIGHT", "[D": "LEFT"}.get(ch2, ch2)
        if ch in ("\r", "\n"):
            return "ENTER"
        if ch == "\x03":
            raise KeyboardInterrupt
        return ch
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)


def getch():
    return _getch_windows() if IS_WINDOWS else _getch_unix()


def print_banner(username: str):
    console.clear()
    console.print(Align.center(BANNER))
    console.print(Align.center(f"[dim]Logged in as [bold cyan]{username}[/][/]"))
    console.print()


def arrow_menu(title: str, options: list[str], subtitle: str = "") -> int:
    selected = 0

    def render(sel: int) -> Panel:
        grid = Table.grid(padding=(0, 2))
        grid.add_column(width=3)
        grid.add_column()
        for i, opt in enumerate(options):
            if i == sel:
                grid.add_row(Text("▶", style="bold cyan"), Text(opt, style="bold white on dark_blue"))
            else:
                grid.add_row(Text(" "), Text(opt, style="dim white"))
        inner = Table.grid()
        inner.add_row(Align.left(grid))
        inner.add_row(Text("\n  ↑↓ Navigate   Enter Select   Q Quit", style="dim italic"))
        header = f"[bold cyan]{title}[/]"
        if subtitle:
            header += f"\n[dim]{subtitle}[/]"
        return Panel(inner, title=header, border_style="cyan", padding=(1, 3))

    with Live(render(selected), console=console, refresh_per_second=30) as live:
        while True:
            key = getch()
            if key == "UP":
                selected = (selected - 1) % len(options)
            elif key == "DOWN":
                selected = (selected + 1) % len(options)
            elif key == "ENTER":
                live.stop()
                return selected
            elif key.lower() == "q":
                live.stop()
                return -1
            live.update(render(selected))


def get_authenticated_api() -> tuple[HfApi, str]:
    api = HfApi()
    try:
        user = api.whoami()
        return api, user["name"]
    except Exception:
        console.print(Panel(
            "[red]Tidak terautentikasi.[/]\n\nJalankan: [bold]hf auth login[/]",
            border_style="red",
            title="Auth Error",
        ))
        sys.exit(1)


def fetch_spaces(api: HfApi, username: str) -> list[SpaceInfo]:
    with console.status("[cyan]Mengambil daftar Spaces...[/]"):
        return list(api.list_spaces(author=username))


def print_spaces_table(spaces: list[SpaceInfo], username: str):
    table = Table(
        title=f"HF Spaces — {username}",
        box=box.ROUNDED,
        border_style="cyan",
        show_lines=True,
        header_style="bold magenta",
    )
    table.add_column("#",          justify="right", style="dim",       width=4)
    table.add_column("Space ID",   style="bold cyan", no_wrap=True)
    table.add_column("SDK",        style="yellow",   width=10)
    table.add_column("Visibility", justify="center", width=10)
    table.add_column("URL",        style="blue dim")
    for i, space in enumerate(spaces, 1):
        sdk        = getattr(space, "sdk", "-") or "-"
        visibility = "private" if getattr(space, "private", False) else "public"
        url        = f"https://huggingface.co/spaces/{space.id}"
        table.add_row(str(i), space.id, sdk, visibility, url)
    console.print()
    console.print(table)
    console.print()


def flow_watch(api: HfApi, username: str):
    spaces = fetch_spaces(api, username)
    if not spaces:
        console.print("[red]Tidak ada Space.[/]")
        Prompt.ask("[dim]Enter untuk kembali[/]", default="")
        return

    print_banner(username)
    idx = arrow_menu(
        title="Pilih Space untuk di-watch",
        options=[s.id for s in spaces],
        subtitle="Status diperbarui setiap 3 detik   Q untuk keluar",
    )
    if idx == -1:
        return

    repo_id  = spaces[idx].id
    interval = 3

    def fetch_stage() -> tuple[str, str]:
        try:
            import requests
            headers = {"Cache-Control": "no-cache"}
            if getattr(api, "token", None):
                headers["Authorization"] = f"Bearer {api.token}"
            url = f"https://huggingface.co/api/spaces/{repo_id}?t={int(time.time())}"
            resp = requests.get(url, headers=headers, timeout=5)
            resp.raise_for_status()
            data = resp.json()
            rt    = data.get("runtime", {})
            stage = rt.get("stage", "UNKNOWN") or "UNKNOWN"
            err   = rt.get("error_message", None) or ""
            return stage, err
        except Exception as e:
            return "UNKNOWN", str(e)

    def make_panel(stage: str, err: str, elapsed: int) -> Panel:
        style   = STAGE_STYLE.get(stage, "white")
        content = Table.grid(padding=(0, 2))
        content.add_column(style="dim cyan", width=14)
        content.add_column()
        content.add_row("Space",   f"[bold]{repo_id}[/]")
        content.add_row("Status",  f"[{style}]{stage}[/]")
        content.add_row("Elapsed", f"{elapsed}s")
        if err:
            content.add_row("Error", f"[red]{err}[/]")
        content.add_row("", "")
        content.add_row("", f"[dim]Q untuk keluar   refresh setiap {interval}s[/]")
        return Panel(content, title=f"[bold cyan]SPACE WATCH — {repo_id}[/]", border_style="cyan", padding=(1, 3))

    stop_event = threading.Event()
    start_time = time.time()

    print_banner(username)
    with Live(make_panel("...", "", 0), console=console, refresh_per_second=2) as live:
        def poll():
            while not stop_event.is_set():
                stage, err = fetch_stage()
                elapsed    = int(time.time() - start_time)
                live.update(make_panel(stage, err, elapsed))
                stop_event.wait(interval)

        t = threading.Thread(target=poll, daemon=True)
        t.start()
        try:
            while True:
                key = getch()
                if key.lower() == "q":
                    break
        except KeyboardInterrupt:
            pass
        finally:
            stop_event.set()
            t.join(timeout=2)


def flow_inspect(api: HfApi, username: str):
    print_banner(username)
    spaces = fetch_spaces(api, username)
    if not spaces:
        console.print("[yellow]Tidak ada Space ditemukan.[/]")
    else:
        print_spaces_table(spaces, username)
    Prompt.ask("[dim]Enter untuk kembali[/]", default="")


def flow_preview_ignore(username: str):
    print_banner(username)
    console.print(Rule("[bold cyan]PREVIEW IGNORE PATTERNS[/]"))
    folder_input = Prompt.ask("Path folder project", default=str(Path.cwd()))
    folder = Path(folder_input).expanduser().resolve()
    if not folder.exists():
        console.print(f"[red]Folder tidak ditemukan:[/] {folder}")
        Prompt.ask("[dim]Enter untuk kembali[/]", default="")
        return
    patterns, counts = load_ignore_patterns(folder)
    table = Table(box=box.SIMPLE_HEAVY, header_style="bold magenta", show_lines=False)
    table.add_column("#",       justify="right", style="dim", width=4)
    table.add_column("Pattern", style="green")
    for i, p in enumerate(patterns, 1):
        table.add_row(str(i), p)
    console.print(table)
    console.print()
    console.print(f"  [cyan].huggingfaceignore[/]  {counts['rule_count']} patterns")
    Prompt.ask("\n[dim]Enter untuk kembali[/]", default="")


def flow_upload(api: HfApi, username: str):
    print_banner(username)
    console.print(Rule("[bold cyan]UPLOAD / REDEPLOY SPACE[/]"))

    folder_input = Prompt.ask("\nPath folder project", default=str(Path.cwd()))
    folder = Path(folder_input).expanduser().resolve()
    if not folder.exists():
        console.print(f"[red]Folder tidak ditemukan:[/] {folder}")
        Prompt.ask("[dim]Enter untuk kembali[/]", default="")
        return

    spaces = fetch_spaces(api, username)
    if not spaces:
        console.print("[red]Tidak ada Space ditemukan.[/]")
        Prompt.ask("[dim]Enter untuk kembali[/]", default="")
        return

    print_banner(username)
    idx = arrow_menu(
        title="Pilih Target Space",
        options=[s.id for s in spaces] + ["Ketik manual"],
        subtitle=f"Logged in as {username}",
    )
    if idx == -1:
        return

    repo_id = Prompt.ask("Repo ID") if idx == len(spaces) else spaces[idx].id

    sdk = "docker"
    try:
        info = api.space_info(repo_id)
        sdk  = getattr(info, "sdk", None) or "docker"
    except Exception:
        pass

    print_banner(username)
    console.print(Rule("[bold cyan]PILIH MODE UPLOAD[/]"))
    console.print()
    mode_idx = arrow_menu(
        title="Upload Mode",
        options=[
            "SYNC  — Upload + hapus file remote yang tidak ada di lokal  [RECOMMENDED]",
            "ADDITIVE — Upload saja, tidak hapus apapun",
        ],
        subtitle="SYNC menjamin HF = lokal persis",
    )
    if mode_idx == -1:
        return
    mode = "sync" if mode_idx == 0 else "additive"

    print_banner(username)
    console.print(Rule("[bold cyan]KONFIGURASI UPLOAD[/]"))

    workers_str = Prompt.ask("\nJumlah upload workers", default="4")
    try:
        workers = max(1, int(workers_str))
    except ValueError:
        workers = 4

    patterns, counts = load_ignore_patterns(folder)

    console.print()
    summary = Table(box=box.SIMPLE, show_header=False, padding=(0, 2))
    summary.add_column(style="dim cyan", width=24)
    summary.add_column(style="bold white")
    summary.add_row("Target Space",         repo_id)
    summary.add_row("SDK",                  sdk)
    summary.add_row("Mode",                 f"[yellow]{mode.upper()}[/]")
    summary.add_row("Folder",               str(folder))
    summary.add_row("Workers",              str(workers))
    summary.add_row("Ignore patterns",      f"{counts['rule_count']} rules")
    console.print(Panel(summary, title="[bold]Upload Summary[/]", border_style="cyan"))
    console.print()

    if mode == "sync":
        console.print(Panel(
            "[yellow]⚠  Mode SYNC akan MENGHAPUS file di HF yang tidak ada di lokal.\n"
            "   Pastikan lokal kamu adalah source of truth.[/]",
            border_style="yellow",
        ))
        console.print()

    if not Confirm.ask("Lanjutkan upload?", default=True):
        console.print("[yellow]Dibatalkan.[/]")
        Prompt.ask("[dim]Enter untuk kembali[/]", default="")
        return

    console.print()
    run_upload(api, repo_id, folder, patterns, workers, sdk, mode=mode)
    Prompt.ask("\n[dim]Enter untuk kembali ke menu[/]", default="")


def flow_secrets(api: HfApi, username: str):
    print_banner(username)
    console.print(Rule("[bold cyan]MANAGE SPACE SECRETS[/]"))

    spaces = fetch_spaces(api, username)
    if not spaces:
        console.print("[red]Tidak ada Space.[/]")
        Prompt.ask("[dim]Enter untuk kembali[/]", default="")
        return

    print_banner(username)
    idx = arrow_menu(
        title="Pilih Space",
        options=[s.id for s in spaces],
        subtitle="Manage environment secrets",
    )
    if idx == -1:
        return

    repo_id = spaces[idx].id

    SECRET_ACTIONS = [
        "Push secrets from .env file",
        "Set single secret",
        "Delete a secret",
        "Kembali",
    ]

    while True:
        print_banner(username)
        console.print(f"[dim]Space: {repo_id}[/]\n")
        action = arrow_menu(title="Secret Actions", options=SECRET_ACTIONS)

        if action == -1 or action == 3:
            return

        elif action == 0:
            print_banner(username)
            env_path = Prompt.ask("Path to .env file", default=".env.spaces")
            p = Path(env_path).expanduser().resolve()
            if not p.exists():
                console.print(f"[red]File tidak ditemukan:[/] {p}")
                Prompt.ask("[dim]Enter[/]", default="")
                continue

            secrets: dict[str, str] = {}
            with open(p, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        key, _, val = line.partition("=")
                        key = key.strip()
                        val = val.strip().strip('"').strip("'")
                        if val and val not in ("set-via-hf-secrets", "<CHANGE_THIS>", ""):
                            secrets[key] = val

            if not secrets:
                console.print("[yellow]No valid secrets found in file.[/]")
                Prompt.ask("[dim]Enter[/]", default="")
                continue

            table = Table(box=box.SIMPLE, header_style="bold magenta")
            table.add_column("Key", style="cyan")
            table.add_column("Value (preview)", style="dim")
            for k, v in secrets.items():
                preview = v[:20] + "..." if len(v) > 20 else v
                table.add_row(k, preview)
            console.print(table)
            console.print(f"\n[bold]{len(secrets)}[/] secrets will be pushed to [cyan]{repo_id}[/]")

            if not Confirm.ask("Lanjutkan?", default=True):
                continue

            with console.status("[cyan]Pushing secrets...[/]"):
                for key, value in secrets.items():
                    api.add_space_secret(repo_id=repo_id, key=key, value=value)
            console.print(f"[green][OK] {len(secrets)} secrets pushed.[/] Space will rebuild.")
            Prompt.ask("[dim]Enter[/]", default="")

        elif action == 1:
            print_banner(username)
            key = Prompt.ask("Secret key")
            if not key:
                continue
            value = Prompt.ask(f"Value for {key}", password=True)
            if not value:
                continue
            with console.status(f"[cyan]Setting {key}...[/]"):
                api.add_space_secret(repo_id=repo_id, key=key, value=value)
            console.print(f"[green][OK] {key} set.[/] Space will rebuild.")
            Prompt.ask("[dim]Enter[/]", default="")

        elif action == 2:
            print_banner(username)
            key = Prompt.ask("Secret key to delete")
            if not key:
                continue
            if Confirm.ask(f"Delete [red]{key}[/] from {repo_id}?", default=False):
                with console.status(f"[cyan]Deleting {key}...[/]"):
                    api.delete_space_secret(repo_id=repo_id, key=key)
                console.print(f"[green][OK] {key} deleted.[/]")
            Prompt.ask("[dim]Enter[/]", default="")


def _list_space_secrets(api: HfApi, repo_id: str) -> list[str]:
    try:
        if hasattr(api, "list_space_secrets"):
            return [s.key for s in api.list_space_secrets(repo_id=repo_id)]
        import requests
        token = getattr(api, "token", None)
        if not token:
            from huggingface_hub import HfFolder
            token = HfFolder.get_token()
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        resp = requests.get(f"https://huggingface.co/api/spaces/{repo_id}/secrets", headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return list(data.keys())
        return []
    except Exception:
        return []


def flow_inspect_secrets(api: HfApi, username: str):
    print_banner(username)
    console.print(Rule("[bold cyan]INSPECT SPACE SECRETS[/]"))

    spaces = fetch_spaces(api, username)
    if not spaces:
        console.print("[red]Tidak ada Space ditemukan.[/]")
        Prompt.ask("[dim]Enter untuk kembali[/]", default="")
        return

    print_banner(username)
    idx = arrow_menu(
        title="Pilih Space untuk di-inspect",
        options=[s.id for s in spaces],
        subtitle="Melihat daftar secret key yang terpasang",
    )
    if idx == -1:
        return

    repo_id = spaces[idx].id

    with console.status(f"[cyan]Mengambil data secret dari {repo_id}...[/]"):
        keys = _list_space_secrets(api, repo_id)

    table = Table(
        title=f"Secrets — {repo_id}",
        box=box.ROUNDED,
        border_style="cyan",
        header_style="bold magenta",
    )
    table.add_column("#",          justify="right", style="dim", width=4)
    table.add_column("Secret Key", style="bold cyan")
    table.add_column("Value",      style="dim", justify="center")

    if not keys:
        table.add_row("-", "No secrets found or access denied", "-")
    else:
        for i, key in enumerate(keys, 1):
            table.add_row(str(i), key, "[italic]********[/]")

    console.print()
    console.print(table)
    console.print(f"\n[dim]Total: {len(keys)} secrets terpasang.[/]")
    Prompt.ask("\n[dim]Enter untuk kembali[/]", default="")


def flow_audit_remote_env(api: HfApi, username: str):
    print_banner(username)
    console.print(Rule("[bold orange3]AUDIT REMOTE ENVIRONMENT[/]"))

    spaces = fetch_spaces(api, username)
    if not spaces:
        return

    idx = arrow_menu(
        title="Pilih Space untuk di-Audit",
        options=[s.id for s in spaces],
        subtitle="Mengambil nilai env langsung dari runtime API",
    )
    if idx == -1:
        return

    repo_id  = spaces[idx].id
    info     = api.space_info(repo_id)
    base_url = info.host
    if not base_url:
        console.print("[red]Space host tidak ditemukan. Pastikan Space dalam keadaan RUNNING.[/]")
        Prompt.ask("[dim]Enter untuk kembali[/]")
        return

    token = Prompt.ask("[yellow]Admin JWT Token[/]", password=True)
    if not token:
        return

    with console.status(f"[cyan]Menghubungi {base_url}...[/]"):
        try:
            import requests
            resp = requests.get(
                f"{base_url}/api/v1/health/admin/env",
                headers={"Authorization": f"Bearer {token}"},
                timeout=15,
            )
            if resp.status_code != 200:
                console.print(f"[red]Gagal:[/] HTTP {resp.status_code} - {resp.text}")
                Prompt.ask("[dim]Enter untuk kembali[/]")
                return
            env_data = resp.json()
        except Exception as e:
            console.print(f"[red]Error koneksi:[/] {e}")
            Prompt.ask("[dim]Enter untuk kembali[/]")
            return

    table = Table(title=f"Live Audit — {repo_id}", box=box.HORIZONTALS, border_style="orange3")
    table.add_column("Environment Variable", style="bold cyan")
    table.add_column("Active Value",         style="green")
    for k, v in sorted(env_data.items()):
        table.add_row(k, str(v))

    console.print()
    console.print(table)
    console.print(f"\n[dim]Source: {base_url}/api/v1/health/admin/env[/]")
    Prompt.ask("\n[dim]Enter untuk kembali[/]")


def interactive_mode(api: HfApi, username: str):
    while True:
        print_banner(username)
        choice = arrow_menu(
            title="MAIN MENU",
            options=MAIN_MENU_OPTIONS,
            subtitle="↑↓ navigasi   Enter pilih   Q keluar",
        )
        if choice == -1 or choice == 7:
            console.clear()
            sys.exit(0)
        elif choice == 0:
            flow_upload(api, username)
        elif choice == 1:
            flow_watch(api, username)
        elif choice == 2:
            flow_secrets(api, username)
        elif choice == 3:
            flow_inspect_secrets(api, username)
        elif choice == 4:
            flow_audit_remote_env(api, username)
        elif choice == 5:
            flow_inspect(api, username)
        elif choice == 6:
            flow_preview_ignore(username)


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="HF Space Deployer — Sync & Additive modes",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python deploy.py
  python deploy.py --repo user/space --mode sync
  python deploy.py --repo user/space --mode additive
  python deploy.py --repo user/space --secrets .env.spaces
  python deploy.py --inspect
        """,
    )
    p.add_argument("--repo",    "-r", metavar="USERNAME/SPACE")
    p.add_argument("--folder",  "-f", metavar="PATH", default=None)
    p.add_argument("--workers", "-w", type=int, default=4, metavar="N")
    p.add_argument(
        "--mode", "-m",
        choices=["sync", "additive"],
        default="sync",
        help="Upload mode: sync (default) hapus file stale, additive tidak hapus",
    )
    p.add_argument("--inspect",       action="store_true")
    p.add_argument("--secrets", "-s", metavar="ENV_FILE")
    p.add_argument("--list-secrets",  action="store_true")
    return p


def main():
    args          = build_parser().parse_args()
    api, username = get_authenticated_api()

    if args.inspect:
        spaces = fetch_spaces(api, username)
        print_spaces_table(spaces, username)
        sys.exit(0)

    if args.repo:
        repo_id = args.repo

        if args.list_secrets:
            with console.status(f"[cyan]Mengambil data secret dari {repo_id}...[/]"):
                keys = _list_space_secrets(api, repo_id)
            table = Table(title=f"Secrets — {repo_id}", box=box.ROUNDED, border_style="cyan")
            table.add_column("#", justify="right", style="dim")
            table.add_column("Secret Key", style="bold cyan")
            for i, k in enumerate(keys, 1):
                table.add_row(str(i), k)
            console.print(table)
            sys.exit(0)

        folder = Path(args.folder or ".").expanduser().resolve()

        if args.secrets:
            import re
            p = Path(args.secrets).expanduser().resolve()
            if not p.exists():
                console.print(f"[red]File tidak ditemukan:[/] {p}")
                sys.exit(1)
            secrets: dict[str, str] = {}
            with open(p, encoding="utf-8", errors="ignore") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        key, _, val = line.partition("=")
                        key = key.strip()
                        if not re.match(r"^[a-zA-Z][_a-zA-Z0-9]*$", key):
                            continue
                        val = val.strip().strip('"').strip("'")
                        if val and val not in ("set-via-hf-secrets", "<CHANGE_THIS>", ""):
                            secrets[key] = val
            if secrets:
                console.print(f"[cyan]Pushing {len(secrets)} valid secrets to {repo_id}...[/]")
                with console.status("[cyan]Pushing secrets...[/]"):
                    for key, value in secrets.items():
                        try:
                            api.add_space_secret(repo_id=repo_id, key=key, value=value)
                        except Exception as e:
                            console.print(f"  [yellow]Skipped {key}:[/] {str(e)[:50]}...")
                console.print("[green][OK] Secrets sync completed.[/]")
            else:
                console.print("[yellow]No valid secrets found in file.[/]")
            if not args.folder:
                sys.exit(0)

        if not folder.exists():
            console.print(f"[red]Folder tidak ditemukan:[/] {folder}")
            sys.exit(1)

        patterns, counts = load_ignore_patterns(folder)
        sdk = "docker"
        try:
            info = api.space_info(args.repo)
            sdk  = getattr(info, "sdk", None) or "docker"
        except Exception:
            pass

        console.clear()
        console.print(Align.center(BANNER))
        summary = Table(box=box.SIMPLE, show_header=False, padding=(0, 2))
        summary.add_column(style="dim cyan", width=24)
        summary.add_column(style="bold white")
        summary.add_row("Target Space",         args.repo)
        summary.add_row("SDK",                  sdk)
        summary.add_row("Mode",                 f"[yellow]{args.mode.upper()}[/]")
        summary.add_row("Folder",               str(folder))
        summary.add_row("Workers",              str(args.workers))
        summary.add_row("Ignore patterns",      f"{counts['rule_count']} rules")
        console.print(Panel(summary, title="[bold]Non-Interactive Upload[/]", border_style="cyan"))
        console.print()
        run_upload(api, args.repo, folder, patterns, args.workers, sdk, mode=args.mode)
        sys.exit(0)

    try:
        interactive_mode(api, username)
    except KeyboardInterrupt:
        console.clear()
        sys.exit(0)


if __name__ == "__main__":
    main()