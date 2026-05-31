import type { CSSProperties } from "react";
import type { AuraExpression } from "../../model/types";
import type { EyeState } from "./use-aura-physics";

interface EyesProps {
  expression: AuraExpression;
  eyeState: EyeState;
  glitchActive?: boolean;
  layerColors?: [string, string];
}

interface EyeShape {
  rotation: string;
  bg: string;
  bw: string;
  bc: string;
  br: string;
  x: string;
  y: string;
  scale: string;
  clipPath: string;
  w: string;
  h: string;
  opacity: string;
  transition: string;
}

function resolveEyeShape(expression: AuraExpression, isLeft: boolean): EyeShape {
  const defaults: EyeShape = {
    rotation: "0deg",
    bg: "#fff",
    bw: "0px",
    bc: "transparent",
    br: "50px",
    x: isLeft ? "-10%" : "10%",
    y: "0%",
    scale: "scale(1)",
    clipPath: "none",
    w: "7.5%",
    h: "20%",
    opacity: "1",
    transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
  };

  switch (expression) {
    case "senang":
      return {
        ...defaults,
        br: "0",
        clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
        scale: "scale(1.1)",
        w: "16%",
        h: "16%",
        x: isLeft ? "-12%" : "12%",
        y: "-2%",
      };
    case "lengkungan":
      return {
        ...defaults,
        bg: "transparent",
        bw: "0 0 8px 0",
        bc: "#fff",
        br: "50%",
        y: "-6%",
        w: "10%",
        h: "10%",
        scale: "scale(1.2, 0.9)",
      };
    case "sedih":
      return {
        ...defaults,
        rotation: isLeft ? "-20deg" : "20deg",
        scale: "scale(0.8, 0.35)",
        y: "10%",
      };
    case "berhasil_anticipate":
    case "gagal_anticipate":
      return {
        ...defaults,
        x: "0%",
        y: "0%",
        rotation: isLeft ? "360deg" : "-360deg",
        scale: "scale(0.5)",
        w: "12%",
        h: "12%",
        br: "50%",
        transition: "all 0.6s cubic-bezier(0.5, 0, 0.2, 1)",
      };
    case "berhasil_static":
      if (isLeft) {
        return { ...defaults, scale: "scale(0)", x: "0%", opacity: "0", rotation: "360deg" };
      }
      return {
        ...defaults,
        br: "0",
        clipPath: "polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)",
        scale: "scale(1.5)",
        w: "22%",
        h: "22%",
        x: "0%",
        y: "0%",
        rotation: "720deg",
      };
    case "gagal_static":
      if (isLeft) {
        return { ...defaults, scale: "scale(0)", x: "0%", opacity: "0", rotation: "-360deg" };
      }
      return {
        ...defaults,
        br: "0",
        clipPath: "polygon(20% 0%, 0% 20%, 30% 50%, 0% 80%, 20% 100%, 50% 70%, 80% 100%, 100% 80%, 70% 50%, 100% 20%, 80% 0%, 50% 30%)",
        scale: "scale(1.4)",
        w: "22%",
        h: "22%",
        x: "0%",
        y: "0%",
        rotation: "-720deg",
      };
    default:
      return defaults;
  }
}

const SIDES: Array<{ key: "left" | "right"; isLeft: boolean }> = [
  { key: "left", isLeft: true },
  { key: "right", isLeft: false },
];

export function Eyes({ expression, eyeState, glitchActive = false, layerColors = ["#5e5ce6", "#ff2a5f"] }: EyesProps) {
  const isIndicatorStatic = expression.endsWith("_static") || expression.endsWith("_anticipate");
  const effZ = isIndicatorStatic ? 0 : -6;

  const perspectiveStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    zIndex: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transform: `
      perspective(350px)
      translate(${eyeState.x}%, ${eyeState.y}%)
      rotateX(${eyeState.pitch}deg)
      rotateY(${eyeState.yaw}deg)
      rotateZ(${effZ}deg)
    `,
    transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
    pointerEvents: "none",
  };

  const innerStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    transform: "translate(calc(var(--ex, 0px) * 0.5), calc(var(--ey, 0px) * 0.3))",
  };

  return (
    <div style={perspectiveStyle}>
      <div style={innerStyle}>
        {/* Main eye shapes */}
        {SIDES.map(({ key, isLeft }) => {
          const shape = resolveEyeShape(expression, isLeft);
          return (
            <div
              key={`main-${key}`}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: shape.w,
                height: shape.h,
                marginLeft: shape.x,
                marginTop: shape.y,
                opacity: shape.opacity,
                transform: `translate(-50%, -50%) rotate(${shape.rotation}) ${shape.scale}`,
                transition: shape.transition,
                filter: glitchActive ? "none" : "drop-shadow(0 0 6px rgba(255,255,255,0.8))",
                animation: glitchActive ? "cyber-glitch-main 0.1s infinite" : "none",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: shape.bg,
                  borderRadius: shape.br,
                  borderWidth: shape.bw,
                  borderStyle: "solid",
                  borderColor: shape.bc,
                  clipPath: shape.clipPath,
                  transformOrigin: "center 70%",
                  transition: shape.transition,
                  animation: !isIndicatorStatic && !glitchActive ? "eye-blink 4s infinite" : "none",
                }}
              />
            </div>
          );
        })}

        {/* Glitch layer 1 (pink) */}
        {glitchActive &&
          SIDES.map(({ key, isLeft }) => {
            const shape = resolveEyeShape(expression, isLeft);
            return (
              <div
                key={`g1-${key}`}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: shape.w,
                  height: shape.h,
                  marginLeft: shape.x,
                  marginTop: shape.y,
                  opacity: shape.opacity,
                  transform: `translate(-50%, -50%) rotate(${shape.rotation}) ${shape.scale}`,
                  mixBlendMode: "normal",
                  animation: "cyber-glitch-1 0.15s infinite linear alternate-reverse",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: layerColors[1],
                    borderRadius: shape.br,
                    borderWidth: shape.bw,
                    borderStyle: "solid",
                    borderColor: shape.bc,
                    clipPath: shape.clipPath,
                    transformOrigin: "center 70%",
                  }}
                />
              </div>
            );
          })}

        {/* Glitch layer 2 (indigo) */}
        {glitchActive &&
          SIDES.map(({ key, isLeft }) => {
            const shape = resolveEyeShape(expression, isLeft);
            return (
              <div
                key={`g2-${key}`}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: shape.w,
                  height: shape.h,
                  marginLeft: shape.x,
                  marginTop: shape.y,
                  opacity: shape.opacity,
                  transform: `translate(-50%, -50%) rotate(${shape.rotation}) ${shape.scale}`,
                  mixBlendMode: "normal",
                  animation: "cyber-glitch-2 0.2s infinite linear alternate",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: layerColors[0],
                    borderRadius: shape.br,
                    borderWidth: shape.bw,
                    borderStyle: "solid",
                    borderColor: shape.bc,
                    clipPath: shape.clipPath,
                    transformOrigin: "center 70%",
                  }}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
}
