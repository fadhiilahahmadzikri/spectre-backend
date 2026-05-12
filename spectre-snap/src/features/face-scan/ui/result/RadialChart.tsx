interface RadialChartProps {
  value: number;
  label: string;
  color: string;
  size?: number;
}

const STROKE_WIDTH = 9;

export function RadialChart({ value, label, color, size = 90 }: RadialChartProps) {
  const pct = Math.max(0, Math.min(1, value));
  const radius = size / 2 - STROKE_WIDTH / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1 p-3 bg-white/[0.03] rounded-2xl border border-white/[0.05]">
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </svg>
        <span className="absolute text-[13px] font-semibold font-mono text-white">
          {(pct * 100).toFixed(1)}%
        </span>
      </div>
      <span className="text-[11px] text-white/70 font-mono text-center tracking-tight leading-tight w-full truncate px-1 mt-1">
        {label}
      </span>
    </div>
  );
}
