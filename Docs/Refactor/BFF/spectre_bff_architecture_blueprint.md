# Spectre — BFF Architecture Blueprint
**Pattern:** Backend for Frontend (BFF)  
**Tujuan Dokumen:** Blueprint arsitektur untuk memenuhi checklist Full Stack side quest (Express) dan AI Engineer side quest (FastAPI) secara bersamaan, tanpa microservices dan tanpa rekayasa berlebihan.

---

## 1. Latar Belakang Masalah

### Konflik Checklist

| Checklist | Requirement Eksplisit | Status Saat Ini |
|---|---|---|
| Full Stack — Main Quest | RESTful API untuk support frontend | DONE (Python/FastAPI) |
| Full Stack — Side Quest | RESTful API dibangun menggunakan Express | NOT DONE |
| AI Engineer — Side Quest | REST API mandiri menggunakan FastAPI/Flask | NOT DONE (belum dicheck meski sudah ada) |

### Akar Masalah
Satu backend Python sudah mengcover main quest, tapi side quest Full Stack mewajibkan Express secara eksplisit. Menambahkan Express sebagai duplikat murni = tidak masuk akal. Mengganti FastAPI dengan Express = menghilangkan AI Engineer side quest dan merusak ML pipeline.

### Solusi
**Backend for Frontend (BFF)** — Express bukan pengganti FastAPI. Express adalah entry point resmi frontend yang punya business logic sendiri, sekaligus proxy ke FastAPI untuk operasi ML. Dua service, satu concern masing-masing.

---

## 2. Pattern: Backend for Frontend (BFF)

### Definisi
BFF adalah architectural pattern di mana setiap frontend client memiliki backend service yang dedicated dan tailored. Backend ini bertanggung jawab atas aggregasi data, transformasi response, auth handling, dan proxying ke downstream service — bukan sekadar reverse proxy.

### Justifikasi Kenapa BFF (Bukan Microservices)
Microservices dijustifikasi oleh: latensi yang degraded karena single-service overload, tim yang perlu deploy secara independen per domain, atau requirement scaling yang asimetris antar domain.

Spectre tidak memiliki kondisi tersebut. Yang ada adalah **runtime mismatch yang inherent**: Python dibutuhkan untuk TensorFlow dan InsightFace (tidak bisa dipindah ke Node.js), dan Node.js/Express dibutuhkan oleh checklist (dan memang idiomatis untuk web API layer). Ini bukan keputusan scaling — ini pemisahan concern berdasarkan kapabilitas runtime. BFF adalah pattern yang tepat untuk situasi ini.

### Referensi Industri
- **SoundCloud**: menciptakan pattern ini untuk memisahkan mobile BFF dan web BFF dari core service.
- **Netflix**: menggunakan BFF layer Node.js sebagai entry point per client type (smart TV, mobile, web) yang masing-masing aggregate dari backend Python/Java.
- **Spotify**: custom BFF per platform untuk optimasi payload dan performance per client.

---

## 3. Target Arsitektur

```
React Frontend (spectre-frontend + spectre-snap SDK)
    |
    | Native Fetch API — HTTP/HTTPS
    | Authorization: Bearer <jwt> ATAU X-API-Key: <key>
    v
+------------------------------------------+
|         Express BFF (Node.js)            |  <-- Full Stack side quest
|                                          |
|  - Auth middleware (JWT issuance)        |
|  - Application CRUD (direct Supabase)   |
|  - API Key management (direct Supabase) |
|  - Session listing (direct Supabase)    |
|  - Rate limiting & audit logging        |
|  - ML proxy (forward to FastAPI)        |
+------------------------------------------+
    |                    |
    | direct queries     | HTTP proxy (face ops)
    | @supabase/js       |
    v                    v
+-------------+   +------------------------------------------+
|  Supabase   |   |     FastAPI — HF Spaces (existing)       |  <-- AI Eng side quest
| PostgreSQL  |   |                                          |
|             |   |  - Face register / authenticate          |
|   shared    |<--|  - FAS inference (AntiSpoofNet)          |
|  instance   |   |  - Benchmark & model management          |
|             |   |  - asyncpg → Supabase                    |
+-------------+   +------------------------------------------+
```

