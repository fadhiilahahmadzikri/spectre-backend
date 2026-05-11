import type { ReactNode } from "react";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface GlassDialogHeaderProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

/**
 * GlassDialogHeader — the canonical header slot. Always renders shadcn
 * DialogTitle + DialogDescription so accessibility wiring is enforced.
 *
 *   <GlassDialogHeader icon={<Foo />} title="..." description="..." />
 */
export function GlassDialogHeader({
  icon,
  title,
  description,
  align = "center",
  className,
}: GlassDialogHeaderProps) {
  const isCentered = align === "center";
  return (
    <div
      className={cn(
        "flex gap-3 px-6 pt-7 pb-5 border-b border-[color:var(--separator)]",
        isCentered
          ? "flex-col items-center text-center"
          : "flex-row items-center",
        className,
      )}
    >
      {icon && (
        <div className="gate-icon-ring shrink-0">
          <span className="text-[color:var(--label-primary)]">{icon}</span>
        </div>
      )}
      <div className={cn("flex flex-col", isCentered ? "gap-2" : "gap-0.5")}>
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
    </div>
  );
}
