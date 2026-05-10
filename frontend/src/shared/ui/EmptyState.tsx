import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({
  icon = <Inbox className="w-6 h-6" />,
  title = "No data",
  description,
  action,
  compact,
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center gap-3 text-center ${compact ? "py-8" : "py-14"}`}>
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[color:var(--label-tertiary)]">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="face-title text-[14px]">{title}</p>
        {description && <p className="kbd-mono text-[11px] max-w-[280px]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
