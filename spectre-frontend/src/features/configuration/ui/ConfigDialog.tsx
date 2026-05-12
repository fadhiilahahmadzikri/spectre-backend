import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  GlassDialog,
  GlassDialogHeader,
  GlassDialogBody,
  GlassDialogFooter,
} from "@/shared/ui/GlassDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { FormSkeleton } from "@/shared/ui/Skeleton";
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
import { useUpdateConfig } from "../model/use-update-config";

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

/**
 * Resolve the current server value for a config key by scanning the response
 * categories tree.
 */
function serverValue(data: ConfigResponse | undefined, key: string): string | undefined {
  if (!data) return undefined;
  for (const items of Object.values(data.categories)) {
    for (const item of items) {
      if (item.key === key) return item.value;
    }
  }
  return undefined;
}

export function ConfigDialog({ open, onClose }: ConfigDialogProps) {
  const [activeTab, setActiveTab] = useState(CATEGORY_ORDER[0]);

  // Local edit overrides. Only keys the user has actively touched live here;
  // everything else resolves from the server query.
  const [overrides, setOverrides] = useState<ConfigDraft>({});

  const { data, isLoading, isError } = useQuery<ConfigResponse>({
    queryKey: ["admin-config"],
    queryFn: ({ signal }) => api.getConfig({ signal }),
    enabled: open,
  });

  const mutation = useUpdateConfig();

  // Effective draft = server values merged with user overrides.
  const draft: ConfigDraft = {};
  if (data) {
    for (const items of Object.values(data.categories)) {
      for (const item of items) {
        draft[item.key] = overrides[item.key] ?? item.value;
      }
    }
  }

  const hasChanges = Object.entries(overrides).some(
    ([k, v]) => v !== serverValue(data, k),
  );

  function handleSave() {
    if (!data) return;
    const updates: Record<string, string> = {};
    for (const [k, v] of Object.entries(overrides)) {
      if (v !== serverValue(data, k)) updates[k] = v;
    }
    if (!Object.keys(updates).length) {
      notify.info("No changes to save.");
      return;
    }
    mutation.mutate(updates);
    // Clear overrides; the optimistic cache update has already propagated the
    // new values, so resolving from `data` will be correct.
    setOverrides({});
  }

  const availableCategories = CATEGORY_ORDER.filter(
    (c) => data?.categories[c]?.length,
  );

  return (
    <GlassDialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
      size="lg"
      className="h-[88vh]"
    >
      <GlassDialogHeader
        align="left"
        icon={<Settings2 size={20} />}
        title="System Configuration"
        description="Manage operational parameters. Changes apply immediately."
      />

      <GlassDialogBody>
        {isLoading ? (
          <FormSkeleton rows={5} />
        ) : isError || !data || !availableCategories.length ? (
          <EmptyState
            icon={<WifiOff className="w-6 h-6" />}
            title="Unable to load configuration"
            description="Backend is not reachable or configuration has not been seeded yet."
          />
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 min-h-0 flex flex-col"
          >
            <TabsList className="h-10 gap-1 rounded-xl p-1 justify-start flex-nowrap overflow-x-auto shrink-0">
              {availableCategories.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="text-[11px] px-3 h-7 rounded-lg inline-flex items-center gap-1.5 shrink-0"
                >
                  <span className="text-[color:var(--label-tertiary)]">
                    {CATEGORY_ICONS[cat]}
                  </span>
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
                    onChange={(key, value) =>
                      setOverrides((d) => ({ ...d, [key]: value }))
                    }
                  />
                </TabsContent>
              ))}
            </div>
          </Tabs>
        )}
      </GlassDialogBody>

      {!isLoading && data && !!availableCategories.length && (
        <GlassDialogFooter>
          <Button
            type="button"
            variant="primary-glass"
            size="inline"
            className="gap-2"
            disabled={!hasChanges || mutation.isPending}
            onClick={handleSave}
          >
            {mutation.isPending && (
              <Spinner size="sm" />
            )}
            {hasChanges && !mutation.isPending && (
              <span
                aria-hidden
                className="inline-block size-1.5 rounded-full bg-current opacity-70 pulse-dot"
              />
            )}
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </GlassDialogFooter>
      )}
    </GlassDialog>
  );
}
