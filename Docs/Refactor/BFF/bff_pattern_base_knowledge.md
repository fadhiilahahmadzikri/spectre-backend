# Backend for Frontend (BFF) — Base Knowledge & Paradigm

Dokumen ini adalah referensi paradigma murni. Tidak terikat ke satu teknologi atau proyek tertentu. Tujuannya adalah membangun pemahaman yang jelas tentang apa itu BFF, kenapa ia ada, kapan ia relevan, di mana batasannya, dan bagaimana pembagian tanggung jawab antar layer idealnya terjadi.

---

## 1. Apa Itu BFF

Backend for Frontend adalah architectural pattern di mana setiap frontend client — atau kelompok client yang homogen — memiliki backend service yang dedicated. Backend ini bukan service generik yang melayani semua jenis client. Ia dirancang khusus untuk satu client type: web dashboard, mobile app, SDK kamera, CLI tool, dan sebagainya.

BFF bukan pengganti backend utama. BFF adalah layer antara frontend dan backend (atau kumpulan backend). Ia menjadi satu-satunya pintu masuk resmi bagi frontend untuk mengakses semua resource yang dibutuhkannya.

Pattern ini pertama kali dipublikasikan oleh Sam Newman (penulis *Building Microservices*) dan dipopulerkan oleh tim SoundCloud sekitar 2015. Sejak itu diadopsi luas oleh Netflix, Spotify, Airbnb, dan hampir semua perusahaan dengan arsitektur multi-client skala besar.

---

## 2. Kenapa BFF Ada — Akar Masalahnya

### 2.1 The One-Size-Fits-All Problem

Ketika satu API generik mencoba melayani semua client sekaligus, ia tidak bisa optimal untuk siapapun.

Web dashboard membutuhkan response yang kaya, penuh relasi, dengan banyak field untuk ditampilkan di layar besar. Mobile app membutuhkan response yang ringan, sudah pre-aggregated, dengan payload sekecil mungkin untuk efisiensi bandwidth. SDK kamera membutuhkan response yang sangat cepat, minimal field, dengan error code yang spesifik untuk flow biometrik. CLI tool membutuhkan plain text atau JSON minimal.

Kalau satu backend harus melayani semua ini, ada dua pilihan buruk: buat response sekaya mungkin (mobile buang-buang bandwidth) atau buat response seminimal mungkin (dashboard harus banyak round-trip). Keduanya kompromi.

### 2.2 The Coupling Problem

Tanpa BFF, frontend langsung bergantung pada kontrak internal backend. Setiap kali backend berubah — rename field, ubah struktur response, pindah endpoint — frontend ikut rusak. Perubahan backend dan frontend harus selalu disinkronisasi.

Dengan BFF, kontrak antara frontend dan backend adalah kontrak BFF. Backend internal bisa berubah bebas selama BFF masih bisa translate. Frontend tidak tahu dan tidak peduli bagaimana backend internal berstruktur.

### 2.3 The Runtime Mismatch Problem

Dalam sistem modern, tidak semua capability ada di satu runtime. ML inference butuh Python karena ekosistemnya (TensorFlow, PyTorch, NumPy) tidak ada padanannya di tempat lain. Real-time event handling lebih idiomatis di Node.js. High-throughput data processing bisa lebih baik di Go. Pencarian teks cocok di Elasticsearch.

Kalau semua ini diakses langsung oleh frontend, frontend harus tahu URL, auth scheme, dan format response masing-masing service. BFF menyembunyikan semua itu. Frontend berbicara ke satu endpoint, BFF yang berkoordinasi ke belakang.

### 2.4 The Aggregation Problem

Satu halaman di dashboard bisa membutuhkan data dari tiga sumber berbeda: daftar aplikasi dari service A, statistik session dari service B, status ML service dari service C. Tanpa BFF, frontend harus buat tiga request paralel, tunggu ketiganya selesai, lalu gabungkan di sisi client.

BFF memindahkan aggregasi itu ke server side. Frontend buat satu request, BFF buat tiga request paralel ke backend masing-masing, gabungkan hasilnya, kirim satu response. Latency lebih rendah (network backend ke backend lebih cepat dari browser ke server), logic lebih terpusat.

