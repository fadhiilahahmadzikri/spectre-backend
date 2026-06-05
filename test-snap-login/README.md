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

Buat `.env.local`:

```env
VITE_SPECTRE_BASE_URL=https://thewhitenigs-spectre-backend.hf.space
VITE_SPECTRE_API_KEY=spk_...
VITE_WEBHOOK_RECEIVER_URL=http://localhost:8787
```

## Run Demo

Terminal 1, jalankan receiver milik consumer:

```bash
npm run receiver
```

Terminal 2, jalankan UI:

```bash
npm run dev
```

Buka `http://localhost:5173` untuk product flow.

Buka `http://localhost:5173/#/lab` untuk technical lab.

## Configure Webhook

Spectre backend harus dikonfigurasi agar application yang sama dengan API key mengirim webhook ke:

```text
http://localhost:8787/webhook/spectre
```

Untuk Spectre backend remote, URL localhost tidak bisa diakses dari internet. Pakai ngrok, Cloudflare Tunnel, webhook.site, atau receiver publik lain, lalu set `VITE_WEBHOOK_RECEIVER_URL` ke URL receiver yang bisa dibaca dashboard.

Jika punya webhook secret, jalankan receiver dengan:

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
4. Dashboard product menampilkan status identity dan backend confirmation.
5. Namespace `#/lab` menampilkan raw SDK callback dan webhook inbox.
6. Jika event webhook punya `session_id` yang sama, backend confirmation berubah menjadi persisted.

Maknanya: browser boleh tahu hasil untuk UX, tapi backend consumer baru boleh update database setelah webhook server-to-server diterima dan signature valid.

## Verification

```bash
npm run type-check
npm run build
```
