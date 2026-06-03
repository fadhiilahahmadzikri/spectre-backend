import TableOfContents from '@/components/docs/TableOfContents'
import CodeBlock from '@/components/docs/CodeBlock'

const tocItems = [
  { label: 'Response Schema', href: '#response-schema', level: 1 as const },
  { label: 'Success Schema', href: '#success', level: 2 as const },
  { label: 'Error Schema', href: '#error', level: 2 as const },
  { label: 'Common Fields', href: '#fields', level: 2 as const },
]

const successSchema = `{
  "success": true,
  "session_id": "ses_01J9K2M3N4P5Q6R7S8T9U0V1W",
  "external_user_id": "string",
  "status": "registered | replaced | deleted | authenticated",
  "result": "match | no_match | error",
  "confidence": 0.9872,
  "liveness": true,
  "spoof_detected": false,
  "quality_score": 0.91,
  "face_quality_score": 0.94,
  "latency_ms": 87,
  "created_at": "2025-11-01T12:00:00Z",
  "completed_at": "2025-11-01T12:00:00.087Z",
  "metadata": {}
}`

const errorSchema = `{
  "success": false,
  "error": {
    "code": "SPOOF_DETECTED",
    "message": "Anti-spoof shield blocked the submission.",
    "status": 400,
    "session_id": "ses_01J9K2M3N4P5Q6R7S8T9U0V1W",
    "timestamp": "2025-11-01T12:01:35Z",
    "request_id": "req_9F8E7D6C5B4A3"
  }
}`

const fields = [
  { field: 'success', type: 'boolean', desc: 'true on success, false on error.' },
  { field: 'session_id', type: 'string', desc: 'Unique session identifier for this API call.' },
  { field: 'external_user_id', type: 'string', desc: 'Your system\'s user ID as provided in the request.' },
  { field: 'status', type: 'string', desc: 'Terminal state of the operation: registered, replaced, deleted, or authenticated.' },
  { field: 'result', type: 'string', desc: 'Authentication result: match, no_match, or error.' },
  { field: 'confidence', type: 'float', desc: 'Biometric match confidence score, 0.0–1.0. Only present on authentication.' },
  { field: 'liveness', type: 'boolean', desc: 'true if passive liveness check passed.' },
  { field: 'spoof_detected', type: 'boolean', desc: 'true if an anti-spoof attack was detected.' },
  { field: 'quality_score', type: 'float', desc: 'Overall image quality score, 0.0–1.0.' },
  { field: 'latency_ms', type: 'integer', desc: 'Server-side processing time in milliseconds.' },
  { field: 'created_at', type: 'datetime', desc: 'ISO 8601 UTC timestamp of session creation.' },
  { field: 'completed_at', type: 'datetime', desc: 'ISO 8601 UTC timestamp of session completion.' },
]

export default function ResponseSchema() {
  return (
    <div className="flex gap-12 px-4 sm:px-8 py-6 sm:py-10 max-w-6xl">
      <article className="flex-1 min-w-0 max-w-3xl">
        <div className="mb-8">
          <span className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">
            Reference
          </span>
          <h1 id="response-schema" className="text-3xl font-bold text-neutral-ink mt-3 mb-3 font-['Plus_Jakarta_Sans',sans-serif]">
            Response Schema
          </h1>
          <p className="text-base text-neutral-slate leading-relaxed">
            All Specter API responses follow a consistent JSON schema. Success responses include
            the full session object; error responses include a structured error envelope.
          </p>
        </div>

        {/* Success */}
        <div id="success" className="mb-10">
          <h2 className="text-xl font-bold text-neutral-ink mb-4">Success Schema</h2>
          <p className="text-sm text-neutral-slate mb-4">
            Successful responses return HTTP 2xx and the following structure (fields vary by endpoint):
          </p>
          <CodeBlock code={successSchema} language="json" filename="success-response.json" />
        </div>

        {/* Error */}
        <div id="error" className="mb-10">
          <h2 className="text-xl font-bold text-neutral-ink mb-4">Error Schema</h2>
          <p className="text-sm text-neutral-slate mb-4">
            Error responses always set <code className="font-mono text-[13px] bg-neutral-surface px-1 rounded">success: false</code>{' '}
            and include a nested <code className="font-mono text-[13px] bg-neutral-surface px-1 rounded">error</code> object:
          </p>
          <CodeBlock code={errorSchema} language="json" filename="error-response.json" />
        </div>

        {/* Fields */}
        <div id="fields" className="mb-10">
          <h2 className="text-xl font-bold text-neutral-ink mb-4">Common Fields</h2>
          <div className="border border-neutral-line rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-surface border-b border-neutral-line">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Field</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Description</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((row, i) => (
                  <tr key={row.field} className={i % 2 === 0 ? 'bg-neutral-white' : 'bg-neutral-canvas'}>
                    <td className="px-4 py-2.5">
                      <code className="font-mono text-[13px] text-neutral-ink">{row.field}</code>
                    </td>
                    <td className="px-4 py-2.5">
                      <code className="font-mono text-[13px] text-neutral-slate">{row.type}</code>
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
        <TableOfContents items={tocItems} activeHref="#response-schema" />
      </div>
    </div>
  )
}