---

## 3. Kapan Menggunakan BFF

### Kondisi yang Menjustifikasi BFF

**Runtime heterogen.** Ada lebih dari satu runtime yang diperlukan karena alasan teknis, bukan preferensi. Python untuk ML, Node.js untuk web layer, misalnya. Ini bukan pilihan — ini kebutuhan ekosistem. BFF menjadi glue layer.

**Lebih dari satu client type yang berbeda karakteristiknya.** Web dashboard dan mobile app memiliki kebutuhan payload yang sangat berbeda. SDK dan CLI membutuhkan response shape yang berbeda. Kalau semua client memiliki kebutuhan yang sama, BFF berlebihan.

**Frontend harus melakukan banyak aggregasi.** Kalau frontend selalu membuat 3+ request untuk render satu halaman dan menggabungkan hasilnya di client, itu sinyal kuat bahwa aggregasi perlu dipindah ke server. BFF adalah tempatnya.

**Perlu auth layer yang berbeda per client.** Dashboard pakai JWT berbasis session. SDK pakai API key. Service-to-service pakai mTLS atau internal token. BFF bisa handle masing-masing auth scheme dan meng-translate ke satu format internal.

**Backend internal tidak stabil atau sering berubah.** BFF menjadi buffer. Frontend terisolasi dari perubahan backend.

### Kondisi di Mana BFF Tidak Diperlukan

**Single client type.** Kalau hanya ada satu web app dan tidak ada rencana mobile atau SDK, satu backend cukup.

**Backend sudah simple dan stabil.** Kalau backend hanya punya satu concern dan tidak ada heterogenitas runtime, menambahkan BFF hanya menambah hop jaringan tanpa manfaat nyata.

**Tim sangat kecil.** BFF menambah service yang harus di-maintain, di-deploy, dan di-monitor. Untuk tim dua orang, ini overhead yang tidak sepadan.

**Performance-critical path tanpa aggregasi.** Kalau setiap request sudah one-to-one antara frontend dan satu backend endpoint, BFF hanya menambah latency.

---

## 4. Batas-batas BFF — Apa yang Bukan Tanggung Jawabnya

BFF punya scope yang jelas. Ketika ia mulai mengerjakan hal di luar scope-nya, arsitektur mulai rusak.

### BFF Bukan Tempat Business Logic Inti

Business logic — aturan bisnis seperti "user boleh buat maksimal 5 aplikasi", "threshold liveness harus antara 0 dan 1", "API key expired setelah 90 hari" — tidak boleh hidup di BFF. Logic ini harus ada di domain service yang relevan. BFF hanya meneruskan, men-translate, dan men-aggregate.

Kalau business logic ada di BFF, ia akan duplikat di setiap BFF (karena per client type ada BFF masing-masing). Duplikasi adalah sumber bug.

### BFF Bukan Database Owner

BFF tidak memiliki state permanen yang tidak bisa direkonstruksi dari tempat lain. Kalau BFF mati dan restart, tidak boleh ada data yang hilang. BFF bisa punya cache, bisa baca/tulis ke database untuk kebutuhan session atau audit log, tapi ia bukan sumber kebenaran (source of truth) untuk domain data.

Pengecualian yang valid: BFF owns tabel yang memang spesifik untuk keperluan frontend dan tidak relevan untuk service lain — user preferences UI, notification settings, dashboard layout config.

### BFF Bukan API Gateway

API gateway adalah infrastruktur: routing, load balancing, SSL termination, global rate limiting. BFF adalah aplikasi: ia punya logic, ia tahu tentang domain, ia bisa membuat keputusan berdasarkan context.

Keduanya bisa ada bersamaan. API gateway di depan, BFF di belakang gateway. Mereka tidak saling menggantikan.

### BFF Tidak Boleh Terlalu Gemuk

BFF yang ideal adalah thin-to-moderate. Kalau sebuah BFF mulai punya ratusan baris business logic, puluhan domain entity, dan skema database yang kompleks, ia sudah berubah menjadi monolith baru. Ini adalah anti-pattern yang disebut "fat BFF" — sama buruknya dengan monolith yang sedang coba dihindari.

