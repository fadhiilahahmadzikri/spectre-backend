import { useEffect, useRef, useState } from "react";
import { AppWindow, Copy, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  GlassDialog,
  GlassDialogHeader,
  GlassDialogBody,
  GlassDialogFooter,
} from "@/shared/ui/GlassDialog";
import { useAppsUi } from "../model/apps-ui-store";
import { useCreateApplication } from "../model/use-applications";

/**
 * CreateApplicationDialog — consumes the Realistic `useCreateApplication`
 * hook. The list shows the new application with a pending indicator until the
 * server reconciles, while one-time webhook secrets stay visible until closed.
 *
 * The parent renders this component with a `key` tied to the store's
 * `createOpenCount`, so a fresh instance mounts on every open — killing the
 * stale-state anti-pattern (AP-05).
 */
export function CreateApplicationDialog() {
  const { createOpen, closeCreate } = useAppsUi();
  const [name, setName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const createMut = useCreateApplication();

  useEffect(() => {
    if (!createOpen) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(id);
  }, [createOpen]);

  const normalizedWebhookUrl = normalizeWebhookUrl(webhookUrl);
  const webhookUrlValid = isWebhookUrlValid(normalizedWebhookUrl);
  const canSubmit =
    name.trim().length > 0 && webhookUrlValid && !createMut.isPending;

  function resetDialog() {
    setName("");
    setWebhookUrl("");
    setWebhookSecret(null);
  }

  function closeDialog() {
    resetDialog();
    closeCreate();
  }

  function handleSubmit() {
    if (!canSubmit) return;
    createMut.mutate(
      {
        name: name.trim(),
        webhook_url: normalizedWebhookUrl,
      },
      {
        onSuccess: (app) => {
          if (app.webhook_secret) {
            setWebhookSecret(app.webhook_secret);
            return;
          }
          closeDialog();
        },
      },
    );
  }

  async function copyWebhookSecret() {
    if (!webhookSecret) return;
    await navigator.clipboard.writeText(webhookSecret);
  }

  return (
    <GlassDialog
      open={createOpen}
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
      size="sm"
    >
      <GlassDialogHeader
        icon={webhookSecret ? <Webhook size={22} /> : <AppWindow size={22} />}
        title={webhookSecret ? "Webhook secret" : "New application"}
        description={
          webhookSecret
            ? "Store this secret now. It is shown only once and is required to verify webhook signatures."
            : "Give your app a name and optionally configure the webhook endpoint your backend will receive."
        }
      />
      <GlassDialogBody>
        {webhookSecret ? (
          <div className="flex flex-col gap-3">
            <input
              value={webhookSecret}
              readOnly
              className="input-mono text-center"
              spellCheck={false}
            />
            <p className="face-helper text-[12px] text-center">
              Use this value with the X-Spectre-Signature verifier in your
              webhook receiver.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) handleSubmit();
              }}
              placeholder="e.g. Spectre Production"
              className="input-mono text-center"
              autoComplete="off"
              spellCheck={false}
            />
            <input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) handleSubmit();
              }}
              placeholder="https://api.example.com/webhooks/spectre"
              className="input-mono text-center"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!webhookUrlValid}
            />
            {!webhookUrlValid && (
              <p className="face-helper text-[12px] text-center text-[color:var(--sys-red)]">
                Webhook URL must start with http:// or https://.
              </p>
            )}
          </div>
        )}
      </GlassDialogBody>
      <GlassDialogFooter>
        {webhookSecret ? (
          <>
            <Button
              type="button"
              variant="ghost-glass"
              onClick={copyWebhookSecret}
            >
              <Copy data-icon="inline-start" />
              Copy secret
            </Button>
            <Button type="button" variant="primary-glass" onClick={closeDialog}>
              Done
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="ghost-glass" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary-glass"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {createMut.isPending && (
                <Spinner size="sm" data-icon="inline-start" />
              )}
              {createMut.isPending ? "Creating…" : "Create application"}
            </Button>
          </>
        )}
      </GlassDialogFooter>
    </GlassDialog>
  );
}

function normalizeWebhookUrl(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function isWebhookUrlValid(value: string | null): boolean {
  if (!value) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
