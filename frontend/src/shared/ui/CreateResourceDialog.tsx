import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}

export function CreateResourceDialog({
  open,
  onOpenChange,
  icon,
  title,
  description,
  children,
}: CreateResourceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          glass-strong border-none p-0 overflow-hidden
          !rounded-[24px] sm:max-w-[420px]
          [&>button]:top-4 [&>button]:right-4 [&>button]:text-[color:var(--label-secondary)]
        "
      >
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-2 gap-3">
          <div className="gate-icon-ring">
            <span className="text-[color:var(--label-primary)]">{icon}</span>
          </div>
          <DialogTitle className="face-title text-[18px]">{title}</DialogTitle>
          <DialogDescription className="face-helper text-[12.5px] max-w-[320px]">
            {description}
          </DialogDescription>
        </div>

        <div className="flex flex-col gap-3 px-6 pt-4 pb-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
