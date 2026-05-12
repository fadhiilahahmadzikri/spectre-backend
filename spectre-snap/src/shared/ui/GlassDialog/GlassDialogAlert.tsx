import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tone presets for the inline dialog alert strip.
 *
 *   - "warning": amber — destructive-adjacent, "you will lose this" reminders
 *   - "info":    blue  — neutral context, usage hints
 *   - "error":   red   — blocking validation / failure state
 *   - "success": green — transient confirmation
 *
 * Every caller picks a tone by name; colours and the default glyph travel
 * together so every dialog reads the same alert consistently.
 */
export type GlassDialogAlertVariant = "warning" | "info" | "error" | "success";

interface GlassDialogAlertProps {
  /**
   * Drives mount/unmount through framer-motion's AnimatePresence.
   * `true`  → slides down + fades in
   * `false` → slides up + fades out, then unmounts (height collapses so the
   *            surrounding body reclaims the vertical space smoothly).
   *
   * This makes the alert a "plug-in" piece: dialogs decide whether they want
   * one, which tone, and when it should appear — the component handles the
   * motion contract.
   */
  show: boolean;
  /** See {@link GlassDialogAlertVariant}. Defaults to "info". */
  variant?: GlassDialogAlertVariant;
  /**
   * Override the default variant glyph. Pass `null` to suppress the icon
   * entirely; omit (or pass `undefined`) to use the variant default.
   */
  icon?: ReactNode | null;
  children: ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<
  GlassDialogAlertVariant,
  { ring: string; text: string; icon: ReactNode }
> = {
  warning: {
    ring: "border-[rgba(255,159,10,0.35)] bg-[rgba(255,159,10,0.08)]",
    text: "text-[color:var(--warn)]",
    icon: <AlertTriangle size={14} />,
  },
  info: {
    ring: "border-[rgba(10,132,255,0.35)] bg-[rgba(10,132,255,0.08)]",
    text: "text-[color:#0a84ff]",
    icon: <Info size={14} />,
  },
  error: {
    ring: "border-[rgba(255,69,58,0.35)] bg-[rgba(255,69,58,0.08)]",
    text: "text-[color:var(--danger)]",
    icon: <XCircle size={14} />,
  },
  success: {
    ring: "border-[rgba(52,199,89,0.35)] bg-[rgba(52,199,89,0.08)]",
    text: "text-[color:var(--sys-green)]",
    icon: <CheckCircle2 size={14} />,
  },
};

/**
 * GlassDialogAlert — the canonical inline alert strip for dialog bodies.
 *
 * Slide animation rationale: the alert may appear or disappear mid-flow
 * (e.g. after the user acknowledges a reveal-once key). Animating height +
 * y + opacity prevents the rest of the body from snapping when the alert
 * enters/leaves, which reads much more polished than a hard mount/unmount.
 *
 *   <GlassDialogAlert variant="warning" show={isRevealed && !acknowledged}>
 *     Copy now — this will not be shown again
 *   </GlassDialogAlert>
 */
export function GlassDialogAlert({
  show,
  variant = "info",
  icon,
  children,
  className,
}: GlassDialogAlertProps) {
  const preset = VARIANT_STYLES[variant];
  // `icon === undefined` → use variant default; `icon === null` → hide; any
  // other ReactNode → render as given.
  const resolvedIcon = icon === undefined ? preset.icon : icon;

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key={`glass-dialog-alert-${variant}`}
          // Slide-UP motion: the alert enters from just below its final
          // position and lands (y: +8 → 0), then exits further UP out of
          // view (y: 0 → -8). Animating height between 0 and "auto" keeps
          // the surrounding body flowing smoothly — no layout snap when
          // the alert mounts / unmounts.
          initial={{ opacity: 0, y: 8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div
            role={variant === "error" ? "alert" : "status"}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-[var(--radius-chip)] border",
              preset.ring,
              className,
            )}
          >
            {resolvedIcon && (
              <span className={cn("shrink-0", preset.text)}>
                {resolvedIcon}
              </span>
            )}
            <p
              className={cn(
                "text-[11px] font-mono flex-1 min-w-0",
                preset.text,
              )}
            >
              {children}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
