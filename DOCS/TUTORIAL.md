# Tutorial Penggunaan Platform SPECTER

> **SPECTER** — Spoof Protection and Elusive Counterfeit Threat Exposure Recognition  
> Platform autentikasi wajah berbasis AI dengan liveness detection & anti-spoofing untuk aplikasi pihak ketiga.

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Mendaftar & Login](#2-mendaftar--login)
3. [Membuat Aplikasi & API Key](#3-membuat-aplikasi--api-key)
4. [Integrasi via Snap SDK (React)](#4-integrasi-via-snap-sdk-react)
5. [Integrasi via REST API](#5-integrasi-via-rest-api)
   - [Register Wajah](#51-register-wajah)
   - [Autentikasi Wajah](#52-autentikasi-wajah)
   - [Ganti Wajah](#53-ganti-wajah)
   - [Hapus Wajah](#54-hapus-wajah)
   - [Cek Keberadaan Profil](#55-cek-keberadaan-profil)
   - [Ambil Hasil Sesi](#56-ambil-hasil-sesi)
6. [Membaca Hasil Respons](#6-membaca-hasil-respons)
7. [Mengelola Webhook](#7-mengelola-webhook)
8. [Dashboard Analytics](#8-dashboard-analytics)
9. [Tips Keamanan](#9-tips-keamanan)
10. [Error Umum & Solusinya](#10-error-umum--solusinya)

---

## 1. Pendahuluan

SPECTER adalah layanan API yang memungkinkan aplikasi apa pun menambahkan **verifikasi wajah berbasis liveness detection** tanpa membangun model AI dari nol. Alur kerjanya sederhana:

```
Aplikasi Anda
    │
    ├─ Kirim gambar wajah ke SPECTER API
    │
    ▼
SPECTER memproses:
  1. Deteksi wajah (InsightFace)
  2. Anti-spoofing check (AntiSpoofNetV4)
  3. Face matching (embedding comparison)
    │
    ▼
Hasil: real / fake + verdict identitas
```

**Dua cara integrasi:**
- **Snap SDK** — komponen React siap pakai, cukup `npm install`
- **REST API** — integrasi langsung untuk platform apa pun (non-React, mobile, server-to-server)

---

## 2. Mendaftar & Login

### Daftar Akun Baru

1. Buka platform SPECTER di browser
2. Klik **Get Started** atau navigasi ke `/register`
3. Isi form:
   - **Email** — alamat email aktif
   - **Password** — minimal 8 karakter
4. Klik **Register**
5. Akun langsung aktif, anda akan diarahkan ke dashboard

> Tersedia juga login via **Google** — klik tombol *Continue with Google* di halaman login.

### Login

1. Navigasi ke `/login`
2. Masukkan email dan password
3. Klik **Sign In**

Jika akun mengaktifkan **2FA (TOTP)**, anda akan diminta memasukkan kode 6 digit dari aplikasi authenticator setelah login.

---

## 3. Membuat Aplikasi & API Key

Setiap proyek/integrasi membutuhkan satu **Aplikasi** yang memiliki API key-nya sendiri.

### Langkah-langkah

**A. Buat Aplikasi**

1. Login ke dashboard, klik **Applications** di sidebar
2. Klik **New Application**
3. Isi nama aplikasi (contoh: `MyFintech App`)
4. Klik **Create** — aplikasi tersimpan

**B. Generate API Key**

1. Klik aplikasi yang baru dibuat
2. Klik tab **API Keys**
3. Klik **Generate Key**
4. **Salin key yang tampil** — key hanya ditampilkan sekali, tidak bisa dilihat lagi setelah dialog ditutup

```
Format API Key:  spk_3b8c4f2a9d1e7b5c8f0a2d4e...
```

**C. Simpan di Environment Variable**

```bash
# .env
VITE_SPECTRE_API_KEY=spk_xxxxxxxxxxxxxxxxxxxx
```

> **Jangan** hardcode API key di source code atau commit ke repository.

---

## 4. Integrasi via Snap SDK (React)

Snap SDK adalah cara tercepat untuk menambahkan verifikasi wajah ke aplikasi React.

### Instalasi

```bash
npm install @thewhitenigs/spectre-snap
```

### Penggunaan Dasar — Modal

```tsx
import { useState } from "react";
import { SpectreAuthModal } from "@thewhitenigs/spectre-snap";
import type { SpectreAuthResult, SpectreFailureReason } from "@thewhitenigs/spectre-snap";
import "@thewhitenigs/spectre-snap/style.css";

export default function LoginPage() {
  const [open, setOpen] = useState(false);

  const handleSuccess = (result: SpectreAuthResult) => {
    console.log("Verified! Session ID:", result.sessionId);
    console.log("Verdict:", result.verdict); // "real" | "fake"
    setOpen(false);
    // redirect atau update auth state
  };

  const handleFailed = (reason: SpectreFailureReason) => {
    console.log("Gagal:", reason);
    // SDK menampilkan pesan error secara otomatis
  };

  return (
    <>
      <button onClick={() => setOpen(true)}>Verifikasi Wajah</button>

      <SpectreAuthModal
        open={open}
        onOpenChange={setOpen}
        apiKey={import.meta.env.VITE_SPECTRE_API_KEY}
        userId="user@email.com"     // ID unik user — harus konsisten setiap sesi
        mode="auto"                 // "register" | "authenticate" | "auto"
        onSuccess={handleSuccess}
        onFailed={handleFailed}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
```

### Parameter Komponen

| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `apiKey` | `string` | ✅ | API key dari dashboard |
| `userId` | `string` | ✅ | ID unik user di sistem anda. Gunakan selalu konsisten (email, UUID, dll) |
| `mode` | `"register" \| "authenticate" \| "auto"` | ✅ | `auto` = register jika belum ada, authenticate jika sudah |
| `onSuccess` | `(result) => void` | ✅ | Dipanggil saat verifikasi berhasil |
| `onFailed` | `(reason) => void` | ✅ | Dipanggil saat verifikasi gagal |
| `onClose` | `() => void` | ✅ | Dipanggil saat modal ditutup |

### Mode Operasi

| Mode | Kapan Digunakan |
|---|---|
| `register` | Pertama kali user mendaftarkan wajah |
| `authenticate` | User sudah terdaftar, ingin verifikasi identitas |
| `auto` | SDK otomatis mendeteksi — **direkomendasikan** |

---

## 5. Integrasi via REST API

Base URL: `https://{DOMAIN}/api/v1`

Semua request membutuhkan header:
```
X-API-Key: spk_xxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

---

### 5.1 Register Wajah

Mendaftarkan wajah user baru ke sistem.

**Endpoint:** `POST /api/v1/faces/register`

**Request Body:**
```json
{
  "external_user_id": "user@email.com",
  "image": "<base64_encoded_image>"
}
```

**Contoh (cURL):**
```bash
curl -X POST https://{DOMAIN}/api/v1/faces/register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: spk_xxxxxxxxxxxx" \
  -d '{
    "external_user_id": "user@email.com",
    "image": "'$(base64 -w 0 foto.jpg)'"
  }'
```

**Contoh (JavaScript/Fetch):**
```js
const imageBase64 = await fileToBase64(imageFile); // konversi File ke base64

const response = await fetch("https://{DOMAIN}/api/v1/faces/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.SPECTRE_API_KEY,
  },
  body: JSON.stringify({
    external_user_id: "user@email.com",
    image: imageBase64,
  }),
});

const result = await response.json();
console.log(result.session_id); // gunakan untuk polling hasil
```

**Respons (202 Accepted):**
```json
{
  "session_id": "sess_abc123",
  "status": "pending"
}
```

> Proses berjalan **asinkron**. Gunakan `session_id` untuk mengambil hasil via [GET /sessions/{id}](#56-ambil-hasil-sesi).

---

### 5.2 Autentikasi Wajah

Memverifikasi identitas user yang sudah terdaftar.

**Endpoint:** `POST /api/v1/faces/authenticate`

**Request Body:** (sama dengan register)
```json
{
  "external_user_id": "user@email.com",
  "image": "<base64_encoded_image>"
}
```

**Contoh (cURL):**
```bash
curl -X POST https://{DOMAIN}/api/v1/faces/authenticate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: spk_xxxxxxxxxxxx" \
  -d '{
    "external_user_id": "user@email.com",
    "image": "'$(base64 -w 0 foto.jpg)'"
  }'
```

**Respons (202 Accepted):**
```json
{
  "session_id": "sess_xyz789",
  "status": "pending"
}
```

---

### 5.3 Ganti Wajah

Mengganti data wajah user yang sudah terdaftar (enrollment ulang).

**Endpoint:** `PUT /api/v1/faces/{external_user_id}`

```bash
curl -X PUT https://{DOMAIN}/api/v1/faces/user@email.com \
  -H "Content-Type: application/json" \
  -H "X-API-Key: spk_xxxxxxxxxxxx" \
  -d '{
    "image": "'$(base64 -w 0 foto_baru.jpg)'"
  }'
```

---

### 5.4 Hapus Wajah

Menghapus profil wajah user dari sistem.

**Endpoint:** `DELETE /api/v1/faces/{external_user_id}`

```bash
curl -X DELETE https://{DOMAIN}/api/v1/faces/user@email.com \
  -H "X-API-Key: spk_xxxxxxxxxxxx"
```

**Respons:** `204 No Content`

---

### 5.5 Cek Keberadaan Profil

Cek apakah user sudah terdaftar sebelum melakukan autentikasi.

**Endpoint:** `GET /api/v1/faces/{external_user_id}/exists`

```bash
curl https://{DOMAIN}/api/v1/faces/user@email.com/exists \
  -H "X-API-Key: spk_xxxxxxxxxxxx"
```

**Respons:**
```json
{
  "exists": true,
  "external_user_id": "user@email.com"
}
```

---

### 5.6 Ambil Hasil Sesi

Polling untuk mendapatkan hasil proses register/authenticate.

**Endpoint:** `GET /api/v1/sessions/{session_id}`

```bash
curl https://{DOMAIN}/api/v1/sessions/sess_abc123 \
  -H "X-API-Key: spk_xxxxxxxxxxxx"
```

**Respons (selesai):**
```json
{
  "session_id": "sess_abc123",
  "status": "completed",
  "verdict": "real",
  "liveness_score": 0.97,
  "identity_matched": true,
  "attack_type": null,
  "created_at": "2026-06-03T10:00:00Z"
}
```

**Polling yang disarankan:**
```js
async function pollSession(sessionId, apiKey, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`https://{DOMAIN}/api/v1/sessions/${sessionId}`, {
      headers: { "X-API-Key": apiKey },
    });
    const data = await res.json();

    if (data.status === "completed" || data.status === "failed") {
      return data;
    }

    await new Promise(r => setTimeout(r, 1000)); // tunggu 1 detik
  }
  throw new Error("Timeout menunggu hasil sesi");
}
```

---

## 6. Membaca Hasil Respons

### Field Utama di Hasil Sesi

| Field | Nilai | Keterangan |
|---|---|---|
| `status` | `pending` / `completed` / `failed` | Status proses |
| `verdict` | `real` / `fake` | Hasil liveness detection |
| `liveness_score` | `0.0` – `1.0` | Skor kepercayaan (> 0.5 = real) |
| `identity_matched` | `true` / `false` | Apakah wajah cocok dengan yang terdaftar |
| `attack_type` | `null` / `print` / `video` / `mask` / dll | Jenis serangan yang terdeteksi (jika fake) |

### Contoh Logika di Aplikasi Anda

```js
const session = await pollSession(sessionId, apiKey);

if (session.verdict === "real" && session.identity_matched) {
  // Berikan akses — verifikasi berhasil
  redirectToDashboard();
} else if (session.verdict === "fake") {
  // Tolak — deteksi serangan spoofing
  showError(`Terdeteksi serangan: ${session.attack_type}`);
} else {
  // Identitas tidak cocok
  showError("Wajah tidak dikenali");
}
```

---

## 7. Mengelola Webhook

Webhook memungkinkan SPECTER mengirim notifikasi otomatis ke server anda saat proses selesai — tanpa perlu polling.

### Konfigurasi Webhook

1. Di dashboard, buka **Applications** → pilih aplikasi
2. Masuk ke tab **Webhooks**
3. Masukkan **Webhook URL** (endpoint di server anda)
4. Simpan konfigurasi

### Verifikasi Signature

Setiap request webhook dari SPECTER menyertakan header `X-Spectre-Signature` untuk verifikasi keaslian:

```js
import crypto from "crypto";

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return `sha256=${expected}` === signature;
}

// Di Express.js handler
app.post("/webhook/spectre", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["x-spectre-signature"];
  const isValid = verifyWebhook(req.body, sig, process.env.WEBHOOK_SECRET);

  if (!isValid) return res.status(401).send("Invalid signature");

  const event = JSON.parse(req.body);
  console.log("Event:", event.type, event.session_id);

  res.status(200).send("OK");
});
```

### Retry Otomatis

Jika endpoint anda gagal merespons (timeout atau error 5xx), SPECTER akan melakukan **retry otomatis** beberapa kali dengan interval yang bertambah.

Untuk melihat log pengiriman: **Applications** → pilih app → **Webhook Deliveries**

---

## 8. Dashboard Analytics

Platform menyediakan dashboard analitik interaktif berbasis Streamlit.

### Cara Akses

1. Klik tombol **Analytics** di navbar
2. Dashboard terbuka di tab baru

### Isi Dashboard

| Panel | Keterangan |
|---|---|
| **Distribusi Data** | Visualisasi komposisi dataset training (real vs tiap jenis serangan) |
| **Performa Model** | Confusion matrix, accuracy, precision, recall, F1-score AntiSpoofNetV4 |
| **Perbandingan Model** | Benchmark AntiSpoofNetV4 vs IlhamCaesar ResNet50 |
| **Statistik Deteksi** | Grafik hasil deteksi dari request yang masuk ke API |

---

## 9. Tips Keamanan

### API Key
- Simpan di environment variable, **jangan** di source code
- Gunakan satu key per environment (development, staging, production)
- Rotate key secara berkala melalui dashboard
- Revoke segera jika key bocor atau tidak digunakan

### Gambar yang Dikirim
- Pastikan gambar minimal resolusi **480×480 piksel**
- Format: **JPEG** atau **PNG**
- Ukuran file maksimal: **5 MB**
- Wajah harus terlihat jelas, pencahayaan cukup, tidak buram

### User ID
- Gunakan identifier yang **konsisten dan unik** (email, UUID, dll)
- Jangan gunakan ID yang mudah ditebak atau berubah-ubah
- Satu `external_user_id` = satu profil wajah per aplikasi

---

## 10. Error Umum & Solusinya

| HTTP Status | Kode Error | Penyebab | Solusi |
|---|---|---|---|
| `401` | `UNAUTHORIZED` | API key tidak ada atau salah | Pastikan header `X-API-Key` terisi dan benar |
| `403` | `FORBIDDEN` | API key tidak aktif atau di-revoke | Generate API key baru di dashboard |
| `404` | `USER_NOT_FOUND` | `external_user_id` belum terdaftar | Gunakan `/faces/register` terlebih dahulu |
| `409` | `USER_ALREADY_EXISTS` | User sudah terdaftar saat register | Gunakan `/faces/authenticate` atau `PUT` untuk update |
| `422` | `NO_FACE_DETECTED` | Tidak ada wajah terdeteksi di gambar | Pastikan gambar mengandung wajah yang jelas |
| `422` | `MULTIPLE_FACES` | Lebih dari satu wajah terdeteksi | Kirim gambar dengan satu wajah saja |
| `429` | `RATE_LIMITED` | Terlalu banyak request dalam waktu singkat | Tambahkan delay antara request |
| `500` | `MODEL_ERROR` | Error internal model AI | Coba lagi beberapa saat kemudian |

---

## Referensi Cepat

| Aksi | Endpoint |
|---|---|
| Register wajah | `POST /api/v1/faces/register` |
| Autentikasi wajah | `POST /api/v1/faces/authenticate` |
| Ganti wajah | `PUT /api/v1/faces/{user_id}` |
| Hapus wajah | `DELETE /api/v1/faces/{user_id}` |
| Cek profil | `GET /api/v1/faces/{user_id}/exists` |
| Hasil sesi | `GET /api/v1/sessions/{session_id}` |
| List sesi | `GET /api/v1/sessions` |
| Test webhook | `POST /api/v1/applications/{app_id}/webhooks/test` |
| Health check | `GET /health` |

---

*Dokumen ini adalah panduan tutorial resmi platform SPECTER — CC26-PSU232, Coding Camp 2026 powered by DBS Foundation.*