---

## 4. Pembagian Tanggung Jawab

### 4.1 Express BFF — Owns Langsung (Direct Supabase)

Ini adalah business logic nyata yang Express miliki sendiri, bukan proxy. Bagian ini yang membuat Express bukan sekadar thin proxy di mata evaluator.

#### Auth Domain
```
POST   /api/v1/auth/register     → Express: hash password, insert user ke Supabase, return JWT
POST   /api/v1/auth/login        → Express: verify credentials, issue JWT (jsonwebtoken)
POST   /api/v1/auth/logout       → Express: revoke refresh token di Supabase
POST   /api/v1/auth/refresh      → Express: rotate refresh token
```

Express menerbitkan JWT-nya sendiri menggunakan secret yang sama dengan FastAPI (shared secret), atau Express mendelegasikan ke FastAPI dan meng-cache hasilnya. Pilihan pertama lebih clean karena Express benar-benar owns auth domain.

#### Application Management Domain
```
GET    /api/v1/applications              → Express: SELECT dari table applications WHERE user_id = :id
POST   /api/v1/applications              → Express: INSERT ke table applications, return ApplicationResponse
PATCH  /api/v1/applications/:id          → Express: UPDATE applications SET ... WHERE id = :id
DELETE /api/v1/applications/:id          → Express: soft-delete (UPDATE deleted_at = NOW())
GET    /api/v1/applications/:id          → Express: SELECT single application
```

#### API Key Management Domain
```
GET    /api/v1/applications/:id/api-keys              → Express: SELECT api_keys WHERE app_id = :id
POST   /api/v1/applications/:id/api-keys              → Express: generate key (crypto.randomBytes), INSERT
POST   /api/v1/applications/:id/api-keys/:kid/revoke  → Express: UPDATE status = 'revoked'
DELETE /api/v1/applications/:id/api-keys/:kid         → Express: hard DELETE
```

Key generation: Express menggunakan `crypto.randomBytes(32).toString('hex')` dengan prefix `spk_`. Key di-hash (bcrypt) sebelum disimpan. Full key dikembalikan sekali saja saat generate.

#### Session & Dashboard Domain
```
GET    /api/v1/sessions          → Express: SELECT sessions dari Supabase (FastAPI yang menulis sessions ini)
GET    /api/v1/dashboard         → Express: aggregate — ambil stats aplikasi + session summary dalam satu response
POST   /api/v1/client-logs       → Express: INSERT audit log ke Supabase
```

Ini contoh aggregasi yang murni Express punya: satu request dari frontend, Express query beberapa tabel di Supabase dan return response yang sudah di-shape untuk dashboard.

#### Webhook Domain
```
POST   /api/v1/applications/:id/webhooks/test              → Express: trigger test ping
GET    /api/v1/applications/:id/webhooks/deliveries         → Express: SELECT webhook_deliveries WHERE app_id = :id
POST   /api/v1/applications/:id/webhooks/deliveries/:id/retry → Express: re-queue via Celery atau langsung hit FastAPI
```

---

### 4.2 Express BFF — Proxy ke FastAPI (ML Operations)

Untuk semua operasi yang membutuhkan Python/TensorFlow, Express menjadi gatekeeper: validasi API key dari Supabase-nya sendiri, kemudian forward request ke FastAPI.

#### Face Operations (Proxy)
```
POST   /api/v1/faces/register          → Express validates X-API-Key → forward ke FastAPI /api/v1/faces/register
POST   /api/v1/faces/authenticate      → Express validates X-API-Key → forward ke FastAPI /api/v1/faces/authenticate
PUT    /api/v1/faces/:user_id          → Express validates → forward
DELETE /api/v1/faces/:user_id          → Express validates → forward
GET    /api/v1/faces                   → Express validates → forward
GET    /api/v1/faces/:user_id/exists   → Express validates → forward
DELETE /api/v1/faces                   → Express validates → forward
POST   /api/v1/faces/benchmark         → Express validates → forward
GET    /api/v1/sessions/:id            → Express validates → forward (session detail dari FastAPI)
```

