import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
        className="glass-strong p-0 border-none w-[320px] sm:max-w-[320px] overflow-hidden !rounded-[24px]"
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
          {config.actions.map((action, i) => (
            <button
              key={`${action.label}-${i}`}
              type="button"
              className={
                action.style === "destructive"
                  ? "btn-primary !bg-[rgba(255,69,58,0.15)] !text-[#FF453A] hover:!bg-[rgba(255,69,58,0.25)]"
                  : action.style === "cancel"
                    ? "btn-ghost"
                    : "btn-primary"
              }
              onClick={() => {
                action.onClick();
                onClose();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
