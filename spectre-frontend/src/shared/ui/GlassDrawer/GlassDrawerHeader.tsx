import type { ReactNode } from "react";
import { CloseIcon } from "@/shared/icons";

interface GlassDrawerHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export function GlassDrawerHeader({
  icon,
  title,
  subtitle,
  onClose,
}: GlassDrawerHeaderProps) {
  return (
    <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-[color:var(--separator)]">
      <div className="flex items-center gap-2.5">
        {icon && (
          <div style={{ color: "rgba(235,235,245,0.75)" }}>{icon}</div>
        )}
        <div>
          <div className="face-title text-[15px]">{title}</div>
          {subtitle && (
            <div className="kbd-mono text-[10px] mt-[1px]">{subtitle}</div>
          )}
        </div>
      </div>
      <button
        type="button"
        className="icon-btn"
        aria-label="Close"
        onClick={onClose}
      >
        <CloseIcon />
      </button>
    </div>
  );
}
