import type { ComponentProps, ReactNode } from "react";
import type { Dialog as DialogPrimitive } from "radix-ui";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ContentInteractions = Pick<
  ComponentProps<typeof DialogPrimitive.Content>,
  "onInteractOutside" | "onEscapeKeyDown" | "onOpenAutoFocus" | "onCloseAutoFocus"
>;

export type GlassDialogSize = "sm" | "md" | "lg";

interface GlassDialogProps extends ContentInteractions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  size?: GlassDialogSize;
  /** Render the built-in close button in the top-right corner. */
  showClose?: boolean;
}

const SIZE_CLASSES: Record<GlassDialogSize, string> = {
  sm: "sm:max-w-[380px]",
  md: "sm:max-w-[480px]",
  lg: "sm:max-w-[720px]",
};

/**
 * GlassDialog — the single modal primitive for admin surfaces. Wraps shadcn
 * Dialog with the project's glass-strong visual contract and consistent slot
 * composition (GlassDialogHeader / GlassDialogBody / GlassDialogFooter).
 *
 * Note: this renders its own DialogContent via the radix primitive so we can
 * suppress shadcn's default close button and emit our own footer-close button
 * when `showClose` is true. The shadcn DialogContent's `showCloseButton`
 * already gives us that toggle; we keep the raw primitive here so we can also
 * thread `onInteractOutside`/`onEscapeKeyDown` for scanner use.
 */
export function GlassDialog({
  open,
  onOpenChange,
  children,
  className,
  size = "md",
  showClose = true,
  onInteractOutside,
  onEscapeKeyDown,
  onOpenAutoFocus,
  onCloseAutoFocus,
}: GlassDialogProps) {
  // The shadcn <DialogContent> already gives us the portal + overlay + close
  // button. We pass showCloseButton to toggle the built-in close and spread
  // radix content interaction handlers via its rest props.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showClose}
        onInteractOutside={onInteractOutside}
        onEscapeKeyDown={onEscapeKeyDown}
        onOpenAutoFocus={onOpenAutoFocus}
        onCloseAutoFocus={onCloseAutoFocus}
        className={cn(
          "glass-strong border-none p-0 overflow-hidden flex flex-col",
          "!rounded-[var(--radius-card-strong,24px)]",
          "[&>button]:top-4 [&>button]:right-4 [&>button]:text-[color:var(--label-secondary)]",
          SIZE_CLASSES[size],
          className,
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

// Re-export the underlying primitives so callers can bypass the wrapper when
// necessary without reinventing the import surface.
export { DialogOverlay, DialogPortal, XIcon, Button };
