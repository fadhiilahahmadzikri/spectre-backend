import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ApiKeyRow } from "@/lib/api";
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
import { EmptyResourceState } from "@/shared/ui/EmptyResourceState";
import { AddResourceTile } from "@/shared/ui/AddResourceTile";

export function ApiKeys() {
  const { appId } = useParams<{ appId: string }>();
  const qc = useQueryClient();
  const iosAlert = useIosAlert();
  const openGenerate = useApiKeysUi((s) => s.openGenerate);

  const { data, isLoading } = useQuery({
    queryKey: ["keys", appId],
    queryFn: () => api.listKeys(appId!),
    enabled: !!appId,
  });

  const revokeMut = useMutation({
    mutationFn: (keyId: string) => api.revokeKey(appId!, keyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["keys", appId] });
      notify.success("API key revoked");
    },
    onError: (err) => notify.error((err as Error).message),
  });

  async function handleRevoke(keyId: string) {
    const ok = await iosAlert.confirm({
      title: "Revoke API key?",
      message: "Applications using this key will lose access immediately.",
      confirmLabel: "Revoke",
      cancelLabel: "Cancel",
      destructive: true,
    });
    if (ok) revokeMut.mutate(keyId);
  }

  const keys = data?.data ?? [];
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
              Application · <span className="font-mono">{appId?.slice(0, 12)}…</span>
            </p>
          </div>
          {!isEmpty && !isLoading && (
            <button
              type="button"
              onClick={openGenerate}
              className="btn-primary is-inline px-5 inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Generate key
            </button>
          )}
        </div>

        {isLoading ? (
          <p className="kbd-mono text-center py-16">Loading…</p>
        ) : isEmpty ? (
          <EmptyResourceState
            icon={<Sparkles size={26} />}
            title="No API keys yet"
            description="Generate your first key to start calling the Spectre face verification API."
            actionLabel="Generate key"
            actionIcon={<Plus size={16} />}
            onAction={openGenerate}
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {keys.map((key) => (
              <KeyCard key={key.id} keyRow={key} onRevoke={() => handleRevoke(key.id)} />
            ))}
            <AddResourceTile title="Generate key" onClick={openGenerate} />
          </div>
        )}
      </div>

      {appId && <GenerateKeyDialog appId={appId} />}
    </>
  );
}

interface KeyCardProps {
  keyRow: ApiKeyRow;
  onRevoke: () => void;
}

function KeyCard({ keyRow, onRevoke }: KeyCardProps) {
  const active = !keyRow.revoked_at;
  const [copied, setCopied] = useState(false);

  function copyPrefix() {
    navigator.clipboard.writeText(keyRow.key_prefix);
    setCopied(true);
    notify.success("Prefix copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="glass hover-glow rounded-[18px] p-5 flex flex-col gap-3 relative overflow-hidden min-h-[132px]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[12px] bg-[color:var(--fill-tertiary)] border border-[color:var(--poc-border)] flex items-center justify-center shrink-0">
          <KeyRound size={18} className="text-[color:var(--label-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <code className="kbd-mono text-[color:var(--label-primary)] text-[13px] truncate block">
            {keyRow.key_prefix}…
          </code>
          <p className="kbd-mono mt-0.5">
            <span
              className={
                active ? "text-[color:var(--sys-green)]" : "text-[color:var(--danger)]"
              }
            >
              {active ? "active" : "revoked"}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 mt-auto">
        <button
          type="button"
          onClick={copyPrefix}
          className="btn-ghost is-inline inline-flex items-center gap-1.5 !py-1.5 !px-3 text-[12px] flex-1 justify-center"
        >
          {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy prefix"}
        </button>
        {active && (
          <button
            type="button"
            onClick={onRevoke}
            className="btn-danger-soft is-inline inline-flex items-center gap-1.5"
            aria-label="Revoke"
          >
            <Ban size={11} />
            Revoke
          </button>
        )}
      </div>
    </div>
  );
}
