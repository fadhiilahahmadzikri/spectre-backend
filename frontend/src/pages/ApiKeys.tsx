import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { notify } from "@/shared/lib/notify";
import { useIosAlert } from "@/app/providers/ios-alert-context";
import {
  KeyRound,
  Ban,
  Copy,
  CheckCircle2,
  ChevronLeft,
  Plus,
  Sparkles,
} from "lucide-react";
import { useApiKeysUi } from "@/features/api-keys/model/api-keys-ui-store";
import { GenerateKeyDialog } from "@/features/api-keys/ui/GenerateKeyDialog";
import {
  useRevokeApiKey,
  type PendingApiKey,
} from "@/features/api-keys/model/use-api-keys";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ResourceGridSkeleton } from "@/shared/ui/Skeleton";
import { AddResourceTile } from "@/shared/ui/AddResourceTile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCopyToClipboard } from "@/shared/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

export function ApiKeys() {
  const { appId } = useParams<{ appId: string }>();
  const iosAlert = useIosAlert();
  const { openGenerate, generateOpenCount } = useApiKeysUi();

  const { data, isLoading } = useQuery({
    queryKey: ["keys", appId],
    queryFn: ({ signal }) => api.listKeys(appId!, { signal }),
    enabled: !!appId,
  });

  const revokeMut = useRevokeApiKey(appId!);

  async function handleRevoke(keyId: string) {
    const ok = await iosAlert.confirm({
      title: "Revoke API key?",
      message: "Applications using this key will lose access immediately.",
      confirmLabel: "Revoke",
      cancelLabel: "Cancel",
      destructive: true,
    });
    if (ok) revokeMut.mutate({ keyId });
  }

  const keys = (data?.data ?? []) as PendingApiKey[];
  const isEmpty = !isLoading && keys.length === 0;

  return (
    <>
      <div className="w-full flex flex-col gap-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-2">
            <Link
              to="/applications"
              className="inline-flex items-center gap-1 text-[12px] text-[color:var(--label-secondary)] hover:text-[color:var(--label-primary)] transition-colors w-fit"
            >
              <ChevronLeft size={14} />
              Applications
            </Link>
            <h1 className="page-title">API keys</h1>
            <p className="face-helper text-[13px]">
              Application ·{" "}
              <span className="font-mono">{appId?.slice(0, 12)}…</span>
            </p>
          </div>
          {!isEmpty && !isLoading && (
            <Button
              type="button"
              variant="primary-glass"
              size="inline"
              onClick={openGenerate}
              className="!px-5"
            >
              <Plus data-icon="inline-start" />
              Generate key
            </Button>
          )}
        </div>

        {isLoading ? (
          <ResourceGridSkeleton count={6} />
        ) : isEmpty ? (
          <EmptyState
            variant="full"
            icon={<Sparkles size={26} />}
            title="No API keys yet"
            description="Generate your first key to start calling the Spectre face verification API."
            action={
              <Button
                type="button"
                variant="primary-glass"
                size="inline"
                onClick={openGenerate}
                className="!px-6"
              >
                <Plus data-icon="inline-start" />
                Generate key
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {keys.map((key) => (
              <KeyCard
                key={key.id}
                keyRow={key}
                onRevoke={() => handleRevoke(key.id)}
              />
            ))}
            <AddResourceTile title="Generate key" onClick={openGenerate} />
          </div>
        )}
      </div>

      {appId && <GenerateKeyDialog key={generateOpenCount} appId={appId} />}
    </>
  );
}

interface KeyCardProps {
  keyRow: PendingApiKey;
  onRevoke: () => void;
}

function KeyCard({ keyRow, onRevoke }: KeyCardProps) {
  const active = !keyRow.revoked_at;
  const { copied, copy } = useCopyToClipboard();

  async function copyPrefix() {
    const ok = await copy(keyRow.key_prefix);
    if (ok) notify.success("Prefix copied");
  }

  return (
    <div
      className={cn(
        "glass hover-glow rounded-[var(--radius-card)] p-5 flex flex-col gap-3 relative overflow-hidden min-h-[132px]",
        keyRow.pending && "opacity-80 shimmer",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[12px] bg-[color:var(--fill-tertiary)] border border-[color:var(--poc-border)] flex items-center justify-center shrink-0">
          <KeyRound size={18} className="text-[color:var(--label-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <code className="kbd-mono text-[color:var(--label-primary)] text-[13px] truncate block">
            {keyRow.key_prefix}…
          </code>
          <div className="mt-1">
            <Badge
              variant={active ? "secondary" : "destructive"}
              className={cn(
                "text-[10px] uppercase tracking-wider",
                active &&
                  "!bg-[rgba(52,199,89,0.14)] !text-[color:var(--sys-green)]",
              )}
            >
              {active ? "active" : "revoked"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 mt-auto">
        <Button
          type="button"
          variant="ghost-glass"
          size="inline"
          onClick={copyPrefix}
          className="!py-1.5 !px-3 !text-[12px] flex-1"
        >
          {copied ? (
            <CheckCircle2 data-icon="inline-start" />
          ) : (
            <Copy data-icon="inline-start" />
          )}
          {copied ? "Copied" : "Copy prefix"}
        </Button>
        {active && (
          <Button
            type="button"
            variant="danger-soft"
            size="inline"
            onClick={onRevoke}
            aria-label="Revoke"
            disabled={keyRow.pending}
          >
            <Ban data-icon="inline-start" />
            Revoke
          </Button>
        )}
      </div>
    </div>
  );
}
