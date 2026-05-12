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
        "flex flex-row items-stretch gap-2 px-6 py-4 min-w-0",
        "[&>*]:flex-1 [&>*]:min-w-0",
        ALIGN_CLASSES[align],
        className,
      )}
    >
      {children}
    </div>
  );
}