Indikator BFF terlalu gemuk: ia punya logic yang tidak ada hubungannya dengan aggregasi, transformasi, atau auth. Ia punya domain model yang luas. Ia menjadi bottleneck untuk semua perubahan.

---

## 5. Kenapa Terjadi Pembagian: Node.js/Express vs Python

Ini bukan soal preferensi bahasa. Ini soal ekosistem dan kapabilitas yang memang tidak bisa di-port antar runtime.

### Mengapa Node.js/Express Berada di Layer BFF

Node.js dirancang untuk I/O-bound workload: menerima request, membaca/menulis ke database, memanggil service lain, menggabungkan response, mengirim balik. Ini persis apa yang BFF lakukan. Event loop Node.js sangat efisien untuk operasi ini karena tidak ada blocking.

Express sebagai framework sangat minimal: routing, middleware chaining, error handling. Tidak ada opini tentang struktur aplikasi. Ini cocok untuk BFF yang tugasnya memang berubah-ubah per client type.

JavaScript/TypeScript juga paling dekat dengan dunia frontend. Tim frontend bisa membaca dan berkontribusi ke BFF lebih mudah dari Python. Ini keuntungan praktis yang nyata di tim kecil.

Apa yang secara alami hidup di Node.js layer:

- Request routing dan middleware chain
- Auth handling (JWT issuance, validation, refresh)
- API key generation, validation, lifecycle management
- Response transformation dan field filtering per client type
- Aggregasi dari multiple downstream service
- Rate limiting per client
- Logging, audit trail
- WebSocket atau Server-Sent Events untuk real-time ke frontend
- Serving static assets (bila perlu)
- CORS policy enforcement

### Mengapa Python Berada di ML/Core Service Layer

Python bukan pilihan — Python adalah keharusan untuk ekosistem ML. TensorFlow, PyTorch, NumPy, OpenCV, scikit-learn, InsightFace, MediaPipe — semua ekosistem ini ada di Python. Implementasi ulang di Node.js atau bahasa lain tidak praktis dan tidak akan setara.

Python juga kuat untuk operasi numerik intensif, scientific computing, dan data processing. Asyncio di Python cukup untuk handle concurrent inference request.

FastAPI khususnya dipilih karena ia async-native, punya Pydantic untuk validation dan OpenAPI auto-generation, dan sangat cepat untuk Python web framework.

Apa yang secara alami hidup di Python layer:

- Semua ML inference (klasifikasi, deteksi, embedding extraction)
- Model loading, management, dan hot-reload
- Computer vision preprocessing (resize, normalize, augment)
- Face detection dan landmark extraction
- Anti-spoofing inference
- Biometric similarity computation
- Heavy computation yang butuh NumPy/SciPy
- GPU/TPU utilization
- Background task untuk operasi ML yang panjang

### Garis Batas yang Jelas

Garis batasnya bukan di "apa yang bisa dikerjakan masing-masing runtime" — keduanya bisa handle HTTP request, database query, dan JSON. Garis batasnya adalah **apa yang secara ekosistem hanya bisa dilakukan di satu runtime secara wajar.**

Kalau sebuah operasi bisa dikerjakan di keduanya dengan upaya yang sama, ia sebaiknya di BFF (Node.js) karena BFF lebih dekat ke frontend dan lebih mudah di-maintain bersama frontend team. Kalau sebuah operasi membutuhkan Python secara ekosistem (ML, computer vision, scientific computing), ia harus di Python service.

---

## 6. Cakupan Express BFF — Apa Saja yang Harus Ada

Berikut adalah cakupan ideal sebuah Express BFF dalam konteks aplikasi web dengan downstream ML service.

### Auth & Identity

BFF mengelola seluruh siklus hidup authentication untuk frontend client. Ini termasuk: registrasi user, login dan issuance token, refresh token rotation, logout dan revokasi token, dan validasi session.

BFF juga mengelola API key — generate, distribusi (hanya saat create), validasi per-request, revokasi, dan hard delete. API key adalah mekanisme auth untuk SDK dan third-party integration, berbeda dari JWT yang untuk human user.

