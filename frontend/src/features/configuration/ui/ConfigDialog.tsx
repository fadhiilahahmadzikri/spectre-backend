import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/shared/ui/EmptyState";
import { notify } from "@/shared/lib/notify";
import {
  Settings2,
  WifiOff,
  ShieldCheck,
  Send,
  Gauge,
  Clock,
  Monitor,
} from "lucide-react";
import { ConfigSection } from "./ConfigSection";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type ConfigDraft,
  type ConfigResponse,
} from "../model/types";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  anti_spoofing: <ShieldCheck size={14} />,
  webhook: <Send size={14} />,
  rate_limiting: <Gauge size={14} />,
  session_auth: <Clock size={14} />,
  scan_ux: <Monitor size={14} />,
};

interface ConfigDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ConfigDialog({ open, onClose }: ConfigDialogProps) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<ConfigDraft>({});
  const [activeTab, setActiveTab] = useState(CATEGORY_ORDER[0]);

  const { data, isLoading, isError } = useQuery<ConfigResponse>({
    queryKey: ["admin-config"],
    queryFn: () => api.getConfig(),
    enabled: open,
  });

  useEffect(() => {
    if (!data) return;
    const d: ConfigDraft = {};
    for (const items of Object.values(data.categories)) {
      for (const item of items) d[item.key] = item.value;
    }
    setDraft(d);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (updates: Record<string, string>) => api.updateConfig(updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-config"] });
      notify.success("Configuration saved", { description: "Changes applied immediately." });
    },
    onError: (err) => {
      notify.error("Save failed", { description: err instanceof Error ? err.message : "Unknown error" });
    },
  });

  function handleSave() {
    if (!data) return;
    const updates: Record<string, string> = {};
    for (const items of Object.values(data.categories)) {
      for (const item of items) {
        if (draft[item.key] !== item.value) updates[item.key] = draft[item.key];
      }
    }
    if (!Object.keys(updates).length) {
      notify.info("No changes to save.");
      return;
    }
    mutation.mutate(updates);
  }

  const hasChanges = data
    ? Object.values(data.categories).some((items) =>
        items.some((item) => draft[item.key] !== item.value)
      )
    : false;

  const availableCategories = CATEGORY_ORDER.filter(
    (c) => data?.categories[c]?.length
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="
          glass-strong border-none p-0 overflow-hidden
          !rounded-[24px] sm:max-w-[720px] max-h-[88vh] flex flex-col
          [&>button]:top-5 [&>button]:right-5 [&>button]:text-[color:var(--label-secondary)]
        "
      >
        {/* Header — left aligned */}
        <div className="flex items-center gap-3 px-7 pt-7 pb-5 border-b border-[color:var(--separator)]">
          <div className="gate-icon-ring shrink-0">
            <Settings2 size={20} className="text-[color:var(--label-primary)]" />
          </div>
          <div className="flex flex-col">
            <DialogTitle className="face-title text-[17px]">System Configuration</DialogTitle>
            <DialogDescription className="face-helper text-[12px] mt-0.5">
              Manage operational parameters. Changes apply immediately.
            </DialogDescription>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col min-h-0 px-7 py-6">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : isError || !data || !availableCategories.length ? (
            <EmptyState
              icon={<WifiOff className="w-6 h-6" />}
              title="Unable to load configuration"
              description="Backend is not reachable or configuration has not been seeded yet."
            />
          ) : (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
                <TabsList variant="line" className="w-full h-auto gap-2 bg-transparent justify-start flex-nowrap overflow-x-auto">
                  {availableCategories.map((cat) => (
                    <TabsTrigger key={cat} value={cat} className="text-[11px] px-3 py-1.5 inline-flex items-center gap-1.5 shrink-0">
                      <span className="text-[color:var(--label-tertiary)]">{CATEGORY_ICONS[cat]}</span>
                      {CATEGORY_LABELS[cat] ?? cat}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="flex-1 overflow-y-auto mt-5 -mx-1 px-1 pb-2">
                  {availableCategories.map((cat) => (
                    <TabsContent key={cat} value={cat}>
                      <ConfigSection
                        items={data.categories[cat] ?? []}
                        draft={draft}
                        onChange={(key, value) => setDraft((d) => ({ ...d, [key]: value }))}
                      />
                    </TabsContent>
                  ))}
                </div>
              </Tabs>

              <div className="pt-5 border-t border-[color:var(--separator)] flex items-center justify-end">
                <button
                  type="button"
                  className="btn-primary !px-6"
                  disabled={!hasChanges || mutation.isPending}
                  onClick={handleSave}
                >
                  {mutation.isPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
