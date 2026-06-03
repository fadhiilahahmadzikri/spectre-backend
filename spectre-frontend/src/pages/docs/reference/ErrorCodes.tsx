import TableOfContents from '@/components/docs/TableOfContents'

const tocItems = [
  { label: 'Error Codes', href: '#error-codes', level: 1 as const },
  { label: 'Client Errors', href: '#client', level: 2 as const },
  { label: 'Auth Errors', href: '#auth', level: 2 as const },
  { label: 'Server Errors', href: '#server', level: 2 as const },
]

const clientErrors = [
  { code: 'CAMERA_DENIED', status: '400', desc: 'User denied camera permission in the browser or device settings.' },
  { code: 'LOW_QUALITY', status: '400', desc: 'Image quality score below threshold. Ask user to retake in better lighting.' },
  { code: 'SPOOF_DETECTED', status: '400', desc: 'Anti-spoof shield rejected the submission (photo, video, or mask detected).' },
  { code: 'ALREADY_REGISTERED', status: '409', desc: 'A face record already exists for this external_user_id. Use Replace Face.' },
  { code: 'INVALID_KEY', status: '401', desc: 'API key is malformed, expired, or revoked.' },
  { code: 'NO_MATCH', status: '401', desc: 'Biometric comparison failed — face does not match the registered template.' },
  { code: 'FACE_NOT_FOUND', status: '404', desc: 'No registered face record found for the given external_user_id.' },
  { code: 'SESSION_EXPIRED', status: '410', desc: 'The session ID is older than 24 hours.' },
  { code: 'TIMEOUT', status: '408', desc: 'Authentication session timed out. Default timeout is 30 seconds.' },
  { code: 'RATE_LIMITED', status: '429', desc: 'Too many requests. Check X-RateLimit-Retry-After header for backoff time.' },
]

const authErrors = [
  { code: 'NETWORK_ERROR', status: '503', desc: 'Connectivity issue between client and Specter edge node.' },
  { code: 'LIVENESS_FAILED', status: '400', desc: 'Passive liveness check determined the face is not from a live person.' },
]

const serverErrors = [
  { code: 'INTERNAL_ERROR', status: '500', desc: 'Unexpected server-side error. Retry with exponential backoff. Open a ticket if it persists.' },
  { code: 'UNKNOWN', status: '500', desc: 'Unclassified error. Contact support with the session_id and timestamp.' },
]

function ErrorTable({ rows }: { rows: { code: string; status: string; desc: string }[] }) {
  return (
    <div className="border border-neutral-line rounded-lg overflow-x-auto mb-8">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-neutral-surface border-b border-neutral-line">
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Code</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">HTTP</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.code} className={i % 2 === 0 ? 'bg-neutral-white' : 'bg-neutral-canvas'}>
              <td className="px-4 py-2.5">
                <code className="font-mono text-[11px] text-neutral-ink bg-neutral-surface border border-neutral-line px-1.5 py-0.5 rounded whitespace-nowrap">
                  {row.code}
                </code>
              </td>
              <td className="px-4 py-2.5">
                <code className="font-mono text-[13px] text-neutral-slate">{row.status}</code>
              </td>
              <td className="px-4 py-2.5 text-neutral-slate text-xs leading-relaxed">{row.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ErrorCodes() {
  return (
    <div className="flex gap-12 px-4 sm:px-8 py-6 sm:py-10 max-w-6xl">
      <article className="flex-1 min-w-0 max-w-3xl">
        <div className="mb-8">
          <span className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">
            Reference
          </span>
          <h1 id="error-codes" className="text-3xl font-bold text-neutral-ink mt-3 mb-3 font-['Plus_Jakarta_Sans',sans-serif]">
            Error Codes
          </h1>
          <p className="text-base text-neutral-slate leading-relaxed">
            Specter uses structured error codes in both API responses and webhook payloads.
            Each error includes a machine-readable <code className="font-mono text-[13px] bg-neutral-surface px-1 rounded">code</code> field
            alongside the HTTP status code and a human-readable <code className="font-mono text-[13px] bg-neutral-surface px-1 rounded">message</code>.
          </p>
        </div>

        <div id="client" className="mb-2">
          <h2 className="text-xl font-bold text-neutral-ink mb-4">Client Errors</h2>
        </div>
        <ErrorTable rows={clientErrors} />

        <div id="auth" className="mb-2">
          <h2 className="text-xl font-bold text-neutral-ink mb-4">Auth & Liveness Errors</h2>
        </div>
        <ErrorTable rows={authErrors} />

        <div id="server" className="mb-2">
          <h2 className="text-xl font-bold text-neutral-ink mb-4">Server Errors</h2>
        </div>
        <ErrorTable rows={serverErrors} />
      </article>

      <div className="hidden xl:block pt-1">
        <TableOfContents items={tocItems} activeHref="#error-codes" />
      </div>
    </div>
  )
}
