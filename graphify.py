from __future__ import annotations

import ast
import fnmatch
import hashlib
import json
import re
import sys
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import typer
import yaml
from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.progress import (
    BarColumn,
    Progress,
    SpinnerColumn,
    TextColumn,
    TimeElapsedColumn,
)
from rich.prompt import Confirm, IntPrompt, Prompt
from rich.rule import Rule
from rich.table import Table
from rich.text import Text

console = Console()
app = typer.Typer(add_completion=False, no_args_is_help=False)

BANNER = r"""
   ██████╗ ██████╗  █████╗ ██████╗ ██╗  ██╗██╗███████╗██╗   ██╗
  ██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██║  ██║██║██╔════╝╚██╗ ██╔╝
  ██║  ███╗██████╔╝███████║██████╔╝███████║██║█████╗   ╚████╔╝
  ██║   ██║██╔══██╗██╔══██║██╔═══╝ ██╔══██║██║██╔══╝    ╚██╔╝
  ╚██████╔╝██║  ██║██║  ██║██║     ██║  ██║██║██║        ██║
   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝╚═╝        ╚═╝
"""

CONFIG_FILE = ".graphify.yaml"
HASH_FILE = ".graphify_hashes.json"
OUTPUT_FILE = "graphify_map.json"
ERROR_LOG = "graphify_errors.log"

_STDLIB: set[str] = (
    sys.stdlib_module_names
    if hasattr(sys, "stdlib_module_names")
    else {
        "os",
        "sys",
        "re",
        "json",
        "ast",
        "math",
        "io",
        "abc",
        "typing",
        "pathlib",
        "collections",
        "itertools",
        "functools",
        "datetime",
        "hashlib",
        "logging",
        "threading",
        "multiprocessing",
        "subprocess",
        "socket",
        "http",
        "urllib",
        "email",
        "html",
        "xml",
        "csv",
        "sqlite3",
        "unittest",
        "dataclasses",
        "enum",
        "copy",
        "time",
        "string",
        "struct",
        "warnings",
        "weakref",
        "gc",
        "inspect",
        "contextlib",
        "operator",
        "random",
        "shutil",
        "tempfile",
        "textwrap",
    }
)


