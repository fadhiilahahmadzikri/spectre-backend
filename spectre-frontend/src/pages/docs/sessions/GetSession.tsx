import EndpointBar from '@/components/docs/EndpointBar'
import CodeBlock from '@/components/docs/CodeBlock'
import TableOfContents from '@/components/docs/TableOfContents'

const tocItems = [
  { label: 'Get Session', href: '#get-session', level: 1 as const },
  { label: 'Path Parameters', href: '#params', level: 2 as const },
  { label: 'Example', href: '#example', level: 2 as const },
  { label: 'Response', href: '#response', level: 2 as const },
  { label: 'Error Codes', href: '#errors', level: 2 as const },
]

const curlExample = `curl https://api.faceguard.io/v1/sessions/ses_01J9K2M3N4P5Q6R7S8T9U0V1W \\
  -H "X-Specter-Key: sk_live_xxxxxxxxxxxx"`

const sessionResponse = `{
  "session_id": "ses_01J9K2M3N4P5Q6R7S8T9U0V1W",
  "external_user_id": "user_abc123",
  "event": "face.authenticated",
  "result": "match",
  "confidence": 0.9872,
  "liveness": true,
  "spoof_detected": false,
  "quality_score": 0.91,
  "latency_ms": 87,
  "status": "completed",
  "created_at": "2025-11-01T12:01:35Z",
  "completed_at": "2025-11-01T12:01:35.087Z",
  "metadata": {
    "ip_address": "203.0.113.42",
    "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)"
  }
}`

const allErrorCodes = [
  { code: 'CAMERA_DENIED', http: '400', desc: 'User denied camera permission in the browser.' },
  { code: 'NETWORK_ERROR', http: '503', desc: 'Network connectivity issue during the session.' },
  { code: 'INVALID_KEY', http: '401', desc: 'The provided API key is invalid or revoked.' },
  { code: 'TIMEOUT', http: '408', desc: 'Session timed out before completion (default: 30s).' },
  { code: 'FACE_NOT_FOUND', http: '404', desc: 'No registered face for the given external_user_id.' },
  { code: 'SPOOF_DETECTED', http: '400', desc: 'Anti-spoof shield blocked the submission.' },
  { code: 'LOW_QUALITY', http: '400', desc: 'Image quality insufficient for reliable matching.' },
  { code: 'ALREADY_REGISTERED', http: '409', desc: 'A face record already exists for this user. Use Replace Face to update.' },
  { code: 'NO_MATCH', http: '401', desc: 'Face submitted does not match the registered template.' },
  { code: 'SESSION_EXPIRED', http: '410', desc: 'Session ID is older than 24 hours and has been purged.' },
  { code: 'RATE_LIMITED', http: '429', desc: 'API key has exceeded its rate limit. Check X-RateLimit-* headers.' },
  { code: 'INTERNAL_ERROR', http: '500', desc: 'An unexpected server-side error occurred. Retry with exponential backoff.' },
  { code: 'UNKNOWN', http: '500', desc: 'An unclassified error occurred. Contact support with the session_id.' },
]

export default function GetSession() {
  return (
    <div className="flex gap-12 px-4 sm:px-8 py-6 sm:py-10 max-w-6xl">
      <article className="flex-1 min-w-0 max-w-3xl">
        <div className="mb-6">
          <span className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">
            Sessions
          </span>
          <h1 id="get-session" className="text-3xl font-bold text-neutral-ink mt-3 mb-3 font-['Plus_Jakarta_Sans',sans-serif]">
            Get Session
          </h1>
          <p className="text-base text-neutral-slate leading-relaxed">
            Retrieves the full details of a completed or in-progress authentication session by its
            session ID. Sessions are retained for 24 hours.
          </p>
        </div>

        <EndpointBar method="GET" path="/v1/sessions/{session_id}" />

        {/* Path params */}
        <div id="params" className="mb-8">
          <h2 className="text-lg font-bold text-neutral-ink mb-3">Path Parameters</h2>
          <div className="border border-neutral-line rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-surface border-b border-neutral-line">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Parameter</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-neutral-white">
                  <td className="px-4 py-2.5">
                    <code className="font-mono text-[13px] text-neutral-ink">session_id</code>
                  </td>
                  <td className="px-4 py-2.5">
                    <code className="font-mono text-[13px] text-neutral-slate">string</code>
                  </td>
                  <td className="px-4 py-2.5 text-neutral-slate text-sm">
                    The session ID returned from a registration or authentication call, or delivered
                    in a webhook payload.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Example */}
        <div id="example" className="mb-8">
          <h2 className="text-lg font-bold text-neutral-ink mb-3">Example Request</h2>
          <CodeBlock code={curlExample} language="bash" filename="get-session.sh" />
        </div>

        {/* Response */}
        <div id="response" className="mb-8">
          <h2 className="text-lg font-bold text-neutral-ink mb-3">Session Response</h2>
          <CodeBlock code={sessionResponse} language="json" filename="session.json" />
        </div>

        {/* All error codes */}
        <div id="errors" className="mb-8">
          <h2 className="text-lg font-bold text-neutral-ink mb-4">All Error Codes</h2>
          <p className="text-sm text-neutral-slate mb-4">
            The following error codes may appear in session records and API error responses across
            all Specter endpoints.
          </p>
          <div className="border border-neutral-line rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-surface border-b border-neutral-line">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Code</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">HTTP</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Description</th>
                </tr>
              </thead>
              <tbody>
                {allErrorCodes.map((row, i) => (
                  <tr key={row.code} className={i % 2 === 0 ? 'bg-neutral-white' : 'bg-neutral-canvas'}>
                    <td className="px-4 py-2.5">
                      <code className="font-mono text-[11px] text-neutral-ink bg-neutral-surface border border-neutral-line px-1.5 py-0.5 rounded whitespace-nowrap">
                        {row.code}
                      </code>
                    </td>
                    <td className="px-4 py-2.5">
                      <code className="font-mono text-[13px] text-neutral-slate">{row.http}</code>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-slate text-xs leading-relaxed">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </article>

      <div className="hidden xl:block pt-1">
        <TableOfContents items={tocItems} activeHref="#get-session" />
      </div>
    </div>
  )
}
