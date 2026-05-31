import type { CSSProperties } from "react";

interface AnimatedStatusIconProps {
  type?: "success" | "error";
  size?: number;
  color?: string;
  ringColor?: string;
  circleFill?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

export function AnimatedStatusIcon({
  type = "success",
  size = 82,
  color,
  ringColor,
  circleFill = "none",
  strokeWidth = 4.5,
  style,
}: AnimatedStatusIconProps) {
  const isSuccess = type === "success";
  const finalColor = color ?? (isSuccess ? "#34d399" : "#f87171");
  const finalRingColor =
    ringColor ?? (isSuccess ? "rgba(52,211,153,0.35)" : "rgba(248,113,113,0.35)");

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <circle
        cx="50"
        cy="50"
        r="44"
        fill={circleFill}
        stroke={finalRingColor}
        strokeWidth={circleFill === "none" ? 2.5 : 3}
        className="checkmark-ring"
      />
      {isSuccess ? (
        <path
          d="M30 52 L45 67 L72 36"
          fill="none"
          stroke={finalColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="checkmark-tick"
        />
      ) : (
        <>
          <path
            d="M34 34 L66 66"
            fill="none"
            stroke={finalColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="checkmark-tick"
          />
          <path
            d="M66 34 L34 66"
            fill="none"
            stroke={finalColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="checkmark-tick"
            style={{ animationDelay: "0.15s" }}
          />
        </>
      )}
    </svg>
  );
}
