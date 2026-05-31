import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassDialogBodyProps {
  children: ReactNode;
  className?: string;
}

/**
 * GlassDialogBody — the scrollable content slot. Consistent padding tokens
 * (`px-6 py-5`). Overflow scroll handled here so the header/footer stay
 * sticky.
 */
export function GlassDialogBody({ children, className }: GlassDialogBodyProps) {
  return (
    <div
      className={cn(
        "flex-1 min-h-0 flex flex-col gap-4 px-6 py-5 overflow-y-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}
