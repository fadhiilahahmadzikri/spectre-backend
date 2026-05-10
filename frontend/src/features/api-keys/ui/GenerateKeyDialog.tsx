import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Copy, CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { notify } from "@/shared/lib/notify";
import { CreateResourceDialog } from "@/shared/ui/CreateResourceDialog";
import { useApiKeysUi } from "../model/api-keys-ui-store";

interface GenerateKeyDialogProps {
  appId: string;
}

export function GenerateKeyDialog({ appId }: GenerateKeyDialogProps) {
  const { generateOpen, closeGenerate, lastGeneratedKey, setLastKey } = useApiKeysUi();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const genMut = useMutation({
    mutationFn: () => api.generateKey(appId),
    onSuccess: (res) => {
      setLastKey(res.full_key);
      qc.invalidateQueries({ queryKey: ["keys", appId] });
      notify.success("New API key generated");
    },
    onError: (err) => notify.error((err as Error).message),
  });

  useEffect(() => {
    if (!generateOpen) {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      queueMicrotask(() => {
        setCopied(false);
        setLastKey(null);
      });
    }
  }, [generateOpen, setLastKey]);

  function handleCopy() {
    if (!lastGeneratedKey) return;
    navigator.clipboard.writeText(lastGeneratedKey);
    setCopied(true);
    notify.success("Copied to clipboard");
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <CreateResourceDialog
      open={generateOpen}
      onOpenChange={(open) => {
        if (!open) closeGenerate();
      }}
      icon={<KeyRound size={22} />}
      title={lastGeneratedKey ? "Key generated" : "Generate new key"}
      description={
        lastGeneratedKey
          ? "This key is shown only once. Copy it now and store it securely."
          : "A fresh API key will be created for this application."
      }
    >
      {lastGeneratedKey ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[rgba(255,159,10,0.35)] bg-[rgba(255,159,10,0.08)]">
            <AlertTriangle size={14} className="text-[color:var(--warn)] shrink-0" />
            <p className="text-[11px] text-[color:var(--warn)] font-mono">
              Copy now — this will not be shown again
            </p>
          </div>
          <code className="kbd-mono break-all bg-[color:var(--fill-tertiary)] px-3 py-3 rounded-[10px] border border-[color:var(--poc-border)] text-[color:var(--label-primary)] text-[12px] text-left">
            {lastGeneratedKey}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy key"}
          </button>
          <button type="button" onClick={closeGenerate} className="btn-ghost">
            Done
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => genMut.mutate()}
            disabled={genMut.isPending}
            className="btn-primary"
          >
            {genMut.isPending ? "Generating…" : "Generate key"}
          </button>
          <button type="button" onClick={closeGenerate} className="btn-ghost">
            Cancel
          </button>
        </>
      )}
    </CreateResourceDialog>
  );
}
