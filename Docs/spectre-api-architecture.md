# Laporan Arsitektur Komunikasi Spectre (Client - Server - Database)

Dokumen ini menjelaskan secara detail bagaimana aplikasi Spectre membangun arsitektur komunikasinya, mulai dari koneksi server ke database, pembuatan dan eksposur RESTful API dari backend, hingga bagaimana frontend/SDK melakukan pemanggilan *(request/response)*. Analisis ini diambil berdasarkan struktur *codebase* terkini, yang sudah berjalan *(live deployment)* di platform produksi.

---

## 1. Arsitektur Deployment & Lingkungan Live (Production)

Berdasarkan konfigurasi produksi (tercantum pada `Makefile`, `.env.spaces`, dan `deploy.py`), arsitektur sistem berjalan pada infrastruktur berikut:
- **Host Server / Backend**: Dide-deploy secara cloud-native ke **Hugging Face Spaces** (`https://thewhitenigs-spectre-backend.hf.space`). Hugging Face meng-hosting kontainer FastAPI (melalui SDK Docker) yang menyajikan seluruh RESTful API.
- **Database Layer**: Menggunakan **Supabase** sebagai penyedia layanan PostgreSQL cloud. Aplikasi melakukan koneksi secara remote ke Supabase Pooler (`aws-1-ap-southeast-1.pooler.supabase.com:5432`).
- **Cache & Rate Limiting**: Menjalankan *instance* Redis untuk rate limiting, cache operasional, dan health checks.

---

## 2. Arsitektur Komunikasi Backend ke Database (Supabase)

### Teknologi Utama
- **Web Framework**: FastAPI (Python 3.11+).
- **ORM & Driver**: SQLAlchemy dengan driver `asyncpg` untuk I/O asinkron yang non-blocking ke database Supabase.

### Alur Komunikasi Server ke Supabase
1. **Model & Skema**: Struktur tabel didefinisikan menggunakan *declarative base* dari SQLAlchemy (`src/spectre/infrastructure/database/models`).
2. **Repository Pattern**: Interaksi dengan database tidak dilakukan langsung dari router. Sistem menggunakan arsitektur abstraksi di mana query (SQL) dijalankan di dalam layer Repositories (`src/spectre/infrastructure/repositories`).
3. **Session Management (Connection Pooling)**: Karena Supabase memiliki batasan koneksi yang ketat, koneksi diatur oleh `asyncpg` dipadukan dengan *Supabase Connection Pooler* (TCP). Session DB diinjeksi ke dalam repository menggunakan *Dependency Injection (DI)* per-request. 

---

## 3. Pembuatan RESTful API (Server)

Bagaimana server (backend di HF Spaces) merakit API:
1. **Pemisahan Router**: Endpoint dikelompokkan menjadi modul `APIRouter` dalam subdirektori `src/spectre/interface/routers/` (contoh: `admin_router.py`, `auth_router.py`, `face_router.py`).
2. **Pydantic Validation**: Setiap Endpoint diikat dengan model validasi **Pydantic**. Pydantic bertugas memvalidasi *Request Body*, memformat *Response*, serta membangun spesifikasi **OpenAPI (Swagger)**.
3. **Dependency Injection & Security**: Endpoint dilindungi menggunakan proteksi bawaan FastAPI (`Depends`) baik untuk JWT pengguna maupun API Key sistem.

---

## 4. Arsitektur Komunikasi Frontend ke Server (API Client)

Frontend dan Client SDK (`spectre-frontend` & `spectre-snap`) tidak menggunakan library eksternal yang besar seperti Axios. Mereka berkomunikasi ke peladen Hugging Face Spaces secara langsung melalui **Native Fetch API**.

### Cara Komunikasi (Konektor)
- Lokasi inti klien: `src/lib/api.ts` (Dashboard) dan `src/features/face-scan/api/face-client.ts` (SDK Face Scanner).
- **Otorisasi**: 
  - Untuk dashboard manajemen: JWT Token disisipkan pada HTTP Header (`Authorization: Bearer <token>`).
  - Untuk SDK Kamera (Snap SDK): Menggunakan API Key spesifik aplikasi (`X-API-Key: <api_key>`).
- **URL Base**: Secara *default*, SDK mengarah ke live endpoint API Hugging Face: `https://thewhitenigs-spectre-backend.hf.space/api/v1/faces`.
- **Standarisasi Kesalahan (Error Handling)**: Kegagalan koneksi di-catch, parsing error JSON dari backend, dan diubah menjadi pesan `HttpError` yang rapi.

---

## 5. Daftar Lengkap Endpoint Tersedia (Berdasarkan Open API & Client Mapping)

Berikut adalah daftar endpoint fungsional yang berjalan di Hugging Face Spaces dan dipakai oleh frontend:

