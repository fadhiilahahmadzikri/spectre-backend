import io
import base64
import httpx
import numpy as np
import pandas as pd
from PIL import Image
from dataclasses import dataclass, field
from typing import Optional, Tuple, Dict, Any
import gradio as gr


@dataclass
class AppConfig:
    api_key: str = "spk_7b9ae30cd45a5b8e64eaa87755411b1c7d4366b14158f119"
    api_url: str = "http://localhost:8000/api/v1/faces"
    timeout: Optional[float] = 30.0
    redirect_on_auth: str = "https://www.youtube.com/shorts/USp-MU89SvE"
    classes: Tuple[str, ...] = field(default_factory=lambda: (
        "fake_mannequin", "fake_mask", "fake_papercut",
        "fake_printed", "fake_screen", "realperson",
    ))


CONFIG = AppConfig()


class ImageUtils:
    @staticmethod
    def to_b64(img_np: np.ndarray) -> str:
        if img_np is None:
            return ""
        img = Image.fromarray(img_np)
        if img.mode != "RGB":
            img = img.convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=95)
        return base64.b64encode(buf.getvalue()).decode("utf-8")


class TableUtils:
    @staticmethod
    def df_to_html(df: pd.DataFrame) -> str:
        rows_html = "".join(
            "<tr>" + "".join(f"<td>{v}</td>" for v in row) + "</tr>"
            for _, row in df.iterrows()
        )
        headers_html = "".join(f"<th>{col}</th>" for col in df.columns)
        return f"""
        <style>
            .spectre-table {{
                width: 100%; border-collapse: collapse;
                font-family: 'Share Tech Mono', monospace;
                font-size: 13px; color: #d0eaff; background: #0a1628;
            }}
            .spectre-table th {{
                background: #071a2e; color: #00d4ff;
                letter-spacing: 0.15em; text-transform: uppercase;
                font-size: 11px; padding: 10px 14px;
                border-bottom: 1px solid #1a3a5c; text-align: left;
            }}
            .spectre-table td {{
                padding: 9px 14px; border-bottom: 1px solid #0f1f36; color: #d0eaff;
            }}
            .spectre-table tr:hover td {{ background: #0f1f36; }}
            .spectre-empty {{
                padding: 20px; color: #5a7a9a;
                font-family: 'Share Tech Mono', monospace;
                font-size: 12px; text-align: center; letter-spacing: 0.1em;
            }}
        </style>
        <table class="spectre-table">
            <thead><tr>{headers_html}</tr></thead>
            <tbody>{rows_html if rows_html else f'<tr><td colspan="{len(df.columns)}" class="spectre-empty">NO DATA</td></tr>'}</tbody>
        </table>
        """

    @staticmethod
    def fas_badge(enabled: bool) -> str:
        if enabled:
            return """<div style="font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:0.15em;
                color:#00ff99;border:1px solid #00ff99;border-radius:4px;padding:5px 14px;
                display:inline-block;background:rgba(0,255,153,0.06);margin-top:6px;">FAS LAYER: AKTIF</div>"""
        return """<div style="font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:0.15em;
            color:#ff4455;border:1px solid #ff4455;border-radius:4px;padding:5px 14px;
            display:inline-block;background:rgba(255,68,85,0.06);margin-top:6px;">FAS LAYER: NONAKTIF</div>"""


