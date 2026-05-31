import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import {
  IOSAlertDialog,
  type IosAlertConfig,
  type IosAlertAction,
} from "@/features/face-scan/ui/dialogs/IOSAlertDialog";
import {
  IosAlertContext,
  type ConfirmOptions,
  type IosAlertContextValue,
} from "./ios-alert-context";
import { admin } from "@/shared/lib/copy";

interface IosAlertProviderProps {
  children: ReactNode;
}

export function IosAlertProvider({ children }: IosAlertProviderProps) {
  const [config, setConfig] = useState<IosAlertConfig | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const dismiss = useCallback(() => {
    setConfig(null);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  const present = useCallback((next: IosAlertConfig) => {
    setConfig(next);
  }, []);

  const confirm = useCallback(
    ({
      title,
      message,
      confirmLabel = admin.common.confirm,
      cancelLabel = admin.common.cancel,
      destructive = false,
    }: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
        const actions: IosAlertAction[] = [
          {
            label: cancelLabel,
            style: "cancel",
            onClick: () => {
              resolverRef.current = null;
              resolve(false);
            },
          },
          {
            label: confirmLabel,
            style: destructive ? "destructive" : "default",
            onClick: () => {
              resolverRef.current = null;
              resolve(true);
            },
          },
        ];
        setConfig({ title, message, actions });
      }),
    [],
  );

  const value = useMemo<IosAlertContextValue>(
    () => ({ present, confirm, dismiss }),
    [present, confirm, dismiss],
  );

  return (
    <IosAlertContext.Provider value={value}>
      {children}
      <IOSAlertDialog config={config} onClose={dismiss} />
    </IosAlertContext.Provider>
  );
}
