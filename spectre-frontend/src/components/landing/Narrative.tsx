import { useRef, useState, useCallback } from 'react'
import { ScanFace, ShieldAlert, UserCheck } from 'lucide-react'

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center align-middle mx-1.5 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-neutral-surface border border-neutral-line">
      {children}
    </span>
  )
}

export default function Narrative() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [fogTop, setFogTop] = useState(0)    // 0–1
  const [fogBottom, setFogBottom] = useState(1) // 0–1

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const maxScroll = scrollHeight - clientHeight
    setFogTop(Math.min(scrollTop / 60, 1))
    setFogBottom(maxScroll > 0 ? Math.min((maxScroll - scrollTop) / 60, 1) : 0)
  }, [])

  return (
    <div className="bg-neutral-canvas py-12 sm:py-24">
      <section className="relative overflow-hidden" style={{ height: 'clamp(320px, 60vw, 520px)' }}>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="h-full px-6 sm:px-20 lg:px-32 py-8 sm:py-16"
          style={{ overflowY: 'scroll', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          <div className="max-w-4xl mx-auto text-left">
            <p className="font-sans font-normal text-neutral-ink leading-tight mb-6 sm:mb-8"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 3.25rem)' }}>
              Specter is a API service to<br />your application's biometric<br />security.
            </p>

            <p className="font-sans font-normal text-neutral-ink leading-tight mb-6 sm:mb-8"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 3.25rem)' }}>
              Set up a
              <IconBadge><ScanFace className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-ink" /></IconBadge>
              seamless authentication flow, block spoofing attacks
              <IconBadge><ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-ink" /></IconBadge>
              with Liveness detection, verify true user identities
              <IconBadge><UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-ink" /></IconBadge>
              instantly.
            </p>

            <p className="font-sans font-normal text-neutral-ink leading-tight"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 3.25rem)' }}>
              Get your platform fully<br />protected with enterprise-<br />grade AI.
            </p>

            {/* Spacer agar teks terakhir bisa scroll ke tengah */}
            <div style={{ height: 'clamp(120px, 25vw, 200px)' }} />
          </div>
        </div>

        {/* Fog atas — muncul saat sudah di-scroll */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: '140px',
            opacity: fogTop,
            background: 'linear-gradient(to bottom, var(--nd-canvas), transparent)',
            transition: 'opacity 120ms ease',
          }}
        />

        {/* Fog bawah — selalu ada, memudar saat di ujung */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '140px',
            opacity: fogBottom,
            background: 'linear-gradient(to top, var(--nd-canvas), transparent)',
            transition: 'opacity 120ms ease',
          }}
        />

      </section>
    </div>
  )
}
