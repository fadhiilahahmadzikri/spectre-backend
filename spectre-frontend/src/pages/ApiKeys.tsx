import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useIosAlert } from "@/app/providers/ios-alert-context";
import {
  KeyRound,
  Ban,
  Trash2,
  ChevronLeft,
  Plus,
  Sparkles,
  MoreVertical,
} from "lucide-react";
import { useApiKeysUi } from "@/features/api-keys/model/api-keys-ui-store";
import { GenerateKeyDialog } from "@/features/api-keys/ui/GenerateKeyDialog";
import {
  useRevokeApiKey,
  useDeleteApiKey,
  type PendingApiKey,
} from "@/features/api-keys/model/use-api-keys";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ResourceGridSkeleton } from "@/shared/ui/Skeleton";
import { AddResourceTile } from "@/shared/ui/AddResourceTile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const deleteMut = useDeleteApiKey(appId!);

  async function handleRevoke(keyId: string) {
    const ok = await iosAlert.confirm({
      title: "Revoke API key?",
      message:
        "Applications using this key will lose access immediately. The record is kept for audit history; use Delete to remove it entirely.",
      confirmLabel: "Revoke",
      cancelLabel: "Cancel",
      destructive: true,
    });
    if (ok) revokeMut.mutate({ keyId });
  }

  async function handleDelete(keyId: string) {
    const ok = await iosAlert.confirm({
      title: "Delete API key permanently?",
      message:
        "The key record will be removed from the database. This cannot be undone and the audit trail for this key is lost.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      destructive: true,
    });
    if (ok) deleteMut.mutate({ keyId });
  }

  const allKeys = (data?.data ?? []) as PendingApiKey[];
  const activeKeys = allKeys.filter(isActiveKey);
  const revokedKeys = allKeys.filter((k) => !isActiveKey(k));
  const isEmpty = !isLoading && allKeys.length === 0;

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
          <>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {activeKeys.map((key) => (
                <KeyCard
                  key={key.id}
                  keyRow={key}
                  onRevoke={() => handleRevoke(key.id)}
                  onDelete={() => handleDelete(key.id)}
                />
              ))}
              <AddResourceTile title="Generate key" onClick={openGenerate} />
            </div>
            {revokedKeys.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer face-helper text-[12px] select-none list-none flex items-center gap-2 mb-4">
                  <span className="inline-block size-1.5 rounded-full bg-[color:var(--label-tertiary)]" />
                  Revoked keys ({revokedKeys.length}) · click to show
                </summary>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {revokedKeys.map((key) => (
                    <KeyCard
                      key={key.id}
                      keyRow={key}
                      onRevoke={() => handleRevoke(key.id)}
                      onDelete={() => handleDelete(key.id)}
                    />
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>

      {appId && <GenerateKeyDialog key={generateOpenCount} appId={appId} />}
    </>
  );
}

function isActiveKey(k: PendingApiKey): boolean {
  // Prefer the explicit status field; fall back to revoked_at for any older
  // payload that didn't include status. Any non-"active" status is treated
  // as inactive.
  if (k.status) return k.status === "active";
  return !k.revoked_at;
}

interface KeyCardProps {
  keyRow: PendingApiKey;
  onRevoke: () => void;
  onDelete: () => void;
}

function KeyCard({ keyRow, onRevoke, onDelete }: KeyCardProps) {
  const active = isActiveKey(keyRow);
  const pending = !!keyRow.pending;

  return (
    <div
      data-pending={pending || undefined}
      aria-disabled={pending || undefined}
      className={cn(
        "glass hover-glow rounded-[var(--radius-card)] p-5 flex flex-col gap-4 relative overflow-hidden min-h-[148px]",
        pending && "opacity-80 shimmer pointer-events-none select-none",
        !active && "opacity-75",
      )}
    >
      {/* Header: identity + actions menu */}
      <div className="flex items-start gap-3">
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
        <KeyCardMenu
          active={active}
          onRevoke={onRevoke}
          onDelete={onDelete}
        />
      </div>

      {/* Meta: created + last used */}
      <dl className="flex flex-col gap-1 mt-auto text-[11px]">
        <MetaRow label="Created" value={formatRelative(keyRow.created_at)} />
        <MetaRow
          label="Last used"
          value={
            keyRow.last_used_at ? formatRelative(keyRow.last_used_at) : "Never"
          }
        />
      </dl>
    </div>
  );
}

interface KeyCardMenuProps {
  active: boolean;
  onRevoke: () => void;
  onDelete: () => void;
}

function KeyCardMenu({ active, onRevoke, onDelete }: KeyCardMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Key actions"
          className={cn(
            "shrink-0 size-8 -mt-1 -mr-1 rounded-[10px]",
            "flex items-center justify-center",
            "text-[color:var(--label-secondary)]",
            "hover:bg-[color:var(--fill-tertiary)] hover:text-[color:var(--label-primary)]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--label-secondary)]",
            "transition-colors",
          )}
        >
          <MoreVertical size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[9rem]">
        {active && (
          <>
            <DropdownMenuItem onSelect={onRevoke}>
              <Ban size={14} />
              Revoke
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 size={14} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="face-helper text-[10px] uppercase tracking-wider">
        {label}
      </dt>
      <dd className="kbd-mono text-[11px] text-[color:var(--label-secondary)]">
        {value}
      </dd>
    </div>
  );
}

// Lightweight relative formatter — avoids pulling in date-fns for a single
// card. Not i18n-aware; acceptable for a developer dashboard.
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return `${diffMo}mo ago`;
  const diffYr = Math.floor(diffMo / 12);
  return `${diffYr}y ago`;
}
