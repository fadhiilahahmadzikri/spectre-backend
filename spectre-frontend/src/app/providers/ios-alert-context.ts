import { createContext, useContext } from "react";
import type { IosAlertConfig } from "@/features/face-scan/ui/dialogs/IOSAlertDialog";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export interface IosAlertContextValue {
  present: (config: IosAlertConfig) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  dismiss: () => void;
}

export const IosAlertContext = createContext<IosAlertContextValue | null>(null);

export function useIosAlert(): IosAlertContextValue {
  const ctx = useContext(IosAlertContext);
  if (!ctx) throw new Error("useIosAlert must be used within an IosAlertProvider");
  return ctx;
}
