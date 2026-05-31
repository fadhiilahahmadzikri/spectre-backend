import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const entries = [
  {
    version: 'v0.1.0',
    date: 'November 1, 2025',
    tag: 'Initial Release',
    tagColor: 'bg-[#240CF6]/10 text-[#240CF6]',
    changes: [
      { type: 'new', text: 'POST /v1/faces/register — biometric face registration endpoint.' },
      { type: 'new', text: 'POST /v1/faces/authenticate — liveness + anti-spoof + matching in one call.' },
      { type: 'new', text: 'POST /v1/faces/replace — atomic biometric template replacement.' },
      { type: 'new', text: 'DELETE /v1/faces/{external_user_id} — permanent face record deletion.' },
      { type: 'new', text: 'GET /v1/sessions/{session_id} — session detail retrieval.' },
      { type: 'new', text: 'Webhook delivery for face.registered, face.authenticated, face.replaced, face.deleted, session.expired.' },
      { type: 'new', text: 'HMAC-SHA256 webhook signature verification.' },
      { type: 'new', text: 'Publishable and secret API key pairs per tenant.' },
      { type: 'new', text: 'Redis sliding-window rate limiting per API key.' },
      { type: 'new', text: '@faceguard/js v0.1.0 — JavaScript SDK with pre-built popup UI.' },
      { type: 'new', text: '@faceguard/react v0.1.0 — React SDK with SpecterButton component.' },
      { type: 'new', text: 'AES-256-GCM encryption at rest for all biometric templates.' },
      { type: 'new', text: 'TLS 1.3 enforced for all API traffic.' },
    ],
  },
]

const typeStyles: Record<string, string> = {
  new: 'bg-[#DCFCE7] text-[#15803D]',
  fix: 'bg-[#FEE2E2] text-[#B91C1C]',
  improved: 'bg-[#DBEAFE] text-[#2563EB]',
  breaking: 'bg-[#FEF3C7] text-[#92400E]',
}

export default function Changelog() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-neutral-canvas">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-3xl font-bold text-neutral-ink mb-3 font-['Plus_Jakarta_Sans',sans-serif]">
            Changelog
          </h1>
          <p className="text-base text-neutral-slate mb-12 leading-relaxed">
            All notable changes to the Specter API and SDKs are documented here.
          </p>

          <div className="flex flex-col gap-10">
            {entries.map((entry) => (
              <div key={entry.version} className="flex gap-6">
                {/* Timeline dot */}
                <div className="flex flex-col items-center gap-2 pt-1 flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-[#240CF6]" />
                  <div className="flex-1 w-px bg-neutral-line" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-10">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h2 className="text-xl font-bold text-neutral-ink">
                      {entry.version}
                    </h2>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${entry.tagColor}`}>
                      {entry.tag}
                    </span>
                    <span className="text-sm text-neutral-muted">{entry.date}</span>
                  </div>

                  <div className="bg-white border border-neutral-line rounded-xl overflow-hidden">
                    <div className="divide-y divide-neutral-line">
                      {entry.changes.map((change, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-3">
                          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0 ${typeStyles[change.type] ?? 'bg-neutral-surface text-neutral-charcoal'}`}>
                            {change.type}
                          </span>
                          <p className="text-sm text-neutral-charcoal leading-relaxed">{change.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
