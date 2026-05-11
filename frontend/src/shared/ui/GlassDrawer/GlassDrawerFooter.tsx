import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassDrawerFooterProps {
  children: ReactNode;
  className?: string;
  align?: "start" | "end" | "between";
}

const ALIGN_CLASSES: Record<NonNullable<GlassDrawerFooterProps["align"]>, string> =
  {
    start: "justify-start",
    end: "justify-end",
    between: "justify-between",
  };

/**
 * GlassDrawerFooter — sticky footer slot mirroring GlassDialogFooter.
 */
export function GlassDrawerFooter({
  children,
  className,
  align = "end",
}: GlassDrawerFooterProps) {
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
