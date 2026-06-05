# 👻 Spectre Workspace Orchestration

Selamat datang di **Spectre Workspace Orchestration**! Repositori ini bertindak sebagai repositori akar (root/orchestration) yang mengoordinasikan seluruh ekosistem Spectre—sebuah platform autentikasi wajah kelas produksi (production-grade facial authentication) berbasis kecerdasan buatan (AI).

Repositori ini mengorganisir berbagai sub-projek, perkakas eksperimen, SDK klien, hingga dokumentasi arsitektur menjadi satu lingkungan kerja terpadu.

---

## 🚀 Ikhtisar Arsitektur Spectre

Platform Spectre dirancang dengan arsitektur tiga pilar utama untuk melayani otentikasi wajah yang aman dan andal:

```
                      ┌──────────────────────┐
                      │    Spectre Frontend  │ (Dashboard Developer)
                      │  [React, Vite, TS]   │
                      └──────────┬───────────┘
                                 │ JWT Auth
                                 ▼
┌──────────────────┐  API Keys ┌──────────────────────┐
│  Example Client  ├──────────►│    Spectre Backend   │ (FastAPI, Python)
│  (Aplikasi Anda) │           │ [InsightFace, Celery]│ ◄── PostgreSQL & Redis
└────────┬─────────┘           └──────────┬───────────┘
         │                                │
         │ Menggunakan                    │ Mengirimkan
         ▼                                ▼
┌──────────────────┐           ┌──────────────────────┐
│   Spectre Snap   │           │   Webhook Receiver   │ (Aplikasi Anda)
│   (React SDK)    │           │ (Notifikasi Verifikasi)
└──────────────────┘           └──────────────────────┘
```

1. **[Spectre Backend](./spectre-backend)** (API Core): Server API utama berbasis FastAPI (Python) yang melakukan deteksi liveness (Anti-Spoofing via AntiSpoofNetV4), pengenalan wajah biometrik (InsightFace), manajemen tenant, webhook dengan tanda tangan HMAC, serta integrasi Google OAuth.
2. **[Spectre Frontend](./spectre-frontend)** (Dashboard): Aplikasi web SPA berbasis React, Vite, dan TailwindCSS v4 untuk pendaftaran tenant, manajemen API Keys, logs deteksi, dan pengaturan webhook.
3. **[Spectre Snap](./spectre-snap)** (React SDK): Komponen React siap-pakai (`@thewhitenigs/spectre-snap`) yang dapat ditanamkan langsung oleh developer pada aplikasi web mereka untuk mengaktifkan alur pemindaian wajah biometrik secara instan.

---

## 📂 Profiling Direktori & Berkas Workspace

Sebagai repositori orkestrator, semua komponen diletakkan di direktori khusus. Klik tautan di bawah ini untuk menjelajahi masing-masing direktori secara langsung:

