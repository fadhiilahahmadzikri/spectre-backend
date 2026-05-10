import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/store";
import { SCAN_CONFIG } from "@/shared/config/scan.config";
import { IdentityGate } from "./IdentityGate";
import { ScannerView } from "./ScannerView";
import { useScanSession } from "../model/scan-store";

interface ScannerModalProps {
  fallbackPath?: string;
  redirectUrl?: string | null;
}

function deriveExternalUserId(user: { id?: string; email?: string } | null): string {
  if (!user) return "anonymous";
  return user.id || user.email || "anonymous";
}

export function ScannerModal({ fallbackPath = "/", redirectUrl = null }: ScannerModalProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { apiKey, setSession, clear } = useScanSession();
  const [open, setOpen] = useState(true);
  const externalUserId = deriveExternalUserId(user);

  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      window.setTimeout(() => {
        navigate(fallbackPath, { replace: true });
      }, 180);
    }
  }

  function handleGateResolved({ apiKey: key }: { apiKey: string }) {
    setSession(key, externalUserId);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="
          scanner-dialog
          glass-strong border-none p-0 overflow-hidden
          w-screen h-[100dvh] max-w-none rounded-none
          sm:w-[440px] sm:h-[860px] sm:max-h-[94dvh] sm:!rounded-[32px]
          [&>button]:hidden
        "
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Spectre face scanner</DialogTitle>
        <DialogDescription className="sr-only">
          Paste your API key and scan your identity.
        </DialogDescription>
        <div className="h-full w-full relative overflow-hidden flex flex-col">
          {apiKey ? (
            <ScannerView
              apiKey={apiKey}
              externalUserId={externalUserId}
              onClose={() => handleOpenChange(false)}
              redirectUrl={redirectUrl ?? SCAN_CONFIG.redirectUrl}
            />
          ) : (
            <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
              <IdentityGate
                externalUserId={externalUserId}
                onResolved={handleGateResolved}
                onCancel={() => handleOpenChange(false)}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
