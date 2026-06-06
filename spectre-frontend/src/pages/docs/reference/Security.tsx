import TableOfContents from '@/components/docs/TableOfContents'
import Callout from '@/components/docs/Callout'
import { Lock, Shield, RefreshCw, ClipboardList, Eye, Server } from 'lucide-react'

const tocItems = [
  { label: 'Security', href: '#security', level: 1 as const },
  { label: 'Data Handling', href: '#data-handling', level: 2 as const },
  { label: 'Threat Mitigations', href: '#threats', level: 2 as const },
  { label: 'Compliance', href: '#compliance', level: 2 as const },
]

const dataHandling = [
  {
    icon: Lock,
    title: 'Encryption at Rest',
    desc: 'All biometric templates are encrypted with AES-256-GCM. Encryption keys are managed by AWS KMS with automatic rotation every 90 days.',
  },
  {
    icon: Shield,
    title: 'TLS 1.3 in Transit',
    desc: 'All API traffic is encrypted with TLS 1.3. Legacy TLS 1.0/1.1 are disabled. Certificate pinning is available for mobile SDK builds.',
  },
  {
    icon: RefreshCw,
    title: 'Key Rotation',
    desc: 'API keys and KMS encryption keys support zero-downtime rotation. Old keys have a 15-minute grace period during transition.',
  },
  {
    icon: ClipboardList,
    title: 'Access Logs',
    desc: 'Every API call is logged with timestamp, key prefix, endpoint, result, IP, and latency. Retained 90 days. Exportable via dashboard.',
  },
  {
    icon: Eye,
    title: 'No Image Storage',
    desc: 'Raw face images are never persisted. Only encrypted biometric embeddings are stored. Submitted images are processed and discarded in memory.',
  },
  {
    icon: Server,
    title: 'Regional Data Isolation',
    desc: 'Choose your data region (US, EU, APAC) at tenant creation. Biometric data never leaves your selected region.',
  },
]

const threats = [
  { threat: 'Photo Spoofing', severity: 'High', mitigation: 'Multi-frame texture analysis + depth estimation. Confidence penalized for flat images.' },
  { threat: 'Video Replay', severity: 'High', mitigation: 'Temporal liveness check detects looped video. Challenge-response available for max-security deployments.' },
  { threat: '3D Mask', severity: 'High', mitigation: 'IR skin texture analysis (supported devices) + RGB anti-spoof model trained on mask datasets.' },
  { threat: 'Deepfake / GAN', severity: 'High', mitigation: 'Dedicated GAN artifact detector runs in parallel with the main liveness module.' },
  { threat: 'Credential Interception', severity: 'Medium', mitigation: 'API keys are only accepted over TLS. Store server keys outside browser clients and rotate them regularly.' },
  { threat: 'Credential Stuffing', severity: 'Medium', mitigation: 'Keyed-hash key prefix for fast invalidation. Per-key rate limits block enumeration.' },
  { threat: 'Insider Threat', severity: 'Low', mitigation: 'Specter staff cannot decrypt biometric data. AES-256 keys are envelope-encrypted by tenant-specific KMS keys.' },
]

const severityColors: Record<string, string> = {
  High:   'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/50 font-semibold',
  Medium: 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 font-semibold',
  Low:    'text-neutral-slate bg-neutral-surface',
}

export default function Security() {
  return (
    <div className="flex gap-12 px-4 sm:px-8 py-6 sm:py-10 max-w-6xl">
      <article className="flex-1 min-w-0 max-w-3xl">
        <div className="mb-8">
          <span className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">
            Reference
          </span>
          <h1 id="security" className="text-3xl font-bold text-neutral-ink mt-3 mb-3 font-['Plus_Jakarta_Sans',sans-serif]">
            Security
          </h1>
          <p className="text-base text-neutral-slate leading-relaxed">
            Specter is designed from the ground up for security. This page details our data
            handling practices, threat mitigation layers, and compliance posture.
          </p>
        </div>

        <Callout variant="success" title="Biometric data never leaves your region" className="mb-8">
          Specter operates strict regional data isolation. Biometric templates are stored and
          processed exclusively within your selected region (US, EU, APAC).
        </Callout>

        {/* Data Handling */}
        <div id="data-handling" className="mb-10">
          <h2 className="text-xl font-bold text-neutral-ink mb-5">Data Handling</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dataHandling.map(({ icon: Icon, title, desc }) => (
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
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Severity</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {threats.map((row, i) => (
                  <tr key={row.threat} className={i % 2 === 0 ? 'bg-neutral-white' : 'bg-neutral-canvas'}>
                    <td className="px-4 py-3 font-medium text-neutral-ink text-sm whitespace-nowrap">{row.threat}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${severityColors[row.severity]}`}>
                        {row.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-slate text-xs leading-relaxed">{row.mitigation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compliance */}
        <div id="compliance" className="mb-10">
          <h2 className="text-xl font-bold text-neutral-ink mb-4">Compliance</h2>
          <div className="flex flex-wrap gap-3">
            {['SOC 2 Type II', 'GDPR', 'CCPA', 'ISO 27001', 'BIPA-ready', 'HIPAA-eligible'].map((badge) => (
              <span key={badge} className="px-3 py-1.5 bg-neutral-white border border-neutral-line rounded-lg text-sm font-medium text-neutral-charcoal">
                {badge}
              </span>
            ))}
          </div>
          <p className="text-sm text-neutral-slate mt-4 leading-relaxed">
            Specter maintains SOC 2 Type II certification and supports GDPR/CCPA data subject
            requests via API. Contact <a href="mailto:security@faceguard.io" className="text-neutral-ink underline hover:text-neutral-charcoal">security@faceguard.io</a> for
            compliance documentation or penetration test reports.
          </p>
        </div>
      </article>

      <div className="hidden xl:block pt-1">
        <TableOfContents items={tocItems} activeHref="#security" />
      </div>
    </div>
  )
}
