const left = [
  {
    src: 'gallery-01.webp',
    title: 'Printing Attack',
    description: 'A simple printed image is used to impersonate a legitimate user, exploiting systems that rely on 2D facial features.',
  },
  {
    src: 'gallery-02.webp',
    title: 'Mask',
    description: 'A realistic 3D mask replicates facial geometry, enabling more convincing impersonation of a legitimate user.',
  },
  {
    src: 'gallery-03.webp',
    title: 'Half Face',
    description: 'Only part of a real face is presented to the system, leveraging partial features to mimic a legitimate user.',
  },
]

const center = [
  {
    src: 'gallery-04.webp',
    title: 'Papercut Attack',
    description: 'A modified photo with cut-out regions is used to simulate partial motion, increasing the chance of bypassing detection systems.',
  },
  {
    src: 'gallery-05.webp',
    title: 'Screen Attack',
    description: 'A facial image or video is presented via a digital screen, enabling unauthorized access by mimicking a real user.',
  },
]

const right = [
  {
    src: 'gallery-06.webp',
    title: 'Mannequin',
    description: 'A lifelike mannequin head is used to mimic a real face, replicating facial structure to deceive recognition systems.',
  },
  {
    src: 'gallery-07.webp',
    title: '2D Mask',
    description: 'A flat mask with facial features is used to imitate a real face, presenting structured patterns that can mislead recognition systems.',
  },
  {
    src: 'gallery-08.webp',
    title: 'Make Up',
    description: 'Facial appearance is altered using makeup to imitate another identity or obscure distinguishing features.',
  },
]

interface CardProps {
  src: string
  title: string
  description: string
  stretch?: boolean
}