BFF tidak menyimpan business rule tentang siapa yang boleh melakukan apa di domain lain. Ia hanya mengauthentikasi dan memberikan context (siapa user ini, app apa yang digunakan) ke downstream service.

### Application & Tenant Management

BFF mengelola entitas yang merupakan representasi frontend dari "tenant" — dalam konteks SaaS multi-tenant, ini adalah record yang menghubungkan user dengan resource mereka.

Membuat, memperbarui, menonaktifkan, dan menghapus application record adalah operasi yang dilakukan user melalui dashboard. BFF menerima request ini, validasi authorization (apakah user ini punya hak atas application ini), dan eksekusi ke database.

Ini bukan business logic — ini CRUD yang terikat ke auth context. Wajar ada di BFF.

### Aggregasi dan Data Shaping

Satu endpoint BFF bisa merepresentasikan agregat dari beberapa sumber. Dashboard overview endpoint, misalnya, bisa menggabungkan: jumlah aplikasi aktif, total session minggu ini, success rate authentication, session status stats, dan status ML service — semuanya dalam satu response.

BFF juga bertanggung jawab untuk field filtering: response dari downstream service mungkin punya 40 field, tapi mobile client hanya butuh 8 field. BFF memfilter ini sebelum dikirim ke client.

Transformasi naming convention juga valid: downstream service pakai snake_case, frontend expect camelCase. BFF melakukan konversi ini.

### Logging, Audit, dan Telemetry

BFF adalah satu-satunya pintu masuk frontend. Ini membuatnya menjadi tempat yang ideal untuk logging semua request, response code, latency, dan error yang terjadi antara frontend dan sistem. Log ini adalah audit trail yang berguna untuk debugging dan compliance.

Frontend error logging (client-side errors yang dikirim ke server) juga masuk ke BFF dan di-persist ke storage untuk analisis.

### Proxy ke Downstream Service

Untuk operasi yang membutuhkan capability Python (ML inference, misalnya), BFF menerima request, melakukan pre-validation (auth, rate limiting, input sanitasi minimal), kemudian mem-forward request ke Python service.

BFF tidak mengubah business logic dari operasi ini. Ia hanya menjadi gatekeeper yang memastikan hanya request yang sah dan ter-authentikasi yang sampai ke Python service.

---

## 7. Cakupan Python Service — Apa Saja yang Harus Ada

### ML Inference dan Semua yang Bersentuhan dengan Model

Semua operasi yang melibatkan model machine learning — loading, inference, preprocessing input, postprocessing output — ada di Python service. Ini tidak bisa didelegasikan ke tempat lain.

Face liveness detection, face recognition, anti-spoofing classification, embedding extraction, similarity computation — semua ini hidup di sini. Mereka bergantung pada library Python yang tidak ada padanannya.

### Model Management

Konfigurasi model mana yang aktif, versi model, threshold confidence, dan hot-reload model tanpa restart service — semua ini adalah concern Python service.

### Heavy Computation dan Background Jobs

Operasi yang computationally intensive (inference pada gambar resolusi tinggi, batch processing, TTA — test-time augmentation) harus ada di Python karena ia memiliki akses ke NumPy vectorization, GPU via CUDA, dan TPU.

Background task seperti batch inference atau scheduled model maintenance juga bisa hidup di Python service, terutama kalau task-nya berkaitan dengan hasil inference.

### Health dan Observability ML-Specific

Status model (loaded atau tidak), GPU memory usage, inference latency histogram, model version yang sedang aktif — semua ini adalah metrics yang hanya bisa dihasilkan dari dalam Python runtime yang sama dengan model.

---

## 8. Integrasi: Bagaimana Semuanya Terhubung

### Pola Komunikasi BFF ke Downstream

Komunikasi dari BFF ke downstream service adalah HTTP synchronous untuk sebagian besar operasi. BFF membuat HTTP request ke Python service, menunggu response, dan meneruskan response ke client.

