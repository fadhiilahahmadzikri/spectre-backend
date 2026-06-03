import { CheckCircle2, XCircle } from 'lucide-react'
import EndpointBar from '@/components/docs/EndpointBar'
import CodeBlock from '@/components/docs/CodeBlock'
import TableOfContents from '@/components/docs/TableOfContents'
import Callout from '@/components/docs/Callout'

const tocItems = [
  { label: 'Register Face', href: '#register-face', level: 1 as const },
  { label: 'Request', href: '#request', level: 2 as const },
  { label: 'Respons', href: '#response', level: 2 as const },
]

const curlExample = `curl -X POST {BASE_URL}/api/v1/faces/register \\
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
  "verdict": "ok"
}`

const errorResponse = `{ "error": { "code": "FACE_ALREADY_REGISTERED" } }`

const params = [
  { name: 'external_user_id', type: 'string', req: true, desc: 'ID unik user di sistem kamu' },
  { name: 'image', type: 'string (base64)', req: true, desc: 'Foto wajah frontal, JPEG/PNG' },
  { name: 'metadata.source', type: 'string', req: true, desc: 'Asal request, mis. "web_ui"' },
  { name: 'metadata.bypass_fas', type: 'boolean', req: true, desc: 'false = aktifkan anti-spoof' },
  { name: 'detail_mode', type: 'boolean', req: false, desc: 'Sertakan data diagnostik ML' },
]

export default function RegisterFace() {
  return (
    <div className="flex gap-12 px-4 sm:px-8 py-6 sm:py-10 max-w-6xl">
      <article className="flex-1 min-w-0 max-w-3xl">

        <div className="mb-6">
          <span className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">Face Operations</span>
          <h1 id="register-face" className="text-3xl font-bold text-neutral-ink mt-3 mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
            Register Face
          </h1>
          <p className="text-base text-neutral-slate">
            Daftarkan wajah user. Face embedding dienkripsi dan disimpan — gambar asli tidak disimpan.
          </p>
        </div>

        <EndpointBar method="POST" path="/api/v1/faces/register" />

        {/* Request */}
        <div id="request" className="mt-6 mb-8">
          <h2 className="text-lg font-bold text-neutral-ink mb-3">Request</h2>
          <div className="border border-neutral-line rounded-lg overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-surface border-b border-neutral-line">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Parameter</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Tipe</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {params.map((p, i) => (
                  <tr key={p.name} className={i % 2 === 0 ? 'bg-neutral-white' : 'bg-neutral-canvas'}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono text-[12px] text-neutral-ink">{p.name}</code>
                        {p.req && <span className="text-[10px] text-red-500 font-semibold">required</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5"><code className="font-mono text-[12px] text-neutral-muted">{p.type}</code></td>
                    <td className="px-4 py-2.5 text-[13px] text-neutral-slate">{p.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CodeBlock code={curlExample} language="bash" filename="register.sh" />
        </div>

        {/* Response */}
        <div id="response" className="mb-8">
          <h2 className="text-lg font-bold text-neutral-ink mb-3">Respons</h2>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs text-neutral-muted mb-1.5 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> 200 OK — berhasil</p>
              <CodeBlock code={successResponse} language="json" />
            </div>
            <div>
              <p className="text-xs text-neutral-muted mb-1.5 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" /> 409 — user sudah terdaftar</p>
              <CodeBlock code={errorResponse} language="json" />
            </div>
          </div>
          <Callout variant="info" className="mt-4">
            SDK dengan <code className="font-mono text-xs">mode="auto"</code> otomatis beralih ke authenticate saat menerima <code className="font-mono text-xs">FACE_ALREADY_REGISTERED</code>.
          </Callout>
        </div>

      </article>
      <div className="hidden xl:block pt-1">
        <TableOfContents items={tocItems} activeHref="#register-face" />
      </div>
    </div>
  )
}
