import LandingNavbar from '@/components/layout/LandingNavbar'

const HERO_VIDEO_SRC = '/assets_compressed/landingpagewoman.mp4'
const HERO_VIDEO_POSTER_SRC = '/assets_compressed/landingpagewoman-poster.webp'

function HeroVideo() {
  return (
    <video
      src={HERO_VIDEO_SRC}
      poster={HERO_VIDEO_POSTER_SRC}
      className="h-full w-full object-cover object-center"
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      aria-label="Specter biometric authentication preview"
    />
  )
}

function HeroMediaStage() {
  return (
    <div className="relative mx-auto aspect-video w-full max-w-[880px] overflow-hidden">
      <HeroVideo />

      <div
        className="pointer-events-none absolute bottom-0 left-0 top-0 z-[4] w-[18%]"
        style={{ background: 'linear-gradient(to right, var(--nd-canvas) 0%, rgba(255,255,255,0.88) 42%, transparent 100%)' }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 top-0 z-[4] w-[18%]"
        style={{ background: 'linear-gradient(to left, var(--nd-canvas) 0%, rgba(255,255,255,0.88) 42%, transparent 100%)' }}
      />
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-[4] h-[12%]"
        style={{ background: 'linear-gradient(to bottom, var(--nd-canvas) 0%, rgba(255,255,255,0.64) 46%, transparent 100%)' }}
      />

      <div className="absolute bottom-[3%] left-1/2 z-[5] w-[44%] -translate-x-1/2 sm:w-[25%]" style={{ filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.28))' }}>
        <img src="/assets_compressed/mock-iphone.webp" alt="Specter face scan" draggable={false}
          style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-[25%]"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--nd-canvas))' }} />
    </div>
  )
}

export default function Hero() {
  return (
    <section className="bg-neutral-canvas overflow-hidden">
      <LandingNavbar />

      {/* Hero text */}
      <div className="text-center pt-14 pb-12 px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-[60px] font-normal text-neutral-ink leading-[1.08] mb-4 font-serif">
          AI-powered biometric
          <br />
          authentication for your apps.
        </h1>
        <p className="text-base sm:text-lg text-neutral-charcoal max-w-xl mx-auto">
          Protect you from any kind of spoofing attack
        </p>
      </div>

      {/* Hero video section */}
      <HeroMediaStage />
    </section>
  )
}
