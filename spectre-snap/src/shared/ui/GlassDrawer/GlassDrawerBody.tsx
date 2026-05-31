import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassDrawerBodyProps {
  children: ReactNode;
  className?: string;
}

/**
 * GlassDrawerBody — scrollable body slot for a drawer. Mirrors
 * GlassDialogBody so every overlay uses the same slot vocabulary.
 */
export function GlassDrawerBody({ children, className }: GlassDrawerBodyProps) {
  return (
    <div
      className={cn(
        "flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-6 pb-10",
        className,
      )}
    >
      {children}
    </div>
  );
}
