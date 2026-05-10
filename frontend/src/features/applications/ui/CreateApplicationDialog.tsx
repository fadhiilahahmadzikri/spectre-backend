import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppWindow } from "lucide-react";
import { api } from "@/lib/api";
import { notify } from "@/shared/lib/notify";
import { CreateResourceDialog } from "@/shared/ui/CreateResourceDialog";
import { useAppsUi } from "../model/apps-ui-store";

export function CreateApplicationDialog() {
  const { createOpen, closeCreate } = useAppsUi();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const createMut = useMutation({
    mutationFn: () => api.createApp({ name: name.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apps"] });
      notify.success("Application created", { description: name.trim() });
      setName("");
      closeCreate();
    },
    onError: (err) => notify.error((err as Error).message),
  });

  useEffect(() => {
    if (!createOpen) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => {
      window.clearTimeout(id);
      queueMicrotask(() => setName(""));
    };
  }, [createOpen]);

  const canSubmit = name.trim().length > 0 && !createMut.isPending;

  return (
    <CreateResourceDialog
      open={createOpen}
      onOpenChange={(open) => {
        if (!open) closeCreate();
      }}
      icon={<AppWindow size={22} />}
      title="New application"
      description="Give your app a memorable name. You can issue API keys for it after creating."
    >
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && canSubmit) createMut.mutate();
        }}
        placeholder="e.g. Spectre Production"
        className="input-mono text-center"
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="button"
        onClick={() => createMut.mutate()}
        disabled={!canSubmit}
        className="btn-primary"
      >
        {createMut.isPending ? "Creating…" : "Create application"}
      </button>
      <button type="button" onClick={closeCreate} className="btn-ghost">
        Cancel
      </button>
    </CreateResourceDialog>
  );
}
