import type { ReactNode } from "react";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Layout presets for the canonical dialog header.
 *
 *   - "inline":   (default) icon on the LEFT, title + description stacked to
 *                 its right. The classic apple-sheet banner with a status
 *                 glyph beside the primary label. This is the house style for
 *                 Spectre admin dialogs — compact and consistent across
 *                 surfaces.
 *   - "centered": icon on top, title + description centered beneath. Reserved
 *                 for hero-style modals where the dialog is a distinct,
 *                 attention-grabbing moment (e.g. onboarding, large
 *                 confirmation surfaces).
 *   - "plain":    no icon, title + description only, left-aligned. For small
 *                 modals where an icon would add more noise than clarity.
 */
export type GlassDialogHeaderVariant = "inline" | "centered" | "plain";

interface GlassDialogHeaderProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** See {@link GlassDialogHeaderVariant}. Defaults to "inline". */
  variant?: GlassDialogHeaderVariant;
  /**
   * @deprecated Use `variant` instead. Preserved so older callers keep
   * working:
   *   - `align="center"` → `variant="centered"`
   *   - `align="left"`   → `variant="inline"`
   */
  align?: "left" | "center";
  /**
   * Optional trailing slot for inline / plain variants — e.g. a status pill
   * or secondary button. Ignored for the centered variant.
   */
  trailing?: ReactNode;
  className?: string;
}

/**
 * GlassDialogHeader — the canonical header slot. Always renders shadcn
 * DialogTitle + DialogDescription so accessibility wiring is enforced.
 *
 * Examples:
 *
 *   <GlassDialogHeader
 *     icon={<KeyRound size={22} />}
 *     title="Key generated"
 *     description="This key is shown only once."
 *     variant="inline"
 *   />
 *
 *   <GlassDialogHeader
 *     icon={<AppWindow size={22} />}
 *     title="New application"
 *     description="Give your app a memorable name."
 *     // variant defaults to "centered"
 *   />
 */
export function GlassDialogHeader({
  icon,
  title,
  description,
  variant,
  align,
  trailing,
  className,
}: GlassDialogHeaderProps) {
  // Resolve the final variant, honouring the legacy `align` prop so existing
  // call sites (`align="left"` / `align="center"`) remain visually identical.
  const resolvedVariant: GlassDialogHeaderVariant =
    variant ??
    (align === "center" ? "centered" : align === "left" ? "inline" : "inline");

  const isCentered = resolvedVariant === "centered";
  const hasIcon = !!icon && resolvedVariant !== "plain";

  return (
    <div
      className={cn(
        "flex gap-3 px-6 pt-7 pb-5",
        isCentered
          ? "flex-col items-center text-center"
          : "flex-row items-center",
        className,
      )}
    >
      {hasIcon && (
        <div
          className={cn(
            "shrink-0",
            // The large ring is centered above the text; the inline variant
            // uses a compact ring so it sits cleanly beside the title block
            // instead of towering over it.
            isCentered ? "gate-icon-ring" : "gate-icon-ring-sm",
          )}
        >
          <span className="text-[color:var(--label-primary)]">{icon}</span>
        </div>
      )}
      <div
        className={cn(
          "flex flex-col min-w-0",
          isCentered ? "gap-2" : "gap-0.5 flex-1",
        )}
      >
        <DialogTitle
          className={cn(
            "face-title",
            isCentered ? "text-[18px]" : "text-[17px]",
          )}
        >
          {title}
        </DialogTitle>
        {description && (
          <DialogDescription
            className={cn(
              "face-helper",
              isCentered ? "text-[12.5px] max-w-[320px]" : "text-[12px]",
            )}
          >
            {description}
          </DialogDescription>
        )}
      </div>
      {trailing && !isCentered && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}
