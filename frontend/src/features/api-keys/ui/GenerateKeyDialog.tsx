import { useEffect, useRef } from "react";
import { KeyRound, Copy, CheckCircle2, AlertTriangle } from "lucide-react";
import { notify } from "@/shared/lib/notify";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  GlassDialog,
  GlassDialogHeader,
  GlassDialogBody,
  GlassDialogFooter,
} from "@/shared/ui/GlassDialog";
import { useApiKeysUi } from "../model/api-keys-ui-store";
import { useGenerateApiKey } from "../model/use-api-keys";
import { useCopyToClipboard } from "@/shared/hooks/use-copy-to-clipboard";

interface GenerateKeyDialogProps {
  appId: string;
}

export function GenerateKeyDialog({ appId }: GenerateKeyDialogProps) {
  const { generateOpen, closeGenerate, lastGeneratedKey, setLastKey } =
    useApiKeysUi();
  const { copied, copy } = useCopyToClipboard();

  const genMut = useGenerateApiKey(appId);

  // Single-use side-effect for the key-generated dialog: clear the stored
  // full_key on close so a later open shows the "generate" view, not the
  // reveal view.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (!generateOpen && wasOpen.current) {
      setLastKey(null);
    }
    wasOpen.current = generateOpen;
  }, [generateOpen, setLastKey]);

  async function handleCopy() {
    if (!lastGeneratedKey) return;
    const ok = await copy(lastGeneratedKey);
    if (ok) notify.success("Copied to clipboard");
  }

  function handleGenerate() {
    genMut.mutate();
  }

  const isPending = genMut.isPending;

  return (
    <GlassDialog
      open={generateOpen}
      onOpenChange={(open) => {
        if (!open) closeGenerate();
      }}
      size="sm"
    >
      <GlassDialogHeader
        icon={<KeyRound size={22} />}
        title={lastGeneratedKey ? "Key generated" : "Generate new key"}
        description={
          lastGeneratedKey
            ? "This key is shown only once. Copy it now and store it securely."
            : "A fresh API key will be created for this application."
        }
      />

      {lastGeneratedKey ? (
        <>
          <GlassDialogBody>
            <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-chip)] border border-[rgba(255,159,10,0.35)] bg-[rgba(255,159,10,0.08)]">
              <AlertTriangle
                size={14}
                className="text-[color:var(--warn)] shrink-0"
              />
              <p className="text-[11px] text-[color:var(--warn)] font-mono">
                Copy now — this will not be shown again
              </p>
            </div>
            <code className="kbd-mono break-all bg-[color:var(--fill-tertiary)] px-3 py-3 rounded-[var(--radius-chip)] border border-[color:var(--poc-border)] text-[color:var(--label-primary)] text-[12px] text-left">
              {lastGeneratedKey}
            </code>
          </GlassDialogBody>
          <GlassDialogFooter>
            <Button
              type="button"
              variant="ghost-glass"
              size="inline"
              onClick={closeGenerate}
            >
              Done
            </Button>
            <Button
              type="button"
              variant="primary-glass"
              size="inline"
              onClick={handleCopy}
            >
              {copied ? (
                <CheckCircle2 data-icon="inline-start" />
              ) : (
                <Copy data-icon="inline-start" />
              )}
              {copied ? "Copied" : "Copy key"}
            </Button>
          </GlassDialogFooter>
        </>
      ) : (
        <GlassDialogFooter>
          <Button type="button" variant="ghost-glass" onClick={closeGenerate}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary-glass"
            onClick={handleGenerate}
            disabled={isPending}
          >
            {isPending && <Spinner size="sm" data-icon="inline-start" />}
            {isPending ? "Generating…" : "Generate key"}
          </Button>
        </GlassDialogFooter>
      )}
    </GlassDialog>
  );
}
