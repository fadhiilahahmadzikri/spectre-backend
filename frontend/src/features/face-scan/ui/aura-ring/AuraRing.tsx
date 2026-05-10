import { useRef, type CSSProperties } from "react";
import { DEFAULT_AURA_CONFIG } from "../../model/constants";
import type { AuraConfig, AuraExpression } from "../../model/types";
import { rgbTriplet } from "../../lib/hex-utils";
import { SphereBody } from "./SphereBody";
import { AuraCanvas } from "./AuraCanvas";
import { Eyes } from "./Eyes";
import { useAuraPhysics } from "./use-aura-physics";

interface AuraRingProps {
  size?: number;
  config?: AuraConfig;
}

function resolveExpression(expr: AuraExpression | "berhasil" | "gagal"): AuraExpression {
  if (expr === "berhasil") return "senang";
  if (expr === "gagal") return "sedih";
  return expr;
}

export function AuraRing({ size = 450, config = DEFAULT_AURA_CONFIG }: AuraRingProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const expression = resolveExpression(config.expression);
  const { eyeState, updateFrame } = useAuraPhysics({
    expression,
    globalSpeed: config.globalSpeed,
  });

  const auraColor1Triplet = rgbTriplet(config.layers[0].hex);
  const auraColor2Triplet = rgbTriplet(config.layers[1].hex);

  const containerStyle: CSSProperties = {
    position: "relative",
    width: size,
    height: size,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transform: "translate(var(--ex, 0px), var(--ey, 0px)) scale(var(--esx, 1), var(--esy, 1))",
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      <SphereBody
        size={size}
        baseRadiusScale={config.baseRadiusScale}
        auraColor1Triplet={auraColor1Triplet}
        auraColor2Triplet={auraColor2Triplet}
        eyeState={eyeState}
      />
      <AuraCanvas
        size={size}
        layers={config.layers}
        baseRadiusScale={config.baseRadiusScale}
        timeSpeed={config.globalSpeed}
        onFrame={() => updateFrame(containerRef.current)}
      />
      <Eyes expression={expression} eyeState={eyeState} />
    </div>
  );
}
