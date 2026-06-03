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
import { IdentityGate, type IdentityGateResolved } from "./IdentityGate";
import { ScannerView } from "./ScannerView";
import { useScanSession } from "../model/scan-store";
import { maskKey, scanDebug } from "../lib/scan-debug";

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
  const apiKey = useScanSession((s) => s.apiKey);
  const resolvedMode = useScanSession((s) => s.resolvedMode);
  const resolveSession = useScanSession((s) => s.resolveSession);
  const clear = useScanSession((s) => s.clear);
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

  function handleGateResolved({ apiKey: key, mode }: IdentityGateResolved) {
    scanDebug("ScannerModal.handleGateResolved", {
      apiKey: maskKey(key),
      externalUserId,
      mode,
    });
    resolveSession({ apiKey: key, externalUserId, mode });
  }

  // The gate and the scanner are two distinct pages of this modal. The scanner
  // only mounts when the store reports a fully resolved identity — both the
  // API key and the mode it should boot in. This is the contract that kills
  // the mode flicker: the orchestrator never has to discover mode, because by
  // the time it mounts the answer has already been committed.
  const ready = apiKey !== null && resolvedMode !== null;

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
          {ready ? (
            <ScannerView
              apiKey={apiKey}
              externalUserId={externalUserId}
              initialMode={resolvedMode}
              onClose={() => handleOpenChange(false)}
              redirectUrl={redirectUrl ?? SCAN_CONFIG.redirectUrl}
              redirectDelaySeconds={SCAN_CONFIG.redirectDelay}
              persistConfig
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
