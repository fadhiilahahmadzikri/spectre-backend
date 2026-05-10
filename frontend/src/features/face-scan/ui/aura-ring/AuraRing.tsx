import { useEffect, useRef, useState, type CSSProperties } from "react";
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

export function AuraRing({ size = 450, config = DEFAULT_AURA_CONFIG }: AuraRingProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [internalExpr, setInternalExpr] = useState<AuraExpression>(config.expression);
  const [glitchActive, setGlitchActive] = useState(false);

  const { eyeState, updateFrame, bounceRef } = useAuraPhysics({
    expression: internalExpr,
    globalSpeed: config.globalSpeed,
  });

  const auraColor1Triplet = rgbTriplet(config.layers[0].hex);
  const auraColor2Triplet = rgbTriplet(config.layers[1].hex);

  // --- State machine for berhasil/gagal indicator cycling ---
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;
    let t4: ReturnType<typeof setTimeout>;
    let t5: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const runCycle = (type: "berhasil" | "gagal") => {
      if (cancelled) return;

      // 1. Anticipate phase (eyes collide to center)
      setInternalExpr(`${type}_anticipate`);

      t1 = setTimeout(() => {
        if (cancelled) return;
        // 2. Static indicator (checklist/cross clip-path)
        setInternalExpr(`${type}_static`);
        if (bounceRef.current) bounceRef.current.velocity = -0.7;

        t2 = setTimeout(() => {
          if (cancelled) return;
          // 3. Start glitch to mask the transition
          setGlitchActive(true);
          if (bounceRef.current) bounceRef.current.velocity = -0.15;

          t4 = setTimeout(() => {
            if (cancelled) return;
            // 4. Morph back to normal while glitch peaks
            setInternalExpr("normal");
            if (bounceRef.current) bounceRef.current.velocity = -0.45;

            t5 = setTimeout(() => {
              if (!cancelled) setGlitchActive(false);
            }, 350);

            // 5. Repeat cycle
            t3 = setTimeout(() => {
              if (!cancelled) runCycle(type);
            }, 5000);
          }, 150);
        }, 3000);
      }, 600);
    };

    if (config.expression === "berhasil" || config.expression === "gagal") {
      runCycle(config.expression);
    } else {
      setInternalExpr(config.expression);
      setGlitchActive(false);
    }

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [config.expression, bounceRef]);

  const isIndicatorStatic = internalExpr.endsWith("_static") || internalExpr.endsWith("_anticipate");
  const effX = isIndicatorStatic ? 0 : eyeState.x;
  const effY = isIndicatorStatic ? 0 : eyeState.y;

  const containerStyle: CSSProperties = {
    position: "relative",
    width: size,
    height: size,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transform: "translate(var(--ex, 0px), var(--ey, 0px)) scale(var(--esx, 1), var(--esy, 1))",
    transition: "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      <SphereBody
        size={size}
        baseRadiusScale={config.baseRadiusScale}
        auraColor1Triplet={auraColor1Triplet}
        auraColor2Triplet={auraColor2Triplet}
        eyeState={{ ...eyeState, x: effX, y: effY }}
      />
      <AuraCanvas
        size={size}
        layers={config.layers}
        baseRadiusScale={config.baseRadiusScale}
        timeSpeed={config.globalSpeed}
        onFrame={() => updateFrame(containerRef.current)}
      />
      <Eyes
        expression={internalExpr}
        eyeState={{ ...eyeState, x: effX, y: effY, pitch: isIndicatorStatic ? 0 : eyeState.pitch, yaw: isIndicatorStatic ? 0 : eyeState.yaw }}
        glitchActive={glitchActive}
        layerColors={[config.layers[0].hex, config.layers[1].hex]}
      />
    </div>
  );
}
