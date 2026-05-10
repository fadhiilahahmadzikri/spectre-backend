import type { CSSProperties } from "react";
import type { AuraExpression } from "../../model/types";
import type { EyeState } from "./use-aura-physics";

interface EyesProps {
  expression: AuraExpression;
  eyeState: EyeState;
}

interface EyeShape {
  rotation: string;
  bg: string;
  bw: string;
  bc: string;
  br: string;
  translateY: string;
  scale: string;
  clipPath: string;
  w: string;
  h: string;
}

function resolveEyeShape(expression: AuraExpression, isLeft: boolean): EyeShape {
  const defaults: EyeShape = {
    rotation: "0deg",
    bg: "#fff",
    bw: "0px",
    bc: "transparent",
    br: "50px",
    translateY: "0%",
    scale: "scale(1)",
    clipPath: "none",
    w: "7.5%",
    h: "20%",
  };

  switch (expression) {
    case "senang":
      return {
        ...defaults,
        bg: "#fff",
        br: "0",
        clipPath:
          "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
        scale: "scale(1.1)",
        w: "16%",
        h: "16%",
        translateY: "-5%",
      };
    case "lengkungan":
      return {
        ...defaults,
        bg: "transparent",
        bw: "0 0 8px 0",
        bc: "#fff",
        br: "50%",
        translateY: "-15%",
        w: "10%",
        h: "10%",
        scale: "scale(1.2, 0.9)",
      };
    case "sedih":
      return {
        ...defaults,
        rotation: isLeft ? "20deg" : "-20deg",
        scale: "scale(0.8, 0.35)",
        translateY: "40%",
      };
    default:
      return defaults;
  }
}

const SIDES: Array<{ key: "left" | "right"; isLeft: boolean }> = [
  { key: "left", isLeft: true },
  { key: "right", isLeft: false },
];

export function Eyes({ expression, eyeState }: EyesProps) {
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
      rotateZ(-6deg)
    `,
    transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
    pointerEvents: "none",
  };

  const innerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12%",
    width: "100%",
    height: "100%",
    transform: `translate(calc(var(--ex) * 0.5), calc(var(--ey) * 0.3))`,
  };

  return (
    <div style={perspectiveStyle}>
      <div style={innerStyle}>
        {SIDES.map(({ key, isLeft }) => {
          const shape = resolveEyeShape(expression, isLeft);
          return (
            <div
              key={key}
              style={{
                width: shape.w,
                height: shape.h,
                transform: `rotate(${shape.rotation}) translateY(${shape.translateY}) ${shape.scale}`,
                transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                filter: "drop-shadow(0 0 6px rgba(255,255,255,0.8))",
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
                  animation: "eye-blink 4s infinite",
                  transformOrigin: "center 70%",
                  transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
