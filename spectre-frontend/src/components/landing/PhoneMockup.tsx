const phones = [
  { src: 'phone-mockup-3.webp', alt: 'Spoofing detected', offset: 40, rotate: -8, scale: 0.88 },
  { src: 'phone-mockup-4.webp', alt: 'Liveness check',    offset: 0,  rotate: 0,  scale: 1    },
  { src: 'phone-mockup-2.webp', alt: 'Authentication',    offset: 40, rotate: 8,  scale: 0.88 },
]

export default function PhoneMockup() {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 flex flex-col items-center">

        {/* Phone fan */}
        <div className="flex items-end justify-center w-full mb-12" style={{ gap: '-12px' }}>
          {phones.map((phone) => (
            <div
              key={phone.src}
              className="relative flex-shrink-0"
              style={{
                width: `${phone.scale * 220}px`,
                transform: `translateY(${phone.offset}px) rotate(${phone.rotate}deg)`,
                zIndex: phone.rotate === 0 ? 2 : 1,
                marginLeft: phone.rotate === 0 ? '-16px' : '0',
                marginRight: phone.rotate === 0 ? '-16px' : '0',
              }}
            >
              <img
                src={`/assets_compressed/${phone.src}`}
                alt={phone.alt}
                draggable={false}
                className="w-full h-auto block drop-shadow-[0_24px_48px_rgba(0,0,0,0.18)]"
              />
            </div>
          ))}
        </div>

        {/* Tagline */}
        <p className="text-3xl sm:text-4xl font-normal font-serif text-neutral-ink text-center max-w-xl leading-snug mt-8">
          Scan your face to prove your<br />liveness, leave the fakes behind.
        </p>

      </div>
    </section>
  )
}