Untuk operasi yang panjang (inference bisa memakan waktu beberapa detik), pola yang umum adalah fire-and-return-session-id: BFF forward request ke Python service, Python service return session ID segera (202 Accepted), dan Python service proses inference di background. Frontend kemudian polling session status atau mengambil detail sesi melalui `GET /sessions/:id`.

### Shared Database sebagai Integration Point

Cara paling sederhana dan pragmatis untuk integrasi antara BFF dan Python service yang bukan melalui HTTP adalah shared database. BFF dan Python service mengakses tabel yang sama di database yang sama.

Python service menulis hasil session ke tabel `sessions`. BFF membaca tabel yang sama untuk endpoint `GET /sessions`. Tidak ada API call antar service untuk ini — cukup database.

Ini valid selama kedua service beroperasi pada database yang sama dan ada kesepakatan tentang siapa yang owns tabel mana. Ownership yang jelas mencegah konflik: BFF owns tabel auth dan application management, Python service owns tabel session dan face profile.

### Session Status sebagai Async Integration

Untuk hasil yang tidak synchronous, session status adalah mekanisme integrasi paling sederhana. Python service menulis perubahan status ke tabel `sessions`, lalu BFF atau frontend mengambil detail terbaru melalui endpoint session detail.

BFF bisa menjadi perantara untuk membentuk response yang sesuai kebutuhan frontend, tetapi source of truth tetap tabel session yang ditulis oleh Python service.

### Kontrak Antara BFF dan Python Service

BFF dan Python service harus memiliki kontrak yang eksplisit. Kontrak ini biasanya berbentuk OpenAPI specification untuk Python service. BFF bergantung pada kontrak ini untuk tahu endpoint apa yang tersedia, format request apa yang diterima, dan response shape apa yang dikembalikan.

Kontrak tidak boleh diubah secara breaking tanpa koordinasi. Kalau Python service perlu mengubah response shape, ia harus backward compatible atau versi API baru dibuat.

### Tidak Ada Dependency Terbalik

Python service tidak boleh memanggil BFF. Dependency hanya satu arah: BFF memanggil Python service, tidak pernah sebaliknya. Python service tidak boleh tahu BFF ada.

Kalau Python service perlu mengekspos hasil ke arah yang berlawanan (misalnya inference selesai), mekanismenya adalah message queue internal atau shared database — bukan HTTP call ke BFF.

---

## 9. Limitasi dan Trade-off

### Tambahan Hop Jaringan

Setiap request dari frontend sekarang melewati satu layer ekstra. BFF menambah latency — biasanya 5 hingga 20 milidetik untuk network hop dalam satu region. Untuk sebagian besar aplikasi ini tidak terasa, tapi untuk aplikasi ultra-latency-sensitive ini menjadi pertimbangan.

### Satu Lagi Service yang Harus Di-maintain

BFF adalah service yang punya deployment pipeline sendiri, monitoring sendiri, dan bisa fail secara independen. Kalau BFF down, seluruh frontend tidak bisa beroperasi meskipun semua downstream service sehat. Single point of failure ini perlu dimitigasi dengan health check, auto-restart, dan redundancy.

### Risk Fat BFF

Kecenderungan alami adalah memasukkan semakin banyak logic ke BFF karena ia adalah layer paling dekat dengan frontend. Ini harus dilawan secara sadar. BFF yang gemuk menjadi monolith baru dan kehilangan semua keuntungan pattern ini.

### Sinkronisasi Kontrak Antar Tim

Kalau BFF dikerjakan oleh tim frontend dan Python service oleh tim AI/ML, ada koordinasi yang perlu terjadi setiap kali ada perubahan kontrak. Ini adalah overhead organisasi yang tidak ada kalau semua ada di satu monolith. Kontrak harus explicit (OpenAPI spec) dan perubahan harus dikomunikasikan.

### Tidak Menyelesaikan Semua Masalah Scaling

BFF menyelesaikan masalah organisasi dan coupling, bukan masalah scaling secara langsung. Kalau masalahnya adalah database bottleneck atau compute bottleneck di Python service, menambahkan BFF tidak membantu. Scaling harus diselesaikan di layer yang memang menjadi bottleneck.
