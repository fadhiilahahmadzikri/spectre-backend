import { useEffect, useRef, useState } from "react";
import { AppWindow } from "lucide-react";
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
 * hook. The dialog closes immediately on submit; the list shows the new
 * application with a pending indicator until the server reconciles.
 *
 * The parent renders this component with a `key` tied to the store's
 * `createOpenCount`, so a fresh instance mounts on every open — killing the
 * stale-state anti-pattern (AP-05).
 */
export function CreateApplicationDialog() {
  const { createOpen, closeCreate } = useAppsUi();
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const createMut = useCreateApplication();

  useEffect(() => {
    if (!createOpen) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(id);
  }, [createOpen]);

  const canSubmit = name.trim().length > 0 && !createMut.isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    createMut.mutate({ name: name.trim() });
    // Realistic UI: close the dialog immediately. The list already shows the
    // optimistic row with a pending indicator.
    closeCreate();
  }

  return (
    <GlassDialog
      open={createOpen}
      onOpenChange={(open) => {
        if (!open) closeCreate();
      }}
      size="sm"
    >
      <GlassDialogHeader
        icon={<AppWindow size={22} />}
        title="New application"
        description="Give your app a memorable name. You can issue API keys for it after creating."
      />
      <GlassDialogBody>
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
      </GlassDialogBody>
      <GlassDialogFooter>
        <Button type="button" variant="ghost-glass" onClick={closeCreate}>
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
      </GlassDialogFooter>
    </GlassDialog>
  );
}
