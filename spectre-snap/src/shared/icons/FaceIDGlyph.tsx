interface FaceIDGlyphProps {
  size?: number;
  className?: string;
}

export function FaceIDGlyph({ size = 28, className }: FaceIDGlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 210 223"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ objectFit: "contain" }}
      aria-hidden="true"
    >
      <path
        d="M23.8115 68.3734L155.161 138.19L183.722 121.096L181.914 87.8587L50.5646 18.0417L25.6253 37.0615L23.8115 68.3734Z"
        stroke="currentColor"
        strokeWidth="17"
      />
      <path
        d="M27.113 135.23L157.889 204.742L182.829 185.723L184.642 154.411L53.8661 84.8986L28.9268 103.918L27.113 135.23Z"
        stroke="currentColor"
        strokeWidth="17"
      />
    </svg>
  );
}
