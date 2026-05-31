import LandingNavbar from '@/components/layout/LandingNavbar'

export default function Hero() {
  return (
    <section className="bg-white overflow-hidden">
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

      {/* Fanned mockup section */}
      <div
        className="relative w-full"
        style={{ height: 'clamp(400px, 54vw, 740px)' }}
      >
        {/* LEFT — mockup-1, mirrored */}
        <div
          className="absolute"
          style={{
            top: '8%', left: '3%', width: '50%', zIndex: 1,
            overflow: 'hidden',
          }}
        >
          <img
            src="/assets_compressed/hero-mockup-1.webp"
            alt=""
            draggable={false}
            style={{ width: '100%', height: 'auto', display: 'block', transform: 'scaleX(-1)' }}
          />
        </div>

        {/* RIGHT — mockup-2, no mirror */}
        <div
          className="absolute"
          style={{
            top: '8%', left: '45%', width: '50%', zIndex: 1,
            overflow: 'hidden',
          }}
        >
          <img
            src="/assets_compressed/hero-mockup-2.webp"
            alt=""
            draggable={false}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>

        {/* CENTER — mockup-3 sebagai latar wajah */}
        <div
          className="absolute"
          style={{ top: 0, left: '22%', width: '54%', zIndex: 2 }}
        >
          <div style={{ overflow: 'hidden' }}>
            <img
              src="/assets_compressed/hero-mockup-3.webp"
              alt="Specter Dashboard"
              draggable={false}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </div>

        {/* PHONE — top rata dengan dahi mockup-3, seluruh phone terlihat */}
        <div
          className="absolute"
          style={{
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '16%',
            zIndex: 5,
            filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.28))',
          }}
        >
          <img
            src="/assets_compressed/mock-iphone.webp"
            alt="Specter face scan"
            draggable={false}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>

        {/* Bottom fade to white */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '25%', zIndex: 10,
            background: 'linear-gradient(to bottom, transparent, white)',
          }}
        />

      </div>
    </section>
  )
}
