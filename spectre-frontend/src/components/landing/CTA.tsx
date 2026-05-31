import { Link } from 'react-router-dom'

function CornerMark({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const base = 'absolute w-3 h-3 border-neutral-ink'
  const styles: Record<string, string> = {
    tl: 'top-4 left-4 border-t-2 border-l-2',
    tr: 'top-4 right-4 border-t-2 border-r-2',
    bl: 'bottom-4 left-4 border-b-2 border-l-2',
    br: 'bottom-4 right-4 border-b-2 border-r-2',
  }
  return <span className={`${base} ${styles[position]}`} />
}

export default function CTA() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-5xl mx-auto px-8">
        <div className="relative overflow-hidden border border-neutral-line rounded-2xl bg-white px-12 py-20 text-center">

          {/* Grid texture */}
          <img
            src="/grid.svg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none select-none"
          />

          {/* Corner markers */}
          <CornerMark position="tl" />
          <CornerMark position="tr" />
          <CornerMark position="bl" />
          <CornerMark position="br" />

          {/* Content */}
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-normal font-serif text-neutral-ink leading-tight mb-10 max-w-3xl mx-auto">
              Secure your system, or leave it exposed. The choice is yours.
            </h2>

            <div className="flex items-center justify-center gap-3">
              <Link
                to="/auth/sign-up"
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-neutral-ink hover:opacity-80 transition-opacity"
              >
                Get Started
              </Link>
              <Link
                to="/docs/introduction"
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-neutral-ink border border-neutral-ink hover:bg-neutral-surface transition-colors"
              >
                View Docs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