class FaceAPIClient:
    def __init__(self, config: AppConfig):
        self._config = config
        self._headers = {
            "X-API-Key": config.api_key,
            "Content-Type": "application/json",
        }

    def _make_client(self, timeout: Optional[float]) -> httpx.AsyncClient:
        return httpx.AsyncClient(timeout=timeout)

    def _build_payload(self, img_np: np.ndarray, user_id: str, enable_fas: bool) -> Dict[str, Any]:
        return {
            "external_user_id": user_id,
            "image": ImageUtils.to_b64(img_np),
            "metadata": {"source": "gradio_ui", "bypass_fas": not enable_fas},
        }

    def _validate_inputs(self, img_np, user_id) -> Optional[str]:
        if img_np is None:
            return "Error: Gambar tidak ditemukan."
        if not user_id:
            return "Error: External User ID wajib diisi."
        return None

    def _parse_probabilities(self, probs) -> Tuple[Dict, Dict]:
        if probs and len(probs) == 6:
            detail = {cls: float(probs[i]) for i, cls in enumerate(self._config.classes)}
            live_prob = float(probs[5])
            summary = {"Live — Wajah Asli": live_prob, "Spoof — Serangan": 1.0 - live_prob}
        else:
            summary = {"Live — Wajah Asli": 1.0, "Spoof — Serangan": 0.0}
            detail = {"realperson": 1.0}
        return summary, detail

    def _make_metric_updates(self, enable_fas: bool, summary: Dict, detail: Dict):
        if enable_fas:
            return gr.update(value=summary, visible=True), gr.update(value=detail, visible=True)
        return gr.update(value={}, visible=False), gr.update(value={}, visible=False)

    def _parse_response(self, r: httpx.Response, is_register: bool, enable_fas: bool):
        empty = gr.update(value={}, visible=False)

        if r.status_code in (200, 202):
            data = r.json()
            probs = data.get("metrics")
            summary, detail = self._parse_probabilities(probs)
            summary_upd, detail_upd = self._make_metric_updates(enable_fas, summary, detail)

            label = "[BERHASIL] Wajah didaftarkan" if is_register else "[OTENTIK] Identitas Cocok"
            if not enable_fas:
                label += " [FAS: DINONAKTIFKAN]"
            if not is_register and "similarity_score" in data:
                label += f" (Similarity: {data['similarity_score']:.2f})"

            status = f"{label}\nSession ID: {data.get('session_id')}"
            gr.Info(label, duration=4)
            return summary_upd, detail_upd, status

        try:
            err = r.json().get("error", {})
            code = err.get("code", "UNKNOWN")
            msg = err.get("message", r.text)
            details = err.get("details", {})

            if code == "LIVENESS_CHECK_FAILED":
                probs = details.get("probabilities")
                spoof_cls = details.get("spoof_class", "unknown")
                conf = details.get("confidence", 0.0)

                if probs and len(probs) == 6:
                    summary, detail = self._parse_probabilities(probs)
                else:
                    if spoof_cls == "realperson":
                        summary = {"Live — Wajah Asli": conf, "Spoof — Serangan": 1.0 - conf}
                    else:
                        summary = {"Live — Wajah Asli": 1.0 - conf, "Spoof — Serangan": conf}
                    detail = {spoof_cls: conf}

                summary_upd, detail_upd = self._make_metric_updates(enable_fas, summary, detail)
                status = f"[SPOOFING] {msg}"
                gr.Warning(status, duration=6)
                return summary_upd, detail_upd, status

            elif code == "FACE_MATCH_FAILED":
                sim = details.get("similarity_score", 0.0)
                status = f"[DITOLAK] Wajah tidak cocok (Similarity: {sim:.2f})"
                gr.Warning(status, duration=6)
                return empty, empty, status

            else:
                status = f"[ERROR] {code}: {msg}"
                gr.Warning(status, duration=6)
                return empty, empty, status

        except Exception:
            status = f"[ERROR] {r.status_code} - {r.text}"
            gr.Warning(status, duration=6)
            return empty, empty, status

    async def register(self, img_np: np.ndarray, user_id: str, enable_fas: bool):
        err = self._validate_inputs(img_np, user_id)
        if err:
            gr.Warning(err, duration=4)
            empty = gr.update(value={}, visible=False)
            return empty, empty, err

        payload = self._build_payload(img_np, user_id, enable_fas)
        try:
            async with self._make_client(self._config.timeout) as client:
                r = await client.post(f"{self._config.api_url}/register", json=payload, headers=self._headers)
            return self._parse_response(r, is_register=True, enable_fas=enable_fas)
        except Exception as e:
            msg = f"[Koneksi Gagal] {repr(e)}"
            gr.Warning(msg, duration=6)
            empty = gr.update(value={}, visible=False)
            return empty, empty, msg

    async def authenticate(self, img_np: np.ndarray, user_id: str, enable_fas: bool):
        err = self._validate_inputs(img_np, user_id)
        if err:
            gr.Warning(err, duration=4)
            empty = gr.update(value={}, visible=False)
            return empty, empty, err

        payload = self._build_payload(img_np, user_id, enable_fas)
        try:
            async with self._make_client(self._config.timeout) as client:
                r = await client.post(f"{self._config.api_url}/authenticate", json=payload, headers=self._headers)
            return self._parse_response(r, is_register=False, enable_fas=enable_fas)
        except Exception as e:
            msg = f"[Koneksi Gagal] {repr(e)}"
            gr.Warning(msg, duration=6)
            empty = gr.update(value={}, visible=False)
            return empty, empty, msg

    async def get_history(self) -> str:
        columns = ["External User ID", "Created At"]
        try:
            async with self._make_client(self._config.timeout) as client:
                r = await client.get(self._config.api_url, headers=self._headers)
            if r.status_code == 200:
                profiles = r.json().get("profiles", [])
                rows = [[p.get("external_user_id"), p.get("created_at")] for p in profiles] if profiles else [["(Kosong)", "-"]]
                df = pd.DataFrame(rows, columns=columns)
            else:
                df = pd.DataFrame([[f"Error: {r.status_code}", r.text]], columns=columns)
        except Exception as e:
            df = pd.DataFrame([[f"Koneksi Gagal: {repr(e)}", "-"]], columns=columns)
        return TableUtils.df_to_html(df)

    async def purge_user(self, user_id: str):
        if not user_id:
            msg = "Error: User ID wajib diisi."
            gr.Warning(msg, duration=4)
            return msg, await self.get_history()
        try:
            async with self._make_client(self._config.timeout) as client:
                r = await client.delete(f"{self._config.api_url}/{user_id}", headers=self._headers)
            if r.status_code == 204:
                msg = f"[BERHASIL] User {user_id} telah dihapus."
                gr.Info(msg, duration=4)
            else:
                msg = f"[ERROR] {r.status_code}: {r.text}"
                gr.Warning(msg, duration=6)
            return msg, await self.get_history()
        except Exception as e:
            msg = f"[Koneksi Gagal] {repr(e)}"
            gr.Warning(msg, duration=6)
            return msg, await self.get_history()

    async def purge_all(self):
        try:
            async with self._make_client(self._config.timeout) as client:
                r = await client.delete(self._config.api_url, headers=self._headers)
            if r.status_code == 200:
                count = r.json().get("purged_count", 0)
                msg = f"[BERHASIL] {count} wajah telah dihapus secara massal."
                gr.Info(msg, duration=4)
            else:
                msg = f"[ERROR] {r.status_code}: {r.text}"
                gr.Warning(msg, duration=6)
            return msg, await self.get_history()
        except Exception as e:
            msg = f"[Koneksi Gagal] {repr(e)}"
            gr.Warning(msg, duration=6)
            return msg, await self.get_history()


