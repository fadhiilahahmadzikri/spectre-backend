import TableOfContents from '@/components/docs/TableOfContents'
import Callout from '@/components/docs/Callout'
import { Lock, Shield, RefreshCw, ClipboardList } from 'lucide-react'

const tocItems = [
  { label: 'API Keys', href: '#api-keys', level: 1 as const },
  { label: 'Security', href: '#security', level: 2 as const },
  { label: 'Data Handling', href: '#data-handling', level: 2 as const },
  { label: 'Threat Mitigations', href: '#threats', level: 2 as const },
]

const dataCards = [
  {
    icon: Lock,
    title: 'Encryption at Rest',
    desc: 'All biometric templates are encrypted with AES-256-GCM before storage. Keys are managed via AWS KMS with automatic rotation every 90 days.',
  },
  {
    icon: Shield,
    title: 'TLS in Transit',
    desc: 'All API traffic is encrypted with TLS 1.3. Certificate pinning is available for mobile SDK deployments.',
  },
  {
    icon: RefreshCw,
    title: 'Key Rotation',
    desc: 'API keys can be rotated instantly from the dashboard with a 15-minute grace period for zero-downtime transitions.',
  },
  {
    icon: ClipboardList,
    title: 'Access Logs',
    desc: 'Every API call is logged with timestamp, key prefix, endpoint, result, and latency. Logs are retained for 90 days.',
  },
]

const threats = [
  { threat: 'Photo Spoofing', mitigation: 'Multi-frame texture analysis + depth estimation rejects flat printed images.' },
  { threat: 'Video Replay', mitigation: 'Temporal liveness check detects looped videos. Challenge-response available for high-security deployments.' },
  { threat: '3D Mask Attack', mitigation: 'IR-based skin texture analysis (on supported devices) and RGB anti-spoof model trained on 3D mask datasets.' },
  { threat: 'Deepfake / GAN', mitigation: 'Dedicated GAN artifact detector runs in parallel with the liveness module.' },
  { threat: 'MITM API Attack', mitigation: 'Webhook payloads are HMAC-SHA256 signed. Always verify signatures server-side.' },
  { threat: 'Credential Stuffing', mitigation: 'API keys use a keyed-hash prefix for fast invalidation. Rate limits block brute-force enumeration.' },
]

export default function ApiKeys() {
  return (
    <div className="flex gap-12 px-4 sm:px-8 py-6 sm:py-10 max-w-6xl">
      <article className="flex-1 min-w-0 max-w-3xl">
        <div className="mb-8">
          <span className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">
            Tenant Management
          </span>
          <h1 id="api-keys" className="text-3xl font-bold text-neutral-ink mt-3 mb-3 font-['Plus_Jakarta_Sans',sans-serif]">
            API Keys
          </h1>
          <p className="text-base text-neutral-slate leading-relaxed">
            API keys are the credentials that authenticate your tenant's requests to Specter.
            This page covers how keys are secured, how biometric data is handled, and the threat
            mitigations built into the platform.
          </p>
        </div>

        {/* Security */}
        <div id="security" className="mb-10">
          <h2 className="text-xl font-bold text-neutral-ink mb-4">Security</h2>
          <Callout variant="warning" title="Secret keys are shown once" className="mb-4">
            When you create a secret key, the full value is shown exactly once. Specter stores
            only a bcrypt hash of the key. If you lose it, you must create a new one.
          </Callout>
          <p className="text-sm text-neutral-slate leading-relaxed mb-4">
            Specter uses a two-tier key architecture:
          </p>
          <ul className="flex flex-col gap-2 text-sm text-neutral-slate pl-4">
            <li className="flex gap-2">
              <span className="text-neutral-ink mt-0.5">•</span>
              <span>
                <strong className="text-neutral-ink">Publishable keys</strong> — safe for
                client-side use. Can only trigger popup auth flows.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-neutral-ink mt-0.5">•</span>
              <span>
                <strong className="text-neutral-ink">Secret keys</strong> — server-side only.
                Required for face registration, deletion, and session retrieval.
              </span>
            </li>
          </ul>
        </div>

        {/* Data Handling */}
        <div id="data-handling" className="mb-10">
          <h2 className="text-xl font-bold text-neutral-ink mb-4">Data Handling</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dataCards.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-neutral-white border border-neutral-line rounded-xl p-5">
                <div className="w-9 h-9 rounded-lg bg-neutral-surface border border-neutral-line flex items-center justify-center mb-3">
                  <Icon className="w-4.5 h-4.5 text-neutral-charcoal" />
                </div>
                <p className="text-sm font-semibold text-neutral-ink mb-1">{title}</p>
                <p className="text-xs text-neutral-charcoal leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Threat Mitigations */}
        <div id="threats" className="mb-10">
          <h2 className="text-xl font-bold text-neutral-ink mb-4">Threat Mitigations</h2>
          <div className="border border-neutral-line rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-surface border-b border-neutral-line">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Threat</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {threats.map((row, i) => (
                  <tr key={row.threat} className={i % 2 === 0 ? 'bg-neutral-white' : 'bg-neutral-canvas'}>
                    <td className="px-4 py-3 font-medium text-neutral-ink text-sm whitespace-nowrap">{row.threat}</td>
                    <td className="px-4 py-3 text-neutral-slate text-xs leading-relaxed">{row.mitigation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </article>

      <div className="hidden xl:block pt-1">
        <TableOfContents items={tocItems} activeHref="#api-keys" />
      </div>
    </div>
  )
}