| Nama Direktori/Berkas | Peran & Deskripsi | Tautan |
| :--- | :--- | :--- |
| **`spectre-backend/`** | Server API utama (Python/FastAPI) yang terintegrasi dengan basis data PostgreSQL (Supabase) dan antrean tugas asynchronous menggunakan Celery + Redis. | [Lihat Kode 📂](./spectre-backend) |
| **`spectre-frontend/`** | Web Dashboard Developer untuk administrasi tenant, memantau analitik verifikasi, dan manajemen API Keys. | [Lihat Kode 📂](./spectre-frontend) |
| **`spectre-snap/`** | SDK React (`@thewhitenigs/spectre-snap`) yang membungkus antarmuka kamera (camera feed), interaksi pose kepala (head-pose ring), dan komunikasi dengan server API. | [Lihat Kode 📂](./spectre-snap) |
| **`example-client/`** | Contoh aplikasi klien sederhana untuk mensimulasikan integrasi real-world dengan SDK `@thewhitenigs/spectre-snap`. | [Lihat Kode 📂](./example-client) |
| **`test-snap-e2e/`** | Skrip pengujian end-to-end untuk memvalidasi bahwa paket SDK Snap dapat diimpor dengan benar baik sebagai file ESM (`.mjs`) maupun CommonJS (`.cjs`). | [Lihat Kode 📂](./test-snap-e2e) |
| **`test-snap-login/`** | Aplikasi sandbox eksperimental untuk menguji alur login biometrik penuh, lengkap dengan penerima webhook lokal. | [Lihat Kode 📂](./test-snap-login) |
| **`diagrams/`** | Dokumentasi visual berupa diagram alur pengguna (user flow), arsitektur fullstack, siklus kerja SDK, dan skema webhook dalam format PlantUML (`.puml`) serta output gambar (`png`/`svg`). | [Lihat Gambar 📂](./diagrams) |
| **`Docs/`** | Berkas referensi pendukung mengenai detail arsitektur tingkat tinggi dari server API Spectre. | [Lihat Dokumentasi 📂](./Docs) |
| **`conductor/`** | Perkakas bantu (tooling scripts) internal untuk konfigurasi dan otomatisasi penyiapan workspace. | [Lihat Tooling 📂](./conductor) |
| **`poc/`** | Kode Proof of Concept (PoC) awal proyek yang dikembangkan menggunakan Gradio (Python) dan berkas HTML/JS murni. | [Lihat PoC 📂](./poc) |
| **`kaggle/`** | Berkas riset, notebook, dan pengujian model Machine Learning untuk deteksi liveness wajah. | [Lihat Riset 📂](./kaggle) |
| **`multimodel/`** | Folder eksperimen untuk menjalankan inferensi beberapa model liveness secara bersamaan. | [Lihat Eksperimen 📂](./multimodel) |

---

## 🛠️ Panduan Memulai untuk Developer Baru (Onboarding Guide)

Jika Anda adalah developer yang baru pertama kali bergabung dengan proyek Spectre, ikuti panduan profiling langkah demi langkah di bawah ini untuk menyiapkan lingkungan pengembangan lokal Anda:

### 1. Prasyarat Sistem (Prerequisites)
Pastikan komputer Anda sudah terpasang perangkat lunak berikut:
* **Node.js** (versi 18 ke atas)
* **Python 3.11** (disarankan menggunakan manajemen virtual environment `uv` atau `venv`)
* **Docker & Docker Compose** (wajib untuk menjalankan database, Redis, dan Celery worker secara lokal)
* **Make** (opsional, untuk menjalankan jalan pintas perintah terminal di Windows/Linux)

---

### 2. Kloning dan Penyiapan Repositori
Repositori orkestrator ini menggunakan **Git Submodule** untuk mengelola sub-projek (seperti backend). Untuk mengkloning seluruh repositori beserta submodulnya sekaligus, gunakan parameter `--recursive`:

```powershell
# Kloning repositori orkestrasi beserta submodulnya
git clone --recursive https://github.com/fadhiilahahmadzikri/spectre-backend.git spectre
cd spectre

# Berpindah ke cabang kerja orkestrasi
git checkout orchestration

# Jika submodul belum terinisialisasi atau kosong, jalankan:
git submodule update --init --recursive
```

---

### 3. Menjalankan Backend Server (Spectre Backend)
Ada dua metode untuk menjalankan backend secara lokal:

#### Metode A: Menggunakan Docker Compose (Sangat Direkomendasikan)
Metode ini akan mengemas seluruh infrastruktur (API, PostgreSQL, Redis, Celery worker) ke dalam kontainer Docker, sehingga Anda tidak perlu memasang library Python atau dependencies secara lokal.

1. Masuk ke folder backend:
   ```powershell
   cd spectre-backend
   ```
2. Buat file konfigurasi lingkungan dari template:
   ```powershell
   copy .env.example .env
   ```
3. Jalankan docker stack:
   ```powershell
   make docker-dev
   # Atau jika tidak ada utilitas 'make':
   docker-compose up --build
   ```
