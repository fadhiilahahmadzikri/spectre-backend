export default function SpecterIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="35"
      height="37"
      viewBox="0 0 35 37"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M30.4748 11.2L8.95919 22.6363L4.2809 19.8354L4.5769 14.3917L26.0925 2.95535L30.1771 6.07068L30.4748 11.2Z"
        stroke="url(#icon_g0)"
        strokeWidth="2.78467"
      />
      <path
        d="M29.9341 22.1514L8.51241 33.5377L4.42739 30.4215L4.13012 25.2931L25.5518 13.9068L29.6363 17.0221L29.9341 22.1514Z"
        stroke="url(#icon_g1)"
        strokeWidth="2.78467"
      />
      <defs>
        <linearGradient id="icon_g0" x1="24.0751" y1="6.81846" x2="11.1116" y2="26.1445" gradientUnits="userSpaceOnUse">
          <stop stopColor="#57555A" />
          <stop offset="1" stopColor="#040404" />
        </linearGradient>
        <linearGradient id="icon_g1" x1="23.7066" y1="17.6783" x2="10.8044" y2="36.4537" gradientUnits="userSpaceOnUse">
          <stop stopColor="#57555A" />
          <stop offset="1" stopColor="#040404" />
        </linearGradient>
      </defs>
    </svg>
  )
}
