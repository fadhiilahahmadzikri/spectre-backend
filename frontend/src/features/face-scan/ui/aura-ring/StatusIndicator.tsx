interface StatusIndicatorProps {
  type: "success" | "error";
  size?: number;
  strokeWidth?: number;
}

export function StatusIndicator({
  type,
  size = 82,
  strokeWidth = 4.5,
}: StatusIndicatorProps) {
  const isSuccess = type === "success";
  const color = isSuccess ? "#34d399" : "#f87171";
  const ringColor = isSuccess
    ? "rgba(52,211,153,0.35)"
    : "rgba(248,113,113,0.35)";
  const fill = isSuccess
    ? "rgba(52,211,153,0.15)"
    : "rgba(248,113,113,0.15)";

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r="44"
        fill={fill}
        stroke={ringColor}
        strokeWidth={3}
        className="status-ring"
      />
      {isSuccess ? (
        <path
          d="M30 52 L45 67 L72 36"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="status-tick"
        />
      ) : (
        <>
          <path
            d="M34 34 L66 66"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="status-tick"
          />
          <path
            d="M66 34 L34 66"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="status-tick"
            style={{ animationDelay: "0.15s" }}
          />
        </>
      )}
    </svg>
  );
}
