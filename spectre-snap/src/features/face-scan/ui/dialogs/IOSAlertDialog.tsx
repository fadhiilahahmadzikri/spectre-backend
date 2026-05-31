import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface IosAlertAction {
  label: string;
  style?: "default" | "cancel" | "destructive";
  onClick: () => void;
}

export interface IosAlertConfig {
  title: string;
  message?: string;
  actions: IosAlertAction[];
}

interface IOSAlertDialogProps {
  config: IosAlertConfig | null;
  onClose: () => void;
}

export function IOSAlertDialog({ config, onClose }: IOSAlertDialogProps) {
  const open = !!config;
  if (!config) {
    return (
      <AlertDialog open={false} onOpenChange={(v) => !v && onClose()}>
        <AlertDialogContent className="hidden" />
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent
        className="glass-strong p-0 border-none w-[320px] sm:max-w-[320px] overflow-hidden !rounded-[var(--radius-card-strong,24px)]"
      >
        <div className="pt-7 pb-5 px-6 flex flex-col items-center gap-2">
          <AlertDialogTitle className="face-title text-[17px] text-center">
            {config.title}
          </AlertDialogTitle>
          {config.message && (
            <div className="face-helper text-[13px] text-center max-w-[260px]">
              {config.message}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 px-6 pb-6">
          {config.actions.map((action, i) => {
            const variant =
              action.style === "destructive"
                ? "primary-glass"
                : action.style === "cancel"
                  ? "ghost-glass"
                  : "primary-glass";
            return (
              <Button
                key={`${action.label}-${i}`}
                type="button"
                variant={variant}
                className={
                  action.style === "destructive"
                    ? "!bg-[rgba(255,69,58,0.15)] !text-[#FF453A] hover:!bg-[rgba(255,69,58,0.25)]"
                    : undefined
                }
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
              >
                {action.label}
              </Button>
            );
          })}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
