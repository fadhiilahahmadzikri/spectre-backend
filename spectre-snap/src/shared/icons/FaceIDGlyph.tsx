interface FaceIDGlyphProps {
  size?: number;
  className?: string;
}

export function FaceIDGlyph({ size = 28, className }: FaceIDGlyphProps) {
  return (
    <img
      src="/logo.svg"
      width={size}
      height={size}
      alt=""
      className={className}
      style={{ objectFit: "contain" }}
      draggable={false}
    />
  );
}
