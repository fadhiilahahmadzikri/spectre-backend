import type { CSSProperties } from "react";
import type { EyeState } from "./use-aura-physics";

interface SphereBodyProps {
  size: number;
  baseRadiusScale: number;
  auraColor1Triplet: string;
  auraColor2Triplet: string;
  eyeState: EyeState;
}

export function SphereBody({
  size,
  baseRadiusScale,
  auraColor1Triplet,
  auraColor2Triplet,
  eyeState,
}: SphereBodyProps) {
  const diameter = size * baseRadiusScale * 2;

  const style: CSSProperties = {
    position: "absolute",
    width: diameter,
    height: diameter,
    borderRadius: "50%",
    backgroundColor: "rgba(12, 10, 20, 0.7)",
    boxShadow: `
      inset ${-15 + eyeState.x * 1.8}px ${-15 + eyeState.y * 1.8}px 40px rgba(0, 0, 0, 0.95),
      inset ${-25 + eyeState.x * 2.2}px ${-25 + eyeState.y * 2.2}px 25px rgba(0, 0, 0, 0.8),
      inset ${15 - eyeState.x * 1.5}px ${15 - eyeState.y * 1.5}px 35px rgba(${auraColor2Triplet}, 0.4),
      inset 0 0 55px rgba(${auraColor1Triplet}, 0.5),
      0 0 30px rgba(${auraColor1Triplet}, 0.3)
    `,
    backdropFilter: "blur(8px)",
    transition: "box-shadow 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
    zIndex: 5,
  };

  const highlightStyle: CSSProperties = {
    position: "absolute",
    top: "12%",
    left: "18%",
    width: "45%",
    height: "28%",
    background:
      "radial-gradient(ellipse at center, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 65%)",
    borderRadius: "50%",
    transform: `rotate(-40deg) translate(${eyeState.x * 0.2}px, ${eyeState.y * 0.2}px)`,
    transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
    pointerEvents: "none",
  };

  return (
    <div style={style}>
      <div style={highlightStyle} />
    </div>
  );
}