@dataclass
class Configuration:
    max_depth: int = 3
    include_stdlib: bool = False
    exclude_patterns: list[str] = field(
        default_factory=lambda: ["venv", "__pycache__", ".git", "tests", "*.egg-info"]
    )
    min_fan_in: int = 10
    target_dir: str = "."

    def to_dict(self) -> dict[str, Any]:
        return {
            "max_depth": self.max_depth,
            "include_stdlib": self.include_stdlib,
            "exclude_patterns": self.exclude_patterns,
            "min_fan_in": self.min_fan_in,
            "target_dir": self.target_dir,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Configuration:
        valid = {k: v for k, v in data.items() if k in cls.__dataclass_fields__}
        return cls(**valid)

    def save(self, path: Path) -> None:
        path.write_text(yaml.dump(self.to_dict(), default_flow_style=False))

    @classmethod
    def load(cls, path: Path) -> Configuration:
        return cls.from_dict(yaml.safe_load(path.read_text()))


@dataclass
class FunctionNode:
    qualified_name: str
    file_path: str
    raw_calls: list[str] = field(default_factory=list)
    calls: list[str] = field(default_factory=list)
    called_by: list[str] = field(default_factory=list)


class ASTParser(ABC):
    @abstractmethod
    def parse(self, file_path: Path, config: Configuration) -> list[FunctionNode]: ...


class _PythonVisitor(ast.NodeVisitor):
    def __init__(self, file_path: str, config: Configuration):
        self._file = file_path
        self._config = config
        self._nodes: dict[str, FunctionNode] = {}
        self._scope: list[str] = []
        self._class_stack: list[str] = []

    def _qualified(self, name: str) -> str:
        return f"{self._file}::{name}"

    def _is_stdlib(self, name: str) -> bool:
        return name.split(".")[0] in _STDLIB

    def _resolve_name(self, node: ast.Call) -> str | None:
        if isinstance(node.func, ast.Name):
            return node.func.id
        if isinstance(node.func, ast.Attribute):
            parts: list[str] = []
            cur = node.func
            while isinstance(cur, ast.Attribute):
                parts.append(cur.attr)
                cur = cur.value
            if isinstance(cur, ast.Name):
                parts.append(cur.id)
            return ".".join(reversed(parts))
        return None

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        self._class_stack.append(node.name)
        self.generic_visit(node)
        self._class_stack.pop()

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        short = (
            f"{self._class_stack[-1]}.{node.name}" if self._class_stack else node.name
        )
        qname = self._qualified(short)
        self._nodes[qname] = FunctionNode(qname, self._file)
        self._scope.append(qname)
        self.generic_visit(node)
        self._scope.pop()

    visit_AsyncFunctionDef = visit_FunctionDef

    def visit_Call(self, node: ast.Call) -> None:
        if not self._scope or len(self._scope) > self._config.max_depth:
            self.generic_visit(node)
            return
        raw = self._resolve_name(node)
        if raw is None or (not self._config.include_stdlib and self._is_stdlib(raw)):
            self.generic_visit(node)
            return
        self._nodes[self._scope[-1]].raw_calls.append(raw)
        self.generic_visit(node)

    def result(self) -> list[FunctionNode]:
        return list(self._nodes.values())


class PythonASTParser(ASTParser):
    def parse(self, file_path: Path, config: Configuration) -> list[FunctionNode]:
        source = file_path.read_text(encoding="utf-8", errors="replace")
        tree = ast.parse(source, filename=str(file_path))
        visitor = _PythonVisitor(str(file_path), config)
        visitor.visit(tree)
        return visitor.result()


class ParserRegistry:
    _registry: dict[str, ASTParser] = {".py": PythonASTParser()}

    @classmethod
    def get(cls, suffix: str) -> ASTParser | None:
        return cls._registry.get(suffix)

    @classmethod
    def extensions(cls) -> set[str]:
        return set(cls._registry.keys())


class FileSystemScanner:
    def __init__(self, config: Configuration):
        self._config = config
        self._patterns = self._compile(config.exclude_patterns)

    @staticmethod
    def _compile(raw: list[str]) -> list[re.Pattern]:
        results = []
        for p in raw:
            if any(c in p for c in ("*", "?", "[")):
                results.append(re.compile(fnmatch.translate(p), re.IGNORECASE))
            else:
                results.append(re.compile(f"^{re.escape(p)}$", re.IGNORECASE))
        return results

    def _excluded(self, rel: Path) -> bool:
        for part in rel.parts:
            for pat in self._patterns:
                if pat.match(part):
                    return True
        return False

    def scan(self) -> list[Path]:
        root = Path(self._config.target_dir).resolve()
        exts = ParserRegistry.extensions()
        found: list[Path] = []
        for f in root.rglob("*"):
            if f.is_file() and f.suffix in exts:
                try:
                    rel = f.relative_to(root)
                except ValueError:
                    continue
                if not self._excluded(rel):
                    found.append(f)
        return sorted(found)


class HashStore:
    def __init__(self, path: Path):
        self._path = path
        self._data: dict[str, str] = {}

    def load(self) -> None:
        if self._path.exists():
            self._data = json.loads(self._path.read_text())

    def save(self) -> None:
        self._path.write_text(json.dumps(self._data, indent=2))

    @staticmethod
    def compute(file: Path) -> str:
        return hashlib.md5(file.read_bytes()).hexdigest()

    def get(self, key: str) -> str | None:
        return self._data.get(key)

    def put(self, key: str, value: str) -> None:
        self._data[key] = value

    def drop(self, key: str) -> None:
        self._data.pop(key, None)

    def keys(self) -> set[str]:
        return set(self._data.keys())


class IncrementalEngine:
    def __init__(self, store: HashStore):
        self._store = store

    def diff(self, files: list[Path]) -> tuple[list[Path], list[str]]:
        current = {str(f) for f in files}
        removed = list(self._store.keys() - current)
        changed = [f for f in files if self._store.get(str(f)) != HashStore.compute(f)]
        return changed, removed


class GraphBuilder:
    def __init__(self, config: Configuration):
        self._config = config
        self._nodes: dict[str, FunctionNode] = {}

    def add(self, nodes: list[FunctionNode]) -> None:
        for n in nodes:
            self._nodes[n.qualified_name] = n

    def remove_by_file(self, file_path: str) -> None:
        for k in [k for k, v in self._nodes.items() if v.file_path == file_path]:
            del self._nodes[k]

    def finalize(self) -> None:
        self._resolve_calls()
        self._build_called_by()
        self._prune_utilities()

    def _resolve_calls(self) -> None:
        short_index: dict[str, list[str]] = {}
        for qname in self._nodes:
            short = qname.split("::")[-1]
            short_index.setdefault(short, []).append(qname)

        for node in self._nodes.values():
            resolved: list[str] = []
            for raw in node.raw_calls:
                tail = raw.split(".")[-1]
                matches = short_index.get(tail, [])
                resolved.extend(matches if matches else [raw])
            node.calls = list(dict.fromkeys(resolved))

    def _build_called_by(self) -> None:
        for node in self._nodes.values():
            node.called_by = []
        for node in self._nodes.values():
            for callee in node.calls:
                if callee in self._nodes:
                    self._nodes[callee].called_by.append(node.qualified_name)
        for node in self._nodes.values():
            node.called_by = list(dict.fromkeys(node.called_by))

    def _prune_utilities(self) -> None:
        fan_in: dict[str, int] = {}
        for node in self._nodes.values():
            for c in node.calls:
                fan_in[c] = fan_in.get(c, 0) + 1
        utilities = {k for k, v in fan_in.items() if v >= self._config.min_fan_in}
        for node in self._nodes.values():
            node.calls = [c for c in node.calls if c not in utilities]

    def nodes(self) -> dict[str, FunctionNode]:
        return self._nodes


class JSONExporter:
    def __init__(self, config: Configuration, path: Path):
        self._config = config
        self._path = path

    def export(self, nodes: dict[str, FunctionNode]) -> None:
        payload: dict[str, Any] = {
            "metadata": {
                "version": "1.0",
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "hyperparameters": {
                    "max_depth": self._config.max_depth,
                    "include_stdlib": self._config.include_stdlib,
                    "min_fan_in": self._config.min_fan_in,
                    "exclude_patterns": self._config.exclude_patterns,
                },
            },
            "nodes": {
                qname: {
                    "type": "function",
                    "file": n.file_path,
                    "raw_calls": n.raw_calls,
                    "calls": n.calls,
                    "called_by": n.called_by,
                }
                for qname, n in nodes.items()
            },
        }
        self._path.write_text(json.dumps(payload, indent=2))


class ErrorLogger:
    def __init__(self, path: Path):
        self._path = path
        self._entries: list[str] = []

    def log(self, file: Path, error: Exception) -> None:
        self._entries.append(
            f"[{datetime.now().isoformat()}] {file}: {type(error).__name__}: {error}"
        )
        console.print(
            f"  [yellow]⚠[/yellow] Skipped [dim]{file.name}[/dim] — "
            f"[red]{type(error).__name__}[/red]"
        )

    def flush(self) -> None:
        if self._entries:
            with self._path.open("a") as fh:
                fh.write("\n".join(self._entries) + "\n")


class InteractiveWizard:
    def run(self) -> Configuration:
        config = Configuration()
        console.print()
        console.print(
            Panel.fit(
                "[bold cyan]Hyperparameter Wizard[/bold cyan]\n"
                "[dim]Configure how Graphify maps your codebase[/dim]",
                border_style="cyan",
                padding=(0, 4),
            )
        )
        console.print()

        config.target_dir = Prompt.ask("[bold]Target directory[/bold]", default=".")
        config.max_depth = IntPrompt.ask(
            "[bold]Max call depth[/bold]  [dim]prevents infinite recursion in the call graph[/dim]",
            default=3,
        )
        config.include_stdlib = Confirm.ask(
            "[bold]Include stdlib calls?[/bold]  [dim]os, sys, json, etc.[/dim]",
            default=False,
        )
        config.min_fan_in = IntPrompt.ask(
            "[bold]Min fan-in threshold[/bold]  [dim]prune functions called by ≥N callers as global utilities[/dim]",
            default=10,
        )
        raw = Prompt.ask(
            "[bold]Exclude patterns[/bold]  [dim]comma-separated, glob or plain name[/dim]",
            default="venv,__pycache__,.git,tests,*.egg-info",
        )
        config.exclude_patterns = [p.strip() for p in raw.split(",") if p.strip()]

        console.print()
        t = Table(
            title="Configuration Preview",
            box=box.ROUNDED,
            border_style="cyan",
            show_lines=True,
        )
        t.add_column("Parameter", style="bold cyan", no_wrap=True)
        t.add_column("Value", style="green")
        t.add_row("Target Directory", config.target_dir)
        t.add_row("Max Depth", str(config.max_depth))
        t.add_row("Include Stdlib", str(config.include_stdlib))
        t.add_row("Min Fan-In", str(config.min_fan_in))
        t.add_row("Exclude Patterns", ", ".join(config.exclude_patterns))
        console.print(t)
        console.print()
        return config


class PipelineRunner:
    def __init__(self, config: Configuration):
        self._config = config
        self._hash_store = HashStore(Path(HASH_FILE))
        self._exporter = JSONExporter(config, Path(OUTPUT_FILE))
        self._error_logger = ErrorLogger(Path(ERROR_LOG))

    def _parse(self, file: Path) -> list[FunctionNode]:
        parser = ParserRegistry.get(file.suffix)
        return parser.parse(file, self._config) if parser else []

    def _progress(self, label: str, total: int) -> tuple[Progress, Any]:
        p = Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeElapsedColumn(),
            console=console,
        )
        return p, p.add_task(label, total=total)

    def run_initial(self) -> None:
        files = FileSystemScanner(self._config).scan()
        console.print(
            f"\n  [bold green]↳[/bold green] [white]{len(files)}[/white] "
            f"[dim]file(s) discovered[/dim]\n"
        )

        builder = GraphBuilder(self._config)
        p, task = self._progress("[cyan]Parsing codebase...", len(files))

        with p:
            for f in files:
                try:
                    builder.add(self._parse(f))
                    self._hash_store.put(str(f), HashStore.compute(f))
                except Exception as e:
                    self._error_logger.log(f, e)
                p.advance(task)

        builder.finalize()
        self._exporter.export(builder.nodes())
        self._hash_store.save()
        self._error_logger.flush()
        self._stats(builder.nodes())

    def run_update(self) -> None:
        if not Path(HASH_FILE).exists():
            console.print(
                "[red]Hash store not found. Run [bold]init[/bold] first.[/red]"
            )
            raise typer.Exit(1)

        self._hash_store.load()
        files = FileSystemScanner(self._config).scan()
        engine = IncrementalEngine(self._hash_store)
        changed, removed = engine.diff(files)

        console.print(
            f"\n  [bold yellow]Δ[/bold yellow]  "
            f"[green]{len(changed)} changed[/green]   "
            f"[red]{len(removed)} removed[/red]\n"
        )

        if not changed and not removed:
            console.print("  [dim]Index is up to date — nothing to process.[/dim]\n")
            return

        existing = self._load_map()
        builder = GraphBuilder(self._config)

        changed_files = {str(f) for f in changed}
        for qname, data in existing.get("nodes", {}).items():
            if data["file"] not in removed and data["file"] not in changed_files:
                builder.add(
                    [
                        FunctionNode(
                            qname,
                            data["file"],
                            data.get("raw_calls", []),
                        )
                    ]
                )

        if changed:
            p, task = self._progress("[cyan]Re-parsing changed files...", len(changed))
            with p:
                for f in changed:
                    try:
                        builder.add(self._parse(f))
                        self._hash_store.put(str(f), HashStore.compute(f))
                    except Exception as e:
                        self._error_logger.log(f, e)
                    p.advance(task)

        for key in removed:
            self._hash_store.drop(key)

        builder.finalize()
        self._exporter.export(builder.nodes())
        self._hash_store.save()
        self._error_logger.flush()
        self._stats(builder.nodes())

    def _load_map(self) -> dict[str, Any]:
        p = Path(OUTPUT_FILE)
        return json.loads(p.read_text()) if p.exists() else {}

    def _stats(self, nodes: dict[str, FunctionNode]) -> None:
        console.print()
        console.print(Rule("[bold green]Complete[/bold green]", style="green"))
        t = Table(box=box.SIMPLE, show_header=False, padding=(0, 2))
        t.add_column(style="dim")
        t.add_column(style="bold white")
        t.add_row("Functions mapped", str(len(nodes)))
        t.add_row("Output", OUTPUT_FILE)
        t.add_row("Config", CONFIG_FILE)
        t.add_row("Hashes", HASH_FILE)
        console.print(t)
        console.print()