Express tidak mengubah business logic operasi ML ini. Express hanya:
1. Memvalidasi X-API-Key (lookup ke Supabase yang Express kelola)
2. Meng-inject header tambahan (app_id, tenant context)
3. Forward request body as-is ke FastAPI
4. Return response dari FastAPI ke client

#### Admin & Health (Proxy atau Disabled)
```
GET    /health        → Express expose health-nya sendiri + optional forward ke FastAPI health
GET    /health/ml-status → Express forward ke FastAPI
/admin/*              → Express bisa expose admin routes dengan auth layer Express sendiri, forward ke FastAPI
```

---

### 4.3 FastAPI — Tidak Berubah

FastAPI tetap berjalan di HF Spaces dengan semua endpoint yang sudah ada. Satu-satunya perubahan konseptual: FastAPI tidak lagi dipanggil langsung oleh frontend. FastAPI dipanggil oleh Express.

Untuk testing dan development, FastAPI tetap bisa di-hit langsung (Swagger UI di HF Spaces tetap accessible). Untuk production flow, traffic harus melalui Express.

**FastAPI exclusive domains (tidak perlu di-expose via Express):**
- `/admin/fas-models` — kontrol model FAS
- `/admin/config` — hot-reload threshold
- `/admin/stats` — infrastruktur stats
- `/health/ml-status` — ML model status detail

---

## 5. Express Implementation Detail

### 5.1 Tech Stack Express

```
express@4.x
@supabase/supabase-js@2.x     ← koneksi ke Supabase
jsonwebtoken                   ← JWT issuance & verification
bcryptjs                       ← password hashing & key hashing
express-rate-limit             ← rate limiting per client
http-proxy-middleware          ← proxy ke FastAPI
morgan                         ← request logging
zod                            ← request validation (equivalent Pydantic)
dotenv                         ← environment management
```

### 5.2 Project Structure Express

```
spectre-bff/
├── src/
│   ├── app.js                      ← Express app factory
│   ├── server.js                   ← entrypoint
│   ├── config/
│   │   └── supabase.js             ← Supabase client init
│   ├── middleware/
│   │   ├── auth.middleware.js      ← JWT verification
│   │   ├── apiKey.middleware.js    ← X-API-Key validation vs Supabase
│   │   ├── rateLimiter.js          ← express-rate-limit config
│   │   └── errorHandler.js         ← global error handler
│   ├── routes/
│   │   ├── auth.routes.js          ← POST register, login, refresh, logout
│   │   ├── applications.routes.js  ← CRUD applications
│   │   ├── apiKeys.routes.js       ← API key management
│   │   ├── sessions.routes.js      ← GET sessions (dari Supabase)
│   │   ├── webhooks.routes.js      ← webhook management
│   │   ├── faces.routes.js         ← proxy ke FastAPI + key validation
│   │   └── health.routes.js        ← BFF health check
│   ├── services/
│   │   ├── auth.service.js         ← register/login logic
│   │   ├── application.service.js  ← CRUD logic
│   │   ├── apiKey.service.js       ← key generation & validation
│   │   ├── session.service.js      ← session fetching
│   │   └── fasProxy.service.js     ← HTTP proxy logic ke FastAPI
│   └── validators/
│       ├── auth.schema.js          ← Zod schemas untuk auth
│       └── application.schema.js   ← Zod schemas untuk app management
├── .env
├── .env.example
├── package.json
└── Dockerfile
```

### 5.3 Key Implementation: API Key Validation Middleware

Ini adalah logic paling kritis di Express — sebelum forward ke FastAPI, Express harus validasi key dari Supabase-nya sendiri.

