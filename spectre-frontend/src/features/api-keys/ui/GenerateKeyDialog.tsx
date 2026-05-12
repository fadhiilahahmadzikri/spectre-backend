import { useEffect, useRef, useState } from "react";
import { KeyRound, Copy, CheckCircle2 } from "lucide-react";
import { notify } from "@/shared/lib/notify";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  GlassDialog,
  GlassDialogHeader,
  GlassDialogBody,
  GlassDialogFooter,
  GlassDialogAlert,
} from "@/shared/ui/GlassDialog";
import { useApiKeysUi } from "../model/api-keys-ui-store";
import { useGenerateApiKey } from "../model/use-api-keys";
import { useCopyToClipboard } from "@/shared/hooks/use-copy-to-clipboard";

interface GenerateKeyDialogProps {
  appId: string;
}

/**
 * Generate & reveal API key modal.
 *
 * Lifecycle states:
 *   1. Pre-generate — user can Cancel or click "Generate key"
 *   2. Generating — ALL dismissal blocked (Cancel disabled, backdrop/Esc/X
 *      suppressed) because the mutation is in flight and closing mid-flight
 *      would orphan the generated key (shown only once, never again).
 *   3. Revealed — user MUST either copy or explicitly acknowledge storage
 *      before the modal can close. Irretrievable: the backend only stores
 *      hash(key), so a user who dismisses without saving loses the key
 *      permanently. Blocking dismissal is the only safe UX.
 *
 * Visual contract:
 *   - Both states use the default inline GlassDialogHeader (icon on the
 *     left, title + description stacked to its right). The inline layout
 *     is the house style, so we don't override the default.
 *   - The "Copy now — this will not be shown again" notice is a pluggable
 *     GlassDialogAlert, which slides up into view when the key is revealed
 *     and slides further up on exit once the user acknowledges.
 *   - The key itself renders on a single line with a dashed, low-contrast
 *     frame — intentionally understated so it reads as a copyable token,
 *     not a primary label. The dialog is sized wide enough (size="md")
 *     that the full 52-char spk_ key fits without a horizontal scrollbar.
 */
export function GenerateKeyDialog({ appId }: GenerateKeyDialogProps) {
  const { generateOpen, closeGenerate, lastGeneratedKey, setLastKey } =
    useApiKeysUi();
  const { copied, copy } = useCopyToClipboard();
  const [acknowledged, setAcknowledged] = useState(false);

  const genMut = useGenerateApiKey(appId);

  // Clear the revealed key and acknowledgement the moment the modal closes,
  // so a subsequent open starts fresh at the "generate" view instead of
  // re-displaying a stale full_key.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (!generateOpen && wasOpen.current) {
      setLastKey(null);
      setAcknowledged(false);
    }
    wasOpen.current = generateOpen;
  }, [generateOpen, setLastKey]);

  // Copying once satisfies acknowledgement. Users can also confirm manually
  // via the "I saved this key" button below when they've stored it in a
  // password manager rather than the clipboard.
  async function handleCopy() {
    if (!lastGeneratedKey) return;
    const ok = await copy(lastGeneratedKey);
    if (ok) {
      notify.success("Copied to clipboard");
      setAcknowledged(true);
    }
  }

  function handleGenerate() {
    genMut.mutate();
  }

  const isPending = genMut.isPending;
  const isRevealed = !!lastGeneratedKey;

  // Dismissal guards:
  //   - While generating: nothing can close the modal
  //   - While revealed but not acknowledged: backdrop/Esc/X all blocked
  //   - Otherwise: normal close behaviour
  const blockDismiss = isPending || (isRevealed && !acknowledged);

  return (
    <GlassDialog
      open={generateOpen}
      onOpenChange={(open) => {
        if (!open && blockDismiss) return;
        if (!open) closeGenerate();
      }}
      onInteractOutside={(e) => {
        if (blockDismiss) e.preventDefault();
      }}
      onEscapeKeyDown={(e) => {
        if (blockDismiss) e.preventDefault();
      }}
      showClose={!blockDismiss}
      size="md"
    >
      <GlassDialogHeader
        icon={<KeyRound size={22} />}
        title={isRevealed ? "Key generated" : "Generate new key"}
        description={
          isRevealed
            ? "This key is shown only once. Copy it now and store it securely."
            : "A fresh API key will be created for this application."
        }
        // No `variant` override — the GlassDialogHeader default is "inline",
        // so both the pre-generate and revealed states automatically render
        // with the icon-left / stacked-text banner layout.
      />

      {isRevealed ? (
        <>
          <GlassDialogBody>
            {/*
              Pluggable alert: slides UP into view when the key is revealed,
              and slides further up out of view once the user acknowledges.
              The variant carries its own colour + glyph so the callsite
              just picks a tone by name.
            */}
            <GlassDialogAlert
              variant="warning"
              show={isRevealed && !acknowledged}
            >
              Copy now — this will not be shown again
            </GlassDialogAlert>

            {/*
              Single-line key with a low-contrast, dashed "tech" frame.
              `whitespace-nowrap` keeps the token on one row; `overflow-hidden`
              guarantees we NEVER fall back to a horizontal scrollbar — the
              dialog is sized (size="md") so the full 52-char spk_ key fits
              comfortably. The dashed border + --label-secondary text tones
              the chip down so it reads as a copyable token, not the hero
              label of the dialog.
            */}
            <code
              className={
                "kbd-mono bg-[color:var(--fill-tertiary)] " +
                "px-3 py-3 rounded-[var(--radius-chip)] " +
                "border border-dashed border-[color:var(--poc-border-strong)] " +
                "text-[color:var(--label-secondary)] text-[12px] text-left " +
                "whitespace-nowrap overflow-hidden"
              }
            >
              {lastGeneratedKey}
            </code>
            {!acknowledged && (
              <p className="face-helper text-[11px]">
                Tap copy, or confirm you have saved this key elsewhere, before
                closing.
              </p>
            )}
          </GlassDialogBody>
          <GlassDialogFooter>
            {acknowledged ? (
              <Button
                type="button"
                variant="ghost-glass"
                size="inline"
                onClick={closeGenerate}
              >
                Done
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost-glass"
                size="inline"
                onClick={() => setAcknowledged(true)}
              >
                I saved this key
              </Button>
            )}
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
          <Button
            type="button"
            variant="ghost-glass"
            onClick={closeGenerate}
            disabled={isPending}
          >
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
