import { toast as sonnerToast } from "sonner";
import type { ReactNode } from "react";

interface NotifyOptions {
  description?: string;
  icon?: ReactNode;
  duration?: number;
  id?: string | number;
}

export const notify = {
  success(message: string, options?: NotifyOptions) {
    return sonnerToast.success(message, options);
  },
  error(message: string, options?: NotifyOptions) {
    return sonnerToast.error(message, options);
  },
  info(message: string, options?: NotifyOptions) {
    return sonnerToast.info(message, options);
  },
  warning(message: string, options?: NotifyOptions) {
    return sonnerToast.warning(message, options);
  },
  message(message: string, options?: NotifyOptions) {
    return sonnerToast(message, options);
  },
  dismiss(id?: string | number) {
    sonnerToast.dismiss(id);
  },
};
