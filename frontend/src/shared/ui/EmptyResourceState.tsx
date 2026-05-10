import type { ReactNode } from "react";

interface EmptyResourceStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  actionIcon?: ReactNode;
}

export function EmptyResourceState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
}: EmptyResourceStateProps) {
  return (
    <div className="glass-strong hover-glow rounded-[24px] px-6 py-14 flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 rounded-[20px] bg-[color:var(--fill-tertiary)] border border-[color:var(--poc-border)] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.4)]">
        <span className="text-[color:var(--label-primary)]">{icon}</span>
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="face-title text-[17px]">{title}</h2>
        <p className="face-helper text-[12.5px] max-w-[340px]">{description}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="btn-primary is-inline px-6 inline-flex items-center gap-2"
      >
        {actionIcon}
        {actionLabel}
      </button>
    </div>
  );
}
