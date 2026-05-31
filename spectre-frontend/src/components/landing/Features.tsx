import { Link } from 'react-router-dom'

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
      'FaceGuard compares live capture against stored embeddings and delivers the result straight to your webhook.',
  },
  {
    src: 'gallery-11.webp',
    title: 'Verify Liveness',
    description:
      'Every submission passes a mandatory liveness check — print attacks, replays, and masks are rejected before any identity operation runs.',
  },
]

export default function Features() {
  return (
    <section className="py-24 bg-neutral-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-normal text-neutral-ink mb-3 font-serif">
            How Specter Works
          </h2>
          <p className="text-base text-neutral-charcoal max-w-md mx-auto">
            A simple 3-step process to securely verify user identity.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.title} className="bg-white rounded-2xl overflow-hidden border border-neutral-line flex flex-col">
              {/* Image */}
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img
                  src={`/assets_compressed/${card.src}`}
                  alt={card.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-semibold text-neutral-ink mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-neutral-charcoal leading-relaxed flex-1 mb-6">
                  {card.description}
                </p>
                <Link
                  to="/auth/sign-up"
                  className="self-start px-5 py-2 rounded-full text-sm font-semibold text-white bg-neutral-ink hover:opacity-80 transition-opacity"
                >
                  Get Started
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