4. API akan aktif di: `http://localhost:8000` dan Swagger UI untuk eksplorasi dokumentasi interaktif tersedia di `http://localhost:8000/docs`.

#### Metode B: Menjalankan Python Lokal + Docker Infra
Jika Anda ingin mendebuk atau memodifikasi kode AI (InsightFace/Tensorflow) secara langsung di komputer lokal:

1. Jalankan container database PostgreSQL & Redis saja:
   ```powershell
   make docker-up
   ```
2. Siapkan virtual environment dan pasang pustaka dependencies Python:
   ```powershell
   python -m venv .venv
   .venv\Scripts\Activate.ps1   # (Windows)
   pip install -r requirements.txt # (Atau menggunakan uv: uv pip sync)
   ```
3. Lakukan migrasi database dan masukkan data awal (seed data):
   ```powershell
   make migrate
   make seed
   ```
4. Jalankan server lokal:
   ```powershell
   make dev-win
   ```

---

### 4. Menjalankan Dashboard Developer (Spectre Frontend)
Setelah backend Anda berjalan, Anda bisa menyalakan Dashboard untuk melakukan manajemen API Keys:

1. Buka terminal baru dan masuk ke folder frontend:
   ```powershell
   cd spectre-frontend
   ```
2. Buat file `.env.local` untuk konfigurasi port dan endpoint backend:
   ```powershell
   copy .env.example .env.local
   ```
   Pastikan variabel `VITE_API_URL` mengarah ke backend lokal Anda (misal `http://localhost:8000`).
3. Pasang dependensi Node.js:
   ```powershell
   npm install
   ```
4. Jalankan aplikasi frontend di mode pengembangan:
   ```powershell
   npm run dev
   ```
5. Akses dashboard Anda melalui browser di alamat yang tertera di terminal (biasanya `http://localhost:5173`).

---

### 5. Menguji Integrasi SDK (Example Client)
Untuk mempermudah pemahaman alur kerja SDK Spectre Snap dengan aplikasi Anda:

1. Buka folder `example-client`:
   ```powershell
   cd example-client
   ```
2. Pasang dependensi dan hubungkan dengan SDK lokal:
   ```powershell
   npm install
   ```
3. Jalankan aplikasi klien demo:
   ```powershell
   npm run dev
   ```
4. Di sini Anda dapat mencoba mensimulasikan pemindaian wajah biometrik yang terhubung langsung dengan backend server Anda!

---

## 🔄 Alur Kerja Siklus Hidup Autentikasi (Sederhana)

```
[Aplikasi Klien] ──► Mengaktifkan <SpectreAuth /> ──► [Kamera Meminta Scan]
                                                            │
                                                            ▼
[Backend API] ◄── [Kirim Wajah + Pose Ring] ◄── [Deteksi Liveness & Ekstraksi]
      │
      ├──► 1. Cek Anti-Spoofing (Liveness OK?)
      ├──► 2. Bandingkan Wajah dengan Database Biometrik
      │
      ▼ (Hasil Autentikasi)
[Klien Menerima Callback onSuccess / onFailed] ──► [Webhook Dikirim ke Server Anda]
```

---

## 📈 Panduan Berkontribusi dan Pengujian

> [!IMPORTANT]
> Sebelum melakukan kontribusi kode (Pull Request), harap pastikan semua pengujian lokal berjalan dengan sukses.

### Pengujian Backend:
```powershell
cd spectre-backend
make test
```

### Pengujian Frontend:
```powershell
cd spectre-frontend
npm run test
```

### Pengujian Komponen SDK:
```powershell
cd spectre-snap
npm run test
```

---

> [!NOTE]
> Jika Anda memiliki kendala atau pertanyaan saat onboarding, harap merujuk ke direktori dokumentasi lengkap di [Docs](./Docs) atau tanyakan langsung pada pimpinan teknis proyek ini. Selamat meretas kode! 👻