function Card({ src, title, description, stretch = false }: CardProps) {
  return (
    <div className={`relative rounded-[18px] overflow-hidden bg-[#ECECEC] w-full ${stretch ? 'h-full' : ''}`}>
      <div className={stretch ? 'h-full' : 'aspect-[4/3] w-full'}>
        <img
          src={`/assets_compressed/${src}`}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Scrim */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          top: '20%',
          background:
            'linear-gradient(to bottom, rgba(217,217,217,0) 0%, rgba(4,4,4,0.49) 49%, #040404 100%)',
        }}
      />

      {/* Caption bottom-aligned */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
        <p className="text-white text-3xl font-normal leading-tight font-serif mb-2">
          {title}
        </p>
        <p className="text-white/60 text-base leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}

function MaskIcon({ tilt }: { tilt: 'left' | 'right' }) {
  const id = tilt === 'left' ? 'mask-grad-l' : 'mask-grad-r'
  const rotate = tilt === 'left' ? -42 : 5
  return (
    <svg
      width="44" height="44" viewBox="0 0 57 57" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 opacity-80"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <g clipPath={`url(#clip-${tilt})`}>
        <path d="M48.4714 18.9901C48.2186 18.6216 47.8795 18.3204 47.4836 18.113C47.0877 17.9056 46.6471 17.7982 46.2002 17.8001C43.6126 17.8089 38.5029 17.5275 33.3995 15.5613C28.2961 13.5951 24.3168 10.3748 22.4008 8.63099C22.0702 8.33028 21.6712 8.11468 21.2385 8.00288C20.8058 7.89107 20.3523 7.88642 19.9174 7.98934C19.4824 8.09225 19.0791 8.29962 18.7424 8.59349C18.4056 8.88736 18.1456 9.25888 17.9848 9.67589L14.5387 18.6205C12.3241 24.3686 11.7827 30.3875 13.0167 35.5653C14.2943 40.9311 17.3156 44.7733 21.5209 46.3934C25.7261 48.0136 30.5462 47.187 35.0919 44.0702C39.4797 41.062 43.1165 36.2357 45.3311 30.4875L48.7784 21.5397C48.9386 21.1218 48.9943 20.6712 48.9408 20.2269C48.8873 19.7826 48.7262 19.358 48.4714 18.9901ZM20.0898 26.2038C19.9288 26.2869 19.7529 26.3374 19.5723 26.3526C19.3917 26.3677 19.2099 26.3471 19.0373 26.292C18.6887 26.1806 18.3986 25.9353 18.2308 25.6101C18.063 25.2848 18.0313 24.9062 18.1426 24.5576C18.254 24.2089 18.4993 23.9188 18.8245 23.751C20.1409 23.0831 22.0782 23.0411 23.6532 23.6479C25.2281 24.2547 26.6365 25.5856 27.1645 26.9641C27.2281 27.1338 27.2578 27.3143 27.2517 27.4955C27.2456 27.6766 27.2039 27.8547 27.1289 28.0197C27.054 28.1847 26.9473 28.3333 26.8149 28.4571C26.6825 28.5808 26.5271 28.6773 26.3574 28.741C26.1877 28.8047 26.0072 28.8343 25.8261 28.8282C25.645 28.8221 25.4668 28.7804 25.3018 28.7055C25.1368 28.6305 24.9882 28.5238 24.8645 28.3914C24.7407 28.2591 24.6442 28.1036 24.5806 27.9339C24.3361 27.2872 23.4905 26.5323 22.6645 26.214C21.8385 25.8958 20.698 25.8874 20.0898 26.2038ZM31.6456 39.4712C30.4851 40.1093 29.1993 40.4863 27.8779 40.5756C26.5566 40.6649 25.2317 40.4645 23.9959 39.9884C22.7601 39.5123 21.6432 38.7719 20.7234 37.8192C19.8035 36.8664 19.1029 35.7241 18.6706 34.4723C18.5975 34.2997 18.5606 34.1139 18.562 33.9264C18.5633 33.739 18.603 33.5538 18.6786 33.3822C18.7542 33.2106 18.8641 33.0563 19.0015 32.9288C19.1389 32.8013 19.301 32.7032 19.4777 32.6406C19.6544 32.5779 19.842 32.5521 20.0291 32.5647C20.2161 32.5773 20.3986 32.6279 20.5654 32.7136C20.7321 32.7993 20.8796 32.9182 20.9987 33.063C21.1178 33.2077 21.2061 33.3753 21.258 33.5555C21.5579 34.4324 22.0464 35.2329 22.6891 35.9007C23.3318 36.5684 24.1131 37.0871 24.9779 37.4203C25.8427 37.7535 26.7701 37.8931 27.6947 37.8291C28.6193 37.7652 29.5186 37.4994 30.3293 37.0504C30.65 36.8767 31.0266 36.8375 31.3762 36.9414C31.7258 37.0454 32.0198 37.2839 32.1935 37.6046C32.3672 37.9253 32.4063 38.3019 32.3024 38.6515C32.1985 39.0011 31.9599 39.295 31.6392 39.4687L31.6456 39.4712ZM37.9055 33.191C37.7366 33.2551 37.5567 33.2852 37.3762 33.2797C37.1956 33.2741 37.0179 33.2331 36.8532 33.1589C36.6885 33.0846 36.5401 32.9787 36.4163 32.8471C36.2926 32.7154 36.196 32.5607 36.1321 32.3918C35.8877 31.745 35.0421 30.9901 34.2161 30.6719C33.3901 30.3536 32.2495 30.3452 31.6414 30.6616C31.4797 30.745 31.3033 30.7957 31.122 30.8108C30.9408 30.8259 30.7584 30.8052 30.5852 30.7499C30.4119 30.6945 30.2513 30.6056 30.1125 30.4881C29.9736 30.3707 29.8593 30.227 29.7759 30.0654C29.6926 29.9038 29.6419 29.7273 29.6268 29.5461C29.6116 29.3649 29.6323 29.1824 29.6877 29.0092C29.743 28.836 29.832 28.6754 29.9494 28.5365C30.0669 28.3977 30.2105 28.2833 30.3721 28.2C31.6822 27.5295 33.6194 27.4876 35.2008 28.0968C36.7822 28.7061 38.1841 30.0345 38.7121 31.4131C38.7766 31.5827 38.8069 31.7635 38.8013 31.9449C38.7956 32.1263 38.7541 32.3048 38.6791 32.4701C38.6042 32.6353 38.4972 32.7842 38.3644 32.9079C38.2316 33.0316 38.0757 33.1279 37.9055 33.191Z" fill={`url(#${id})`}/>
      </g>
      <defs>
        <linearGradient id={id} x1="25.8954" y1="18.3496" x2="21.5209" y2="46.3934" gradientUnits="userSpaceOnUse">
          <stop stopColor="#57555A"/>
          <stop offset="1"/>
        </linearGradient>
        <clipPath id={`clip-${tilt}`}>
          <rect width="44" height="44" fill="white" transform="translate(15.8184) rotate(21.0701)"/>
        </clipPath>
      </defs>
    </svg>
  )
}

export default function Gallery() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1706px] mx-auto px-8">

        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-normal text-neutral-ink mb-4 font-serif">
            Your Face Can Be Faked. Easily
          </h2>
          <p className="text-base text-neutral-charcoal max-w-xl mx-auto">
            From printed photos to deepfake modern spoofing attacks bypass traditional face recognition systems.
          </p>
        </div>

        {/* 3-column asymmetric grid */}
        <div
          className="grid gap-[22px] items-stretch"
          style={{ gridTemplateColumns: '1fr 1.373fr 1fr' }}
        >
          {/* Left column */}
          <div className="flex flex-col gap-[22px]">
            {left.map((item) => <Card key={item.src} {...item} />)}
          </div>

          {/* Center column — fills full height of grid row */}
          <div className="flex flex-col gap-[22px] h-full">
            <div className="flex-1 min-h-0">
              <Card {...center[0]} stretch />
            </div>

            {/* Mid divider */}
            <div className="flex items-center justify-center gap-3 py-2 shrink-0">
              <MaskIcon tilt="left" />
              <p className="text-neutral-ink text-4xl font-normal font-serif whitespace-nowrap">
                Reality Can Be Deceived
              </p>
              <MaskIcon tilt="right" />
            </div>

            <div className="flex-1 min-h-0">
              <Card {...center[1]} stretch />
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-[22px]">
            {right.map((item) => <Card key={item.src} {...item} />)}
          </div>
        </div>

      </div>
    </section>
  )
}
