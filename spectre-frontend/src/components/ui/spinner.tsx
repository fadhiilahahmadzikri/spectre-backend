import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

function Spinner({ size = "md", label, className }: SpinnerProps) {
  const sizeMap = { sm: 16, md: 24, lg: 36 };
  const px = sizeMap[size];

  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        role="status"
        aria-label={label || "Loading"}
        className="animate-spin"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="opacity-[0.12]"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="opacity-80"
        />
      </svg>
      {label && <span className="kbd-mono text-[10px]">{label}</span>}
    </div>
  );
}

export { Spinner };
export type { SpinnerProps };
