import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassDialogFooterProps {
  children: ReactNode;
  className?: string;
  align?: "start" | "end" | "between";
}

const ALIGN_CLASSES: Record<NonNullable<GlassDialogFooterProps["align"]>, string> =
  {
    start: "justify-start",
    end: "justify-end",
    between: "justify-between",
  };

/**
 * GlassDialogFooter — the sticky footer slot. Use for CTA buttons.
 */
export function GlassDialogFooter({
  children,
  className,
  align = "end",
}: GlassDialogFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-row items-center gap-2 px-6 py-4",
        "border-t border-[color:var(--separator)]",
        ALIGN_CLASSES[align],
        className,
      )}
    >
      {children}
    </div>
  );
}
