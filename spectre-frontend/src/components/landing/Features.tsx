import { useState, useEffect, useRef } from 'react'

const cards = [
  {
    src: 'gallery-09.webp',
    title: 'Registration',
    description:
      'A single API call stores a secure face embedding for your user — no raw images, no biometric data left behind.',
  },
  {
    src: 'gallery-10.webp',
    title: 'Authentication',
    description:
      'FaceGuard compares live capture against stored embeddings and returns the result through the SDK callback and session lookup API.',
  },
  {
    src: 'gallery-11.webp',
    title: 'Verify Liveness',
    description:
      'Every submission passes a mandatory liveness check — print attacks, replays, and masks are rejected before any identity operation runs.',
  },
]

const INTERVAL_MS = 3000

export default function Features() {
  const [current, setCurrent] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(i => (i + 1) % cards.length)
    }, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  // Slide track mengikuti current index
  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${current * 100}%)`
    }
  }, [current])

  return (
    <section className="py-12 sm:py-24 bg-neutral-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl font-normal text-neutral-ink mb-3 font-serif">
            How Specter Works
          </h2>
          <p className="text-base text-neutral-charcoal max-w-md mx-auto">
            A simple 3-step process to securely verify user identity.
          </p>
        </div>

        {/* Desktop: 3-column grid */}
        <div className="hidden md:grid grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.title} className="bg-neutral-canvas rounded-2xl overflow-hidden border border-neutral-line flex flex-col">
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img src={`/assets_compressed/${card.src}`} alt={card.title}
                  className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-semibold text-neutral-ink mb-2">{card.title}</h3>
                <p className="text-sm text-neutral-charcoal leading-relaxed flex-1">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: auto-slide */}
        <div className="md:hidden">
          {/* Track wrapper — overflow hidden */}
          <div className="overflow-hidden rounded-2xl">
            <div
              ref={trackRef}
              className="flex"
              style={{ transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
              {cards.map((card) => (
                <div key={card.title} className="w-full flex-shrink-0 bg-neutral-canvas border border-neutral-line rounded-2xl overflow-hidden">
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <img src={`/assets_compressed/${card.src}`} alt={card.title}
                      className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-neutral-ink mb-1.5">{card.title}</h3>
                    <p className="text-sm text-neutral-charcoal leading-relaxed">{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? '20px' : '7px',
                  height: '7px',
                  backgroundColor: i === current
                    ? 'var(--nd-ink)'
                    : 'var(--nd-line)',
                }}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
