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

function actionColor(style: IosAlertAction["style"]): string {
  if (style === "destructive") return "text-[#FF453A]";
  return "text-[#0A84FF]";
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
        className="ios-alert-box p-0 border-none w-[270px] sm:max-w-[270px] overflow-hidden !rounded-[14px]"
      >
        <div className="pt-[18px] pb-4 px-4 flex flex-col items-center gap-1">
          <AlertDialogTitle className="text-[17px] font-semibold text-white text-center leading-tight tracking-[-0.022em]">
            {config.title}
          </AlertDialogTitle>
          {config.message && (
            <div className="text-[13px] text-[rgba(235,235,245,0.6)] text-center leading-[1.3] tracking-[-0.008em]">
              {config.message}
            </div>
          )}
        </div>
        <div className="flex border-t border-[rgba(84,84,88,0.65)] h-[44px]">
          {config.actions.map((action, i) => (
            <button
              key={`${action.label}-${i}`}
              type="button"
              className={`flex-1 flex items-center justify-center text-[17px] active:bg-[rgba(255,255,255,0.1)] transition-colors ${i > 0 ? "border-l border-[rgba(84,84,88,0.65)]" : ""} ${actionColor(action.style)} ${action.style === "cancel" ? "font-semibold" : "font-normal"}`}
              style={{ letterSpacing: "-0.022em" }}
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
