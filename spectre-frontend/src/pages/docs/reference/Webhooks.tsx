import TableOfContents from '@/components/docs/TableOfContents'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'

const tocItems = [
  { label: 'Webhooks', href: '#webhooks', level: 1 as const },
  { label: 'Event Types', href: '#events', level: 2 as const },
  { label: 'Payload Schema', href: '#schema', level: 2 as const },
  { label: 'Signature Verification', href: '#signature', level: 2 as const },
  { label: 'Delivery & Retries', href: '#delivery', level: 2 as const },
]

const webhookPayload = `{
  "event": "face.authenticated",
  "session_id": "ses_01J9K2M3N4P5Q6R7S8T9U0V1W",
  "external_user_id": "user_abc123",
  "result": "match",
  "confidence": 0.9872,
  "liveness": true,
  "spoof_detected": false,
  "quality_score": 0.91,
  "latency_ms": 87,
  "timestamp": "2025-11-01T12:01:35Z",
  "metadata": {
    "ip_address": "203.0.113.42",
    "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)"
  }
}`

const verifySignature = `import crypto from 'crypto'

function verifyWebhook(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex')
  )
}

// Express.js handler
app.post('/webhooks/faceguard', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-faceguard-signature'] as string
  const isValid = verifyWebhook(req.body.toString(), sig, process.env.WEBHOOK_SECRET!)

  if (!isValid) return res.status(401).json({ error: 'Invalid signature' })

  const event = JSON.parse(req.body.toString())
  // handle event.event type...

  res.status(200).json({ received: true })
})`

const events = [
  { event: 'face.registered', desc: 'A new face biometric record was created.' },
  { event: 'face.authenticated', desc: 'An authentication attempt completed (match or no_match).' },
  { event: 'face.replaced', desc: 'An existing biometric record was replaced.' },
  { event: 'face.deleted', desc: 'A biometric record was permanently deleted.' },
  { event: 'session.expired', desc: 'A session timed out before authentication completed.' },
]

export default function Webhooks() {
  return (
    <div className="flex gap-12 px-4 sm:px-8 py-6 sm:py-10 max-w-6xl">
      <article className="flex-1 min-w-0 max-w-3xl">
        <div className="mb-8">
          <span className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">
            Reference
          </span>
          <h1 id="webhooks" className="text-3xl font-bold text-neutral-ink mt-3 mb-3 font-['Plus_Jakarta_Sans',sans-serif]">
            Webhooks
          </h1>
          <p className="text-base text-neutral-slate leading-relaxed">
            Specter delivers real-time event notifications to your server via HTTP POST webhooks.
            Configure your webhook URL from the dashboard and start receiving events within seconds
            of each authentication.
          </p>
        </div>

        {/* Event types */}
        <div id="events" className="mb-10">
          <h2 className="text-xl font-bold text-neutral-ink mb-4">Event Types</h2>
          <div className="border border-neutral-line rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-surface border-b border-neutral-line">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Event</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Description</th>
                </tr>
              </thead>
              <tbody>
                {events.map((row, i) => (
                  <tr key={row.event} className={i % 2 === 0 ? 'bg-neutral-white' : 'bg-neutral-canvas'}>
                    <td className="px-4 py-2.5">
                      <code className="font-mono text-[13px] text-neutral-ink">{row.event}</code>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-slate text-sm">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payload Schema */}
        <div id="schema" className="mb-10">
          <h2 className="text-xl font-bold text-neutral-ink mb-4">Payload Schema</h2>
          <CodeBlock code={webhookPayload} language="json" filename="webhook-payload.json" />
        </div>

        {/* Signature Verification */}
        <div id="signature" className="mb-10">
          <h2 className="text-xl font-bold text-neutral-ink mb-4">Signature Verification</h2>
          <p className="text-sm text-neutral-slate mb-4">
            Every webhook request includes an{' '}
            <code className="font-mono text-[13px] bg-neutral-surface px-1 rounded">X-Specter-Signature</code>{' '}
            header containing an HMAC-SHA256 signature of the raw request body. Always verify this
            before processing the payload.
          </p>
          <Callout variant="warning" className="mb-4">
            Always use <strong>timing-safe comparison</strong> when verifying webhook signatures.
            Standard string equality is vulnerable to timing attacks.
          </Callout>
          <CodeBlock code={verifySignature} language="typescript" filename="verify-webhook.ts" />
        </div>

        {/* Delivery & Retries */}
        <div id="delivery" className="mb-10">
          <h2 className="text-xl font-bold text-neutral-ink mb-4">Delivery & Retries</h2>
          <div className="flex flex-col gap-3 text-sm text-neutral-slate">
            <p>Specter expects your endpoint to return HTTP <code className="font-mono text-[13px] bg-neutral-surface px-1 rounded">200</code> within 5 seconds.</p>
            <p>If delivery fails (non-2xx or timeout), Specter retries with exponential backoff:</p>
            <ul className="flex flex-col gap-1.5 pl-4">
              {[
                'Attempt 1: immediate',
                'Attempt 2: 5 seconds',
                'Attempt 3: 30 seconds',
                'Attempt 4: 5 minutes',
                'Attempt 5: 30 minutes (final)',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-neutral-ink">•</span>
                  {item}
                </li>
              ))}
            </ul>
            <p>After 5 failed attempts, the event is marked as <strong className="text-neutral-ink">undelivered</strong> and logged in your dashboard for manual replay.</p>
          </div>
        </div>
      </article>

      <div className="hidden xl:block pt-1">
        <TableOfContents items={tocItems} activeHref="#webhooks" />
      </div>
    </div>
  )
}