class UIBuilder:
    _CSS = """
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Exo+2:wght@400;600;800&display=swap');

    :root {
        --bg-deep:  #050d1a; --bg-panel: #0a1628; --bg-card: #0f1f36;
        --border:   #1a3a5c; --accent-a: #00d4ff; --accent-b: #0066cc;
        --text-main:#d0eaff; --text-dim: #5a7a9a;
        --glow-a:   rgba(0,212,255,0.18); --glow-b: rgba(0,102,204,0.12);
    }

    *, *::before, *::after { box-sizing: border-box; }

    body, .gradio-container {
        background-color: var(--bg-deep) !important;
        background-image:
            radial-gradient(ellipse 80% 40% at 50% 0%, var(--glow-a) 0%, transparent 70%),
            radial-gradient(ellipse 60% 30% at 80% 100%, var(--glow-b) 0%, transparent 60%);
        color: var(--text-main) !important;
        font-family: 'Exo 2', sans-serif !important;
    }

    h1, h2, h3 { font-family: 'Exo 2', sans-serif !important; letter-spacing: 0.04em; }

    .gr-button-primary {
        background: linear-gradient(135deg, #003d80, var(--accent-a)) !important;
        border: 1px solid var(--accent-a) !important;
        color: #fff !important;
        font-family: 'Share Tech Mono', monospace !important;
        font-size: 14px !important;
        letter-spacing: 0.12em !important;
        text-transform: uppercase !important;
        border-radius: 6px !important;
        box-shadow: 0 0 18px rgba(0,212,255,0.25) !important;
        transition: all 0.2s ease !important;
    }
    .gr-button-primary:hover {
        box-shadow: 0 0 32px rgba(0,212,255,0.50) !important;
        transform: translateY(-1px) !important;
    }

    .gr-panel, .gr-box, .block, .panel {
        background-color: var(--bg-panel) !important;
        border: 1px solid var(--border) !important;
        border-radius: 10px !important;
    }

    label, .gr-label, .label-wrap span {
        color: var(--accent-a) !important;
        font-family: 'Share Tech Mono', monospace !important;
        font-size: 11px !important;
        letter-spacing: 0.15em !important;
        text-transform: uppercase !important;
    }

    .gr-textbox textarea, .gr-textbox input, textarea, input[type=text] {
        background: var(--bg-card) !important;
        color: var(--text-main) !important;
        border: 1px solid var(--border) !important;
        font-family: 'Share Tech Mono', monospace !important;
        font-size: 16px !important;
        font-weight: 600 !important;
        text-align: center !important;
        border-radius: 8px !important;
        letter-spacing: 0.02em !important;
    }

    .gr-label-container, .label-container {
        background: var(--bg-card) !important;
        border: 1px solid var(--border) !important;
        border-radius: 8px !important;
        padding: 8px !important;
    }

    .gr-bar, .progress-bar {
        background: linear-gradient(90deg, var(--accent-b), var(--accent-a)) !important;
        border-radius: 4px !important;
    }

    footer { display: none !important; }

    .image-container, .image-frame,
    div[data-testid="image"],
    div[data-testid="image"] > div,
    div[data-testid="image"] > div > div {
        min-height: unset !important;
        height: auto !important;
    }
    """

    _HEADER_HTML = """
    <div style="font-family:'Share Tech Mono',monospace;border:1px solid #1a3a5c;border-radius:12px;
        padding:28px 36px;background:linear-gradient(135deg,#071220 0%,#0a1e38 60%,#071a2e 100%);
        margin-bottom:4px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;
            background:linear-gradient(90deg,transparent,#00d4ff,transparent);"></div>
        <div style="font-size:11px;color:#005588;letter-spacing:0.25em;margin-bottom:8px;">
            SPECTRE API CLIENT // ANTI-SPOOFING MODULE
        </div>
        <div style="font-size:28px;font-weight:800;color:#d0eaff;letter-spacing:0.06em;margin-bottom:6px;">
            SPECTRE - Spoof Protection and Elusive Counterfeit Threat
            <span style="color:#00d4ff;">DETECTOR</span>
        </div>
        <div style="font-size:12px;color:#4a7a9a;letter-spacing:0.08em;margin-bottom:16px;">
            Server: FastAPI Backend (TTA Active) | Models: ConvNeXtSmall + ArcFace
        </div>
        <div style="display:flex;gap:20px;flex-wrap:wrap;">
            <span style="font-size:11px;color:#00d4ff;border:1px solid #1a3a5c;padding:3px 10px;border-radius:4px;">
                STATUS: API Connected
            </span>
            <span style="font-size:11px;color:#00d4ff;border:1px solid #1a3a5c;padding:3px 10px;border-radius:4px;">
                TTA: 12-TRANSFORM (Backend)
            </span>
        </div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:1px;
            background:linear-gradient(90deg,transparent,#1a3a5c,transparent);"></div>
    </div>
    """

    def __init__(self, client: FaceAPIClient, config: AppConfig):
        self._client = client
        self._config = config

    def _redirect_js(self) -> str:
        url = self._config.redirect_on_auth
        return f"(v) => {{ if(v && v.includes('[OTENTIK]')) window.open('{url}', '_blank'); }}"

    def build(self) -> gr.Blocks:
        with gr.Blocks(
            title="Spectre Client",
            css=self._CSS,
            theme=gr.themes.Base(
                primary_hue="blue",
                neutral_hue="slate",
                font=[gr.themes.GoogleFont("Exo 2"), "sans-serif"],
            ),
        ) as demo:
            gr.HTML(self._HEADER_HTML)

            with gr.Tabs():
                with gr.TabItem("1. REGISTRATION (ENROLL)"):
                    with gr.Row():
                        reg_fas_toggle = gr.Checkbox(label="Aktifkan FAS Layer (Anti-Spoofing)", value=True, scale=2)
                        reg_fas_badge = gr.HTML(value=TableUtils.fas_badge(True), scale=1)
                    with gr.Row(equal_height=False):
                        with gr.Column(scale=1, min_width=340):
                            reg_user_id = gr.Textbox(label="EXTERNAL USER ID", placeholder="contoh: demo_user_1")
                            reg_image = gr.Image(sources=["upload", "webcam"], type="numpy", label="INPUT — WAJAH")
                            reg_btn = gr.Button("DAFTARKAN WAJAH", variant="primary", size="lg")
                        with gr.Column(scale=1, min_width=340):
                            reg_status = gr.Textbox(label="HASIL PENDAFTARAN", interactive=False, lines=2)
                            reg_summary = gr.Label(label="Live / Spoof Probability", num_top_classes=2)
                            reg_detail = gr.Label(label="Liveness Class Details", num_top_classes=6)

                with gr.TabItem("2. AUTHENTICATION (VERIFY)"):
                    with gr.Row():
                        auth_fas_toggle = gr.Checkbox(label="Aktifkan FAS Layer (Anti-Spoofing)", value=True, scale=2)
                        auth_fas_badge = gr.HTML(value=TableUtils.fas_badge(True), scale=1)
                    with gr.Row(equal_height=False):
                        with gr.Column(scale=1, min_width=340):
                            auth_user_id = gr.Textbox(label="EXTERNAL USER ID", placeholder="contoh: demo_user_1")
                            auth_image = gr.Image(sources=["upload", "webcam"], type="numpy", label="INPUT — WAJAH")
                            auth_btn = gr.Button("VERIFIKASI WAJAH", variant="primary", size="lg")
                        with gr.Column(scale=1, min_width=340):
                            auth_status = gr.Textbox(label="HASIL VERIFIKASI", interactive=False, lines=2)
                            auth_summary = gr.Label(label="Live / Spoof Probability", num_top_classes=2)
                            auth_detail = gr.Label(label="Liveness Class Details", num_top_classes=6)

                with gr.TabItem("3. HISTORY & PURGE") as tab_history:
                    with gr.Row():
                        refresh_btn = gr.Button("REFRESH HISTORY", variant="secondary")
                        purge_all_btn = gr.Button("PURGE ALL FACES (HAPUS SEMUA)", variant="stop")
                    with gr.Row():
                        with gr.Column(scale=2):
                            history_table = gr.HTML()
                        with gr.Column(scale=1):
                            purge_id_input = gr.Textbox(label="EXTERNAL USER ID UNTUK DIHAPUS")
                            purge_single_btn = gr.Button("HAPUS WAJAH INI", variant="primary")
                            purge_status = gr.Textbox(label="STATUS PURGE", interactive=False)

            reg_fas_toggle.change(fn=TableUtils.fas_badge, inputs=reg_fas_toggle, outputs=reg_fas_badge)
            auth_fas_toggle.change(fn=TableUtils.fas_badge, inputs=auth_fas_toggle, outputs=auth_fas_badge)

            reg_btn.click(
                fn=self._client.register,
                inputs=[reg_image, reg_user_id, reg_fas_toggle],
                outputs=[reg_summary, reg_detail, reg_status],
            )

            auth_btn.click(
                fn=self._client.authenticate,
                inputs=[auth_image, auth_user_id, auth_fas_toggle],
                outputs=[auth_summary, auth_detail, auth_status],
            )

            auth_status.change(
                fn=None,
                inputs=[auth_status],
                js=self._redirect_js(),
            )

            tab_history.select(fn=self._client.get_history, outputs=history_table)
            refresh_btn.click(fn=self._client.get_history, outputs=history_table)

            purge_all_btn.click(
                fn=self._client.purge_all,
                outputs=[purge_status, history_table],
            )

            purge_single_btn.click(
                fn=self._client.purge_user,
                inputs=[purge_id_input],
                outputs=[purge_status, history_table],
            )

        return demo


def main():
    client = FaceAPIClient(CONFIG)
    ui = UIBuilder(client, CONFIG)
    app = ui.build()
    app.queue().launch()


if __name__ == "__main__":
    main()