```javascript
// src/middleware/apiKey.middleware.js
const { supabase } = require('../config/supabase')

const validateApiKey = async (req, res, next) => {
  const rawKey = req.headers['x-api-key']
  if (!rawKey) return res.status(401).json({ error: 'Missing X-API-Key' })

  const prefix = rawKey.substring(0, 10)

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, app_id, status, hashed_key, application:applications(id, name, status)')
    .eq('key_prefix', prefix)
    .single()

  if (error || !data) return res.status(401).json({ error: 'Invalid API key' })
  if (data.status !== 'active') return res.status(401).json({ error: 'API key revoked' })

  const bcrypt = require('bcryptjs')
  const valid = await bcrypt.compare(rawKey, data.hashed_key)
  if (!valid) return res.status(401).json({ error: 'Invalid API key' })

  req.appId = data.app_id
  req.application = data.application
  next()
}

module.exports = { validateApiKey }
```

### 5.4 Key Implementation: ML Proxy Service

```javascript
// src/services/fasProxy.service.js
const { createProxyMiddleware } = require('http-proxy-middleware')

const FASTAPI_BASE = process.env.FASTAPI_BASE_URL

const buildFasProxy = () => createProxyMiddleware({
  target: FASTAPI_BASE,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/faces': '/api/v1/faces' },
  on: {
    proxyReq: (proxyReq, req) => {
      proxyReq.setHeader('X-App-Id', req.appId)
      proxyReq.setHeader('X-Forwarded-By', 'spectre-bff')
    },
    error: (err, req, res) => {
      res.status(502).json({ error: 'ML service unavailable', detail: err.message })
    }
  }
})

module.exports = { buildFasProxy }
```

### 5.5 Key Implementation: Auth Service (Direct Supabase)

```javascript
// src/services/auth.service.js
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { supabase } = require('../config/supabase')

class AuthService {
  async register({ email, password, displayName }) {
    const existing = await supabase.from('users').select('id').eq('email', email).single()
    if (existing.data) throw new Error('Email already registered')

    const hashed = await bcrypt.hash(password, 12)
    const { data, error } = await supabase
      .from('users')
      .insert({ email, password_hash: hashed, display_name: displayName })
      .select('id')
      .single()

    if (error) throw new Error(error.message)
    return { user_id: data.id }
  }

  async login({ email, password }) {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, password_hash, display_name')
      .eq('email', email)
      .single()

    if (!user) throw new Error('Invalid credentials')

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) throw new Error('Invalid credentials')

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )
    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    await supabase.from('refresh_tokens').insert({ user_id: user.id, token_hash: refreshToken })

    return { access_token: accessToken, refresh_token: refreshToken, user: { id: user.id, email: user.email } }
  }
}

module.exports = new AuthService()
```

---

## 6. Environment Variables

### Express BFF (.env)
```
PORT=3000
NODE_ENV=production

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

JWT_SECRET=same_secret_as_fastapi_or_independent
JWT_REFRESH_SECRET=separate_refresh_secret

FASTAPI_BASE_URL=https://thewhitenigs-spectre-backend.hf.space

CORS_ORIGIN=https://your-frontend.vercel.app
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_FACE_OPS=30
```

### FastAPI (tidak berubah)
Semua environment variables existing di HF Spaces tidak perlu diubah. FastAPI tetap berjalan independen.

---

## 7. Deployment Express BFF

### Pilihan Platform

| Platform | Alasan Cocok | Free Tier |
|---|---|---|
| Railway | Native Node.js support, deploy dari GitHub, env vars via dashboard | Ada (500 jam/bulan) |
| Render | Auto-deploy dari GitHub, persistent env vars, health check | Ada (spin-down setelah idle) |
| Fly.io | Persistent, tidak spin-down, global edge | Ada (3 shared VM) |

**Rekomendasi: Railway** — paling mudah setup, tidak ada cold start seperti Render free tier.