### A. Autentikasi Sistem & Dashboard (JWT Based)
*Digunakan oleh Dashboard Spectre Web*

| Metode | Endpoint | Tujuan / Fungsionalitas | Request Body | Response JSON |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Mendaftarkan admin/pengguna baru | `{email, password, display_name}` | `{user_id}` |
| `POST` | `/api/v1/auth/login` | Autentikasi masuk pengguna | `{email, password}` | `{access_token, refresh_token, user}` |
| `GET`  | `/api/v1/auth/oauth/google` | Trigger aliran Single Sign-On (SSO) Google | *None* | Redirect URL |

### B. Manajemen Aplikasi Client (JWT Based)
*Digunakan oleh pemilik aplikasi untuk mengelola integrasi Spectre*

| Metode | Endpoint | Tujuan / Fungsionalitas | Request Body | Response JSON |
|---|---|---|---|---|
| `GET` | `/api/v1/applications` | Mendapatkan daftar aplikasi pengguna | *Query Params* | `{data: Application[], pagination}` |
| `POST` | `/api/v1/applications` | Membuat aplikasi baru | `{name}` | `Application` Object |
| `PATCH`| `/api/v1/applications/{id}` | Memperbarui nama aplikasi | `{name?}` | `Application` Object |
| `DELETE` | `/api/v1/applications/{id}` | Menghapus sebuah aplikasi | *None* | `204 No Content` |

### C. Manajemen Kredensial API Key (JWT Based)
| Metode | Endpoint | Tujuan / Fungsionalitas | Request Body | Response JSON |
|---|---|---|---|---|
| `GET` | `/api/v1/applications/{appId}/api-keys` | Mengambil seluruh *keys* milik aplikasi | *None* | `{data: ApiKeyRow[]}` |
| `POST`| `/api/v1/applications/{appId}/api-keys` | Membangkitkan (generate) kunci unik baru | *None* | `{id, full_key, key_prefix}` |
| `POST`| `/api/v1/applications/{appId}/api-keys/{keyId}/revoke` | Mencabut/Revoke API key | *None* | `204 No Content` |
| `DELETE` | `/api/v1/applications/{appId}/api-keys/{keyId}` | Hapus paksa rekam API Key | *None* | `204 No Content` |

### D. Face SDK Core - Authentication API (X-API-Key Based)
*Digunakan secara eksklusif oleh Snap SDK dari UI Kamera*

| Metode | Endpoint | Tujuan / Fungsionalitas | Request Body | Response JSON |
|---|---|---|---|---|
| `POST` | `/api/v1/faces/register` | Mendaftarkan wajah baru ke dalam sistem | `{external_user_id, image (base64), metadata, detail_mode}` | `{ok, status, data: FaceApiSuccessPayload}` |
| `POST` | `/api/v1/faces/authenticate` | Mencocokkan wajah saat ini dengan yang terdaftar | `{external_user_id, image (base64), metadata, detail_mode}` | `{ok, status, data: FaceApiSuccessPayload}` |
| `GET` | `/api/v1/faces/{external_user_id}/exists` | Cek ketersediaan profil wajah spesifik | *None* | `{exists: boolean}` |
| `GET` | `/api/v1/sessions/{session_id}` | Ambil detail sesi autentikasi yang sudah tersimpan | *None* | `SessionDetailResponse` |
| `GET` | `/api/v1/faces` | Ambil daftar semua profil wajah dari satu app | *None* | `{profiles: FaceProfile[]}` |
| `DELETE` | `/api/v1/faces/{external_user_id}` | Menghapus satu profil wajah | *None* | `{ok, status}` |
| `DELETE` | `/api/v1/faces` | Membersihkan / Purge semua data wajah terdaftar | *None* | `{purged_count: number}` |
| `POST` | `/api/v1/faces/benchmark` | Melakukan test *Live Benchmark* engine biometrik | `{image, external_user_id}` | `BenchmarkApiResponse` |

### E. Health, Monitoring & Administration (Superadmin Based)
*Digunakan oleh Administrator root Spectre untuk maintenance server HF*

- **`/health` & `/health/ml-status`**: Pengecekan status *heartbeat* HF Spaces, komponen Supabase, dan loaded ML models (TTA support).
- **`/admin/users`, `/admin/applications`, `/admin/sessions`, `/admin/face-profiles`**: Serangkaian endpoint CRUD level master (hanya Role Superadmin) untuk meninjau log aktivitas seluruh client.
- **`/admin/config`**: Pembaruan threshold *Liveness* dan *Face Similarity* secara dinamis tanpa me-*restart* kontainer Hugging Face.
- **`/admin/stats`**: Rekaman `keepalive_ping` untuk melihat heartbeat Supabase dan metrik server secara umum.
- **`/admin/fas-models`**: Mengontrol arsitektur *Face Anti-Spoofing (FAS)* yang dimuat ke RAM.
