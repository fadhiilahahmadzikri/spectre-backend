import { CheckCircle2 } from 'lucide-react'
import EndpointBar from '@/components/docs/EndpointBar'
import CodeBlock from '@/components/docs/CodeBlock'
import TableOfContents from '@/components/docs/TableOfContents'
import Callout from '@/components/docs/Callout'

const tocItems = [
  { label: 'Authenticate Face', href: '#authenticate-face', level: 1 as const },
  { label: 'Request', href: '#request', level: 2 as const },
  { label: 'Respons', href: '#response', level: 2 as const },
  { label: 'Error Codes', href: '#errors', level: 2 as const },
]

const curlExample = `curl -X POST {BASE_URL}/api/v1/faces/authenticate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: spk_xxxxxxxxxxxx" \\
  -d '{
    "external_user_id": "user@email.com",
    "image": "<base64>",
    "metadata": { "source": "web_ui", "bypass_fas": false }
  }'`

const successResponse = `{
  "session_id": "550e8400-...",
  "external_user_id": "user@email.com",
  "verdict": "ok",
  "metrics": {
    "similarity_score": 0.94,
    "liveness_confidence": 0.98,
    "inference_time_ms": 87
  }
}`

const errorCodes = [
  { code: 'FACE_PROFILE_NOT_FOUND', http: 404, desc: 'User belum register.' },
  { code: 'LIVENESS_CHECK_FAILED', http: 422, desc: 'Deteksi liveness gagal / bukan wajah asli.' },
  { code: 'FACE_MATCH_FAILED', http: 403, desc: 'Wajah tidak cocok dengan template tersimpan.' },
  { code: 'NO_FACE_DETECTED', http: 422, desc: 'Tidak ada wajah terdeteksi di gambar.' },
  { code: 'IMAGE_QUALITY_INSUFFICIENT', http: 422, desc: 'Kualitas gambar terlalu rendah.' },
  { code: 'INVALID_API_KEY', http: 401, desc: 'API key tidak valid.' },
  { code: 'API_KEY_REVOKED', http: 401, desc: 'API key sudah di-revoke.' },
  { code: 'MODEL_INFERENCE_ERROR', http: 500, desc: 'Kesalahan internal model ML.' },
]

export default function AuthenticateFace() {
  return (
    <div className="flex gap-12 px-4 sm:px-8 py-6 sm:py-10 max-w-6xl">
      <article className="flex-1 min-w-0 max-w-3xl">

        <div className="mb-6">
          <span className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">Face Operations</span>
          <h1 id="authenticate-face" className="text-3xl font-bold text-neutral-ink mt-3 mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
            Authenticate Face
          </h1>
          <p className="text-base text-neutral-slate">
            Verifikasi wajah user terhadap template tersimpan. Liveness, anti-spoof, dan face matching berjalan dalam satu request.
          </p>
        </div>

        <EndpointBar method="POST" path="/api/v1/faces/authenticate" />

        {/* Request */}
        <div id="request" className="mt-6 mb-8">
          <h2 className="text-lg font-bold text-neutral-ink mb-3">Request</h2>
          <p className="text-sm text-neutral-slate mb-3">
            Body sama seperti <a href="/docs/register-face" className="underline text-neutral-ink">Register Face</a> — bedanya endpoint dan user harus sudah terdaftar.
          </p>
          <CodeBlock code={curlExample} language="bash" filename="authenticate.sh" />
        </div>

        {/* Response */}
        <div id="response" className="mb-8">
          <h2 className="text-lg font-bold text-neutral-ink mb-3">Respons</h2>
          <p className="text-xs text-neutral-muted mb-1.5 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> 200 OK — wajah cocok & liveness terkonfirmasi</p>
          <CodeBlock code={successResponse} language="json" />
          <Callout variant="info" className="mt-3">
            Selalu cek <code className="font-mono text-xs">verdict === "ok"</code> sebelum memberikan akses, bukan hanya HTTP status.
          </Callout>
        </div>

        {/* Error Codes */}
        <div id="errors" className="mb-8">
          <h2 className="text-lg font-bold text-neutral-ink mb-3">Error Codes</h2>
          <div className="border border-neutral-line rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-surface border-b border-neutral-line">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Code</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">HTTP</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {errorCodes.map((r, i) => (
                  <tr key={r.code} className={i % 2 === 0 ? 'bg-neutral-white' : 'bg-neutral-canvas'}>
                    <td className="px-4 py-2.5"><code className="font-mono text-[11px] text-neutral-ink bg-neutral-surface border border-neutral-line px-1.5 py-0.5 rounded">{r.code}</code></td>
                    <td className="px-4 py-2.5"><code className="font-mono text-[13px] text-neutral-slate">{r.http}</code></td>
                    <td className="px-4 py-2.5 text-[13px] text-neutral-slate">{r.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </article>
      <div className="hidden xl:block pt-1">
        <TableOfContents items={tocItems} activeHref="#authenticate-face" />
      </div>
    </div>
  )
}
