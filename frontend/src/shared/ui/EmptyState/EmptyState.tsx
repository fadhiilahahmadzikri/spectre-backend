import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export type EmptyStateVariant = "compact" | "inline" | "full";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  variant?: EmptyStateVariant;
  /** @deprecated use `variant="compact"` instead. Retained for call sites. */
  compact?: boolean;
  className?: string;
}

/**
 * EmptyState — the single primitive for empty states across the app.
 *
 * - compact: small icon, tight padding. For inline "No results" rows.
 * - inline: compact without top padding. For embedding in surfaces.
 * - full: large framed glass card with a prominent CTA. For page-level
 *   zero-state screens (`<EmptyState variant="full" action={<Button />} />`).
 */
export function EmptyState({
  icon = <Inbox className="w-6 h-6" />,
  title = "No data",
  description,
  action,
  variant,
  compact,
  className,
}: EmptyStateProps) {
  const resolved: EmptyStateVariant =
    variant ?? (compact ? "compact" : "compact");

  if (resolved === "full") {
    return (
      <div
        className={cn(
          "glass-strong hover-glow rounded-[var(--radius-card-strong,24px)]",
          "px-6 py-14 flex flex-col items-center gap-4 text-center",
          className,
        )}
      >
        <div className="size-16 rounded-[20px] bg-[color:var(--fill-tertiary)] border border-[color:var(--poc-border)] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.4)]">
          <span className="text-[color:var(--label-primary)]">{icon}</span>
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="face-title text-[17px]">{title}</h2>
          {description && (
            <p className="face-helper text-[12.5px] max-w-[340px]">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
    );
  }

  // compact | inline share the small-icon card; only vertical padding differs.
  const paddingClass = resolved === "inline" ? "pb-8" : "py-8";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 text-center",
        paddingClass,
        className,
      )}
    >
      <div className="size-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[color:var(--label-tertiary)]">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="face-title text-[14px]">{title}</p>
        {description && (
          <p className="kbd-mono text-[11px] max-w-[280px]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
