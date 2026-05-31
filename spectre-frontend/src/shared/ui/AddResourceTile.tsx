/**
 * AddResourceTile — a grid-slot CTA intended to sit inside a resource grid
 * as the "+ create" affordance alongside real cards. This is NOT an empty
 * state (see `EmptyState variant="full"` for that): the grid is non-empty
 * and this tile supplements existing cards with a shortcut to open the
 * create dialog. Kept separate from EmptyState deliberately.
 */
import { Plus } from "lucide-react";

interface AddResourceTileProps {
  title: string;
  hint?: string;
  onClick: () => void;
  ariaLabel?: string;
}

export function AddResourceTile({ title, hint = "Click to create", onClick, ariaLabel }: AddResourceTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass hover-glow rounded-[var(--radius-card)] p-5 flex flex-col items-center justify-center gap-3 min-h-[132px] border-dashed !border-[rgba(255,255,255,0.14)] text-center group"
      aria-label={ariaLabel ?? title}
    >
      <div className="w-10 h-10 rounded-[12px] bg-[color:var(--fill-tertiary)] border border-[color:var(--poc-border)] flex items-center justify-center transition-transform group-hover:scale-105">
        <Plus size={18} className="text-[color:var(--label-primary)]" />
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="face-title text-[13px]">{title}</p>
        <p className="kbd-mono">{hint}</p>
      </div>
    </button>
  );
}
