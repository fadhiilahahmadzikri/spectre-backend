import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      offset={64}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "ios-toast",
          title: "ios-toast-title",
          description: "ios-toast-desc",
          actionButton: "ios-toast-action",
          cancelButton: "ios-toast-cancel",
          closeButton: "ios-toast-close",
          success: "ios-toast-success",
          error: "ios-toast-error",
          warning: "ios-toast-warning",
          info: "ios-toast-info",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
