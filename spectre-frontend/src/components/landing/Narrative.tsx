import { ScanFace, ShieldAlert, UserCheck } from 'lucide-react'

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center align-middle mx-2 w-12 h-12 rounded-full bg-neutral-surface border border-neutral-line">
      {children}
    </span>
  )
}

export default function Narrative() {
  return (
    <div className="bg-white py-24">
    <section className="overflow-hidden" style={{ height: '520px', position: 'relative' }}>
      {/* Scrollable inner */}
      <div
        className="h-full px-12 sm:px-20 lg:px-32 py-16"
        style={{ overflowY: 'scroll', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="max-w-4xl mx-auto text-left">
          {/* Paragraph 1 */}
          <p className="font-sans font-normal text-neutral-ink leading-tight mb-8"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>
            Specter is a API service to<br />your application's biometric<br />security.
          </p>

          {/* Paragraph 2 — with inline icons */}
          <p className="font-sans font-normal text-neutral-ink leading-tight mb-8"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>
            Set up a
            <IconBadge>
              <ScanFace className="w-6 h-6 text-neutral-ink" />
            </IconBadge>
            seamless authentication flow, block spoofing attacks
            <IconBadge>
              <ShieldAlert className="w-6 h-6 text-neutral-ink" />
            </IconBadge>
            with Liveness detection, verify true user identities
            <IconBadge>
              <UserCheck className="w-6 h-6 text-neutral-ink" />
            </IconBadge>
            instantly.
          </p>

          {/* Paragraph 3 — faded */}
          <p className="font-sans font-normal text-neutral-muted leading-tight"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>
            Get your platform fully<br />protected with enterprise-<br />grade AI.
          </p>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '160px',
          background: 'linear-gradient(to bottom, transparent, white)',
        }}
      />
    </section>
    </div>
  )
}
