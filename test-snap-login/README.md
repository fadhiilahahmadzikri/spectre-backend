# Spectre Snap Login Demo

Demo consumer app untuk membuktikan dua jalur Spectre Snap tanpa mengubah login page final:

- SDK callback: hasil cepat untuk browser/user experience.
- Webhook: hasil server-to-server untuk backend consumer sebelum update database.

App ini memakai package npm `@thewhitenigs/spectre-snap`, bukan source lokal `spectre-snap/src`.

Namespace:

- `/` atau `#/`: product flow, login WebGL dan dashboard graceful.
- `#/lab`: technical lab untuk melihat SDK callback, webhook inbox, dan raw JSON.

## Setup

```bash
npm install
```

Buat `.env.local` dari `.env.example`:

```env
VITE_SPECTRE_BASE_URL=https://thewhitenigs-spectre-backend.hf.space
VITE_SPECTRE_API_KEY=spk_...
VITE_WEBHOOK_RECEIVER_URL=https://spectre-webhook.autovoid.cyou
SPECTRE_WEBHOOK_SECRET=whsec_or_generated_secret
```

## Cloudflare Tunnel (HF backend)

Port terpisah supaya tidak bentrok dengan Notefiber (`5173`) atau Midtrans (`webhook.autovoid.cyou`):

| Hostname | Port lokal | Fungsi |
|---|---|---|
| `spectre-webhook.autovoid.cyou` | 8787 | Webhook receiver |
| `spectre-test.autovoid.cyou` | 5174 | UI test-snap-login |
| `spectre-dash.autovoid.cyou` | 5175 | Spectre dashboard (frontend) |

Sekali setup DNS (jika belum):

```powershell
cloudflared tunnel route dns autovoid spectre-webhook.autovoid.cyou
cloudflared tunnel route dns autovoid spectre-test.autovoid.cyou
cloudflared tunnel route dns autovoid spectre-dash.autovoid.cyou
cloudflared tunnel run autovoid
```

Webhook URL yang di-set di Spectre application (sama dengan API key):

```text
https://spectre-webhook.autovoid.cyou/webhook/spectre
```

## Run Demo

Terminal 1, jalankan receiver milik consumer:

```bash
npm run receiver
```

`npm run receiver` membaca `SPECTRE_WEBHOOK_SECRET` dari `.env.local` atau dari shell environment. Shell environment menang jika keduanya ada.

Terminal 2, jalankan UI:

```bash
npm run dev
```

Buka `http://localhost:5174` atau `https://spectre-test.autovoid.cyou` untuk product flow.

Buka `http://localhost:5174/#/lab` untuk technical lab.

## Configure Webhook

Spectre backend harus dikonfigurasi agar application yang sama dengan API key mengirim webhook ke URL publik di atas (bukan `localhost` jika backend di HF). Tanpa webhook URL di application Spectre, app ini tidak akan membuka dashboard setelah SDK callback.

Jika ingin override secret dari shell, jalankan receiver dengan:

```bash
SPECTRE_WEBHOOK_SECRET=your_secret npm run receiver
```

Di PowerShell:

```powershell
$env:SPECTRE_WEBHOOK_SECRET="your_secret"; npm run receiver
```

## What To Observe

1. Isi email. Email ini menjadi `userId` / `external_user_id`.
2. Klik `Continue with Spectre`.
3. SDK modal melakukan register/authenticate.
4. Product flow tetap di layar login sampai settlement valid.
5. Jika event webhook `face.authenticated` punya `session_id` yang sama dan signature `valid`, dashboard baru terbuka.
6. Namespace `#/lab` menampilkan raw SDK callback, webhook inbox, dan keputusan database.

Maknanya: browser boleh tahu hasil untuk UX, tapi backend consumer baru boleh update database setelah webhook server-to-server diterima dan signature valid. Event `face.registered` hanya enrollment; user belum dianggap login sampai `face.authenticated` valid.

## Verification

```bash
npm run type-check
npm run build
```