### Dockerfile Express
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 3000
CMD ["node", "src/server.js"]
```

---

## 8. Checklist Satisfaction Mapping

### Full Stack — Main Quest
| Requirement | Dipenuhi oleh | Cara |
|---|---|---|
| Networking calls ke API | React frontend | fetch ke Express BFF |
| Module bundler | Frontend | Vite |
| RESTful API support frontend | Express BFF | 20+ endpoints dengan full CRUD |
| RESTful API bisa simpan data | Express BFF | Direct Supabase via @supabase/js |
| URL konvensi RESTful | Express BFF | `/api/v1/resources/:id` pattern |
| Integrasi AI/ML sebagai fitur utama | Express + FastAPI | Face auth via proxy, liveness detection |

### Full Stack — Side Quest
| Requirement | Dipenuhi oleh | Cara |
|---|---|---|
| Mockup aplikasi | Figma / existing | Wireframe Spectre dashboard |
| Responsive layout | React frontend | Tailwind CSS |
| RESTful API simpan ke database | Express BFF | Supabase: users, applications, api_keys, sessions tables |
| **RESTful API menggunakan Express** | **Express BFF** | **Node.js Express — entry point utama** |
| Bootstrap / Tailwind / Axios | Frontend | Tailwind + native fetch |
| Deployment web app | Vercel / Netlify | Frontend deployment |

### AI Engineer — Side Quest
| Requirement | Dipenuhi oleh | Cara |
|---|---|---|
| **REST API mandiri dengan FastAPI/Flask** | **FastAPI di HF Spaces** | **Fully deployed, 30+ endpoints, OpenAPI 3.1.0** |
| Training loop kustom (tf.GradientTape) | Model training | AntiSpoofNetV4 training pipeline |
| API Generative AI fitur tambahan | Opsional | Bisa tambah ke FastAPI |
| TensorBoard integration | Model training | Logging via callbacks |

---

## 9. Data Flow: Skenario Register Face (End-to-End)

```
1. React (spectre-snap SDK)
   POST /api/v1/faces/register
   Headers: X-API-Key: spk_xxxx
   Body: { external_user_id, image (base64) }
        |
        v
2. Express BFF — apiKey.middleware.js
   - Ambil prefix dari key
   - SELECT * FROM api_keys WHERE key_prefix = 'spk_xxxx'
   - bcrypt.compare(rawKey, hashed_key)
   - Inject req.appId = app_id dari database
        |
        v
3. Express BFF — faces.routes.js
   - Rate limiter check
   - Proxy via http-proxy-middleware
   - Inject header X-App-Id: <app_id>
        |
        v
4. FastAPI — HF Spaces
   POST /api/v1/faces/register
   Headers: X-App-Id: <app_id> (dari Express)
   - Liveness detection (AntiSpoofNet)
   - Face embedding extraction (InsightFace)
   - INSERT session ke Supabase via asyncpg
   - Return { session_id, status, diagnostics }
        |
        v
5. Express BFF
   - Return FastAPI response as-is ke frontend
   
6. React (spectre-snap SDK)
   - Render hasil: authenticated / spoof_detected
```

---

## 10. Poin yang Harus Dijaga Saat Implementasi

**Express harus punya real DB interaction yang visible** — tabel `users`, `applications`, `api_keys` harus benar-benar di-query dari Express, bukan hanya dari FastAPI. Kalau evaluator melihat Express hanya forward semua ke FastAPI tanpa satu pun query DB sendiri, itu tidak bisa diklaim sebagai "RESTful API menggunakan Express."

**Shared Supabase, bukan shared code** — Express dan FastAPI boleh mengakses Supabase yang sama (tabel yang sama), tapi jangan share kode. Express pakai `@supabase/supabase-js`, FastAPI pakai `asyncpg`. Mereka independent secara runtime.

**FastAPI tidak perlu diubah** — tidak ada refactoring di FastAPI yang wajib untuk pattern ini. FastAPI tetap berjalan seperti sekarang. Yang berubah hanya cara frontend mengaksesnya (melalui Express, bukan langsung).

**CORS** — Express yang handle CORS ke frontend. FastAPI tidak perlu expose CORS ke internet kalau Express adalah satu-satunya caller-nya (bisa restrict FastAPI CORS ke Express origin saja di production).