def _banner() -> None:
    console.print(Text(BANNER, style="bold cyan"))
    console.print(
        Panel.fit(
            "[bold white]AST-Powered Codebase Connection Map[/bold white]   [dim]for LLM Agents[/dim]\n"
            "[dim]Deterministic  ·  Local  ·  Zero AI Cost  ·  Zero Token Waste[/dim]",
            border_style="cyan",
            padding=(0, 6),
        )
    )
    console.print()


@app.callback(invoke_without_command=True)
def _root(ctx: typer.Context) -> None:
    if ctx.invoked_subcommand is None:
        _banner()
        console.print(
            "  [bold cyan]python graphify.py init[/bold cyan]    "
            "[dim]—  cold-start full scan[/dim]\n"
            "  [bold yellow]python graphify.py update[/bold yellow]  "
            "[dim]—  incremental warm-start[/dim]\n"
        )


@app.command()
def init(
    target: str = typer.Option(".", "--target", "-t", help="Root directory to scan"),
    yes: bool = typer.Option(False, "--yes", "-y", help="Skip wizard, accept defaults"),
) -> None:
    _banner()
    console.print(
        Rule("[bold cyan]init[/bold cyan]   Cold-Start Full Scan", style="cyan")
    )

    config_path = Path(CONFIG_FILE)

    if config_path.exists() and not yes:
        overwrite = Confirm.ask(
            f"[yellow]Existing {CONFIG_FILE} found. Reconfigure?[/yellow]",
            default=False,
        )
        config = (
            InteractiveWizard().run() if overwrite else Configuration.load(config_path)
        )
        if not overwrite:
            console.print(f"[dim]Using existing {CONFIG_FILE}[/dim]\n")
    elif yes:
        config = Configuration(target_dir=target)
    else:
        config = InteractiveWizard().run()

    if target != ".":
        config.target_dir = target

    config.save(config_path)
    PipelineRunner(config).run_initial()


@app.command()
def update() -> None:
    _banner()
    console.print(
        Rule(
            "[bold yellow]update[/bold yellow]   Incremental Warm-Start", style="yellow"
        )
    )

    config_path = Path(CONFIG_FILE)
    if not config_path.exists():
        console.print(
            f"[red]No {CONFIG_FILE} found. Run [bold]init[/bold] first.[/red]"
        )
        raise typer.Exit(1)

    config = Configuration.load(config_path)
    console.print(f"[dim]Config loaded from {CONFIG_FILE}[/dim]\n")
    PipelineRunner(config).run_update()


if __name__ == "__main__":
    app()
