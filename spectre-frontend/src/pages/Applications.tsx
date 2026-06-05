import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useIosAlert } from "@/app/providers/ios-alert-context";
import {
  AppWindow,
  KeyRound,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  Sparkles,
  Webhook,
} from "lucide-react";
import { useAppsUi } from "@/features/applications/model/apps-ui-store";
import { CreateApplicationDialog } from "@/features/applications/ui/CreateApplicationDialog";
import {
  useUpdateApplication,
  useDeleteApplication,
  type PendingApplication,
} from "@/features/applications/model/use-applications";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ResourceGridSkeleton } from "@/shared/ui/Skeleton";
import { AddResourceTile } from "@/shared/ui/AddResourceTile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Applications() {
  const iosAlert = useIosAlert();
  const { editingId, setEditing, openCreate, createOpenCount } = useAppsUi();
  const [editName, setEditName] = useState("");
  const [editWebhookUrl, setEditWebhookUrl] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["apps"],
    queryFn: ({ signal }) => api.listApps({ signal }),
  });

  const updateMut = useUpdateApplication();
  const deleteMut = useDeleteApplication();

  function handleSaveEdit(app: PendingApplication) {
    const nextName = editName.trim();
    const nextWebhookUrl = normalizeWebhookUrl(editWebhookUrl);
    const webhookUrlValid = isWebhookUrlValid(nextWebhookUrl);
    const currentWebhookUrl = app.webhook_url ?? null;
    if (!webhookUrlValid) return;
    if (
      !nextName ||
      (nextName === app.name && nextWebhookUrl === currentWebhookUrl)
    ) {
      setEditing(null);
      return;
    }
    // Close the edit input immediately — the list reconciles optimistically.
    setEditing(null);
    updateMut.mutate(
      {
        id: app.id,
        name: nextName,
        webhook_url: nextWebhookUrl,
      },
      {
        onSuccess: (updatedApp) => {
          if (updatedApp.webhook_secret) {
            presentWebhookSecret(updatedApp.webhook_secret);
          }
        },
      },
    );
  }

  function presentWebhookSecret(secret: string) {
    iosAlert.present({
      title: "Webhook secret",
      message:
        "Copy this secret now. It is available only once and is required to verify webhook signatures.",
      actions: [
        {
          label: "Copy secret",
          onClick: () => {
            void navigator.clipboard.writeText(secret);
          },
        },
        {
          label: "Done",
          style: "cancel",
          onClick: () => {},
        },
      ],
    });
  }

  async function handleDelete(id: string, appName: string) {
    const ok = await iosAlert.confirm({
      title: "Delete application?",
      message: `"${appName}" and all its API keys will be removed.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      destructive: true,
    });
    if (ok) deleteMut.mutate({ id });
  }

  const apps = (data?.data ?? []) as PendingApplication[];
  const isEmpty = !isLoading && apps.length === 0;

  return (
    <>
      <div className="w-full flex flex-col gap-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <h1 className="page-title">Applications</h1>
            <p className="face-helper text-[13px]">
              Manage your registered apps.
            </p>
          </div>
          {!isEmpty && !isLoading && (
            <Button
              type="button"
              variant="primary-glass"
              size="inline"
              onClick={openCreate}
              className="!px-5"
            >
              <Plus data-icon="inline-start" />
              New application
            </Button>
          )}
        </div>

        {isLoading ? (
          <ResourceGridSkeleton count={8} />
        ) : isEmpty ? (
          <EmptyState
            variant="full"
            icon={<Sparkles size={26} />}
            title="No applications yet"
            description="Create your first application to start issuing API keys and running face scans."
            action={
              <Button
                type="button"
                variant="primary-glass"
                size="inline"
                onClick={openCreate}
                className="!px-6"
              >
                <Plus data-icon="inline-start" />
                Create application
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                editing={editingId === app.id}
                editName={editName}
                editWebhookUrl={editWebhookUrl}
                onStartEdit={() => {
                  setEditing(app.id);
                  setEditName(app.name);
                  setEditWebhookUrl(app.webhook_url ?? "");
                }}
                onCancelEdit={() => setEditing(null)}
                onChangeEdit={setEditName}
                onChangeWebhookEdit={setEditWebhookUrl}
                onSaveEdit={() => handleSaveEdit(app)}
                onDelete={() => handleDelete(app.id, app.name)}
              />
            ))}
            <AddResourceTile title="New application" onClick={openCreate} />
          </div>
        )}
      </div>

      {/* key={createOpenCount} forces a fresh component instance on every open,
          which kills carried-over form state (AP-05). */}
      <CreateApplicationDialog key={createOpenCount} />
    </>
  );
}

interface AppCardProps {
  app: PendingApplication;
  editing: boolean;
  editName: string;
  editWebhookUrl: string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChangeEdit: (value: string) => void;
  onChangeWebhookEdit: (value: string) => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}

function AppCard({
  app,
  editing,
  editName,
  editWebhookUrl,
  onStartEdit,
  onCancelEdit,
  onChangeEdit,
  onChangeWebhookEdit,
  onSaveEdit,
  onDelete,
}: AppCardProps) {
  const pending = !!app.pending;
  const webhookConfigured = Boolean(app.has_webhook ?? app.webhook_url);
  return (
    <div
      data-pending={pending || undefined}
      aria-disabled={pending || undefined}
      className={cn(
        "glass hover-glow rounded-[var(--radius-card)] p-5 flex flex-col gap-3 relative overflow-hidden min-h-[132px]",
        pending && "opacity-80 shimmer pointer-events-none select-none",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[12px] bg-[color:var(--fill-tertiary)] border border-[color:var(--poc-border)] flex items-center justify-center shrink-0">
          <AppWindow size={18} className="text-[color:var(--label-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex flex-col gap-2">
              <input
                value={editName}
                onChange={(e) => onChangeEdit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveEdit();
                  if (e.key === "Escape") onCancelEdit();
                }}
                className="input-mono !py-1.5 !px-2 text-[13px]"
                autoFocus
              />
              <input
                value={editWebhookUrl}
                onChange={(e) => onChangeWebhookEdit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveEdit();
                  if (e.key === "Escape") onCancelEdit();
                }}
                placeholder="https://api.example.com/webhooks/spectre"
                className="input-mono !py-1.5 !px-2 text-[12px]"
                aria-invalid={
                  !isWebhookUrlValid(normalizeWebhookUrl(editWebhookUrl))
                }
              />
            </div>
          ) : (
            <>
              <p className="face-title text-[14px] truncate">{app.name}</p>
              <div className="mt-1.5 flex items-center gap-1.5 min-w-0">
                <Webhook
                  size={12}
                  className="text-[color:var(--label-tertiary)] shrink-0"
                />
                <p className="kbd-mono truncate">
                  {app.webhook_url ?? "No webhook"}
                </p>
              </div>
            </>
          )}
          <p className="kbd-mono truncate mt-0.5">{app.id.slice(0, 12)}…</p>
        </div>
      </div>

      {!editing && (
        <div
          className={cn(
            "rounded-[10px] px-2.5 py-1 text-[11px] font-semibold w-fit",
            webhookConfigured
              ? "bg-[rgba(52,199,89,0.12)] text-[color:var(--sys-green)]"
              : "bg-[color:var(--fill-tertiary)] text-[color:var(--label-secondary)]",
          )}
        >
          {webhookConfigured ? "Webhook active" : "Webhook missing"}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 mt-auto">
        {editing ? (
          <>
            <button
              type="button"
              onClick={onSaveEdit}
              className="icon-btn !bg-[rgba(52,199,89,0.12)] !border-[rgba(52,199,89,0.3)] text-[color:var(--sys-green)]"
              aria-label="Save"
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="icon-btn"
              aria-label="Cancel"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <Button
              asChild
              variant="ghost-glass"
              size="inline"
              className="!h-9 !py-0 !px-3 !text-[12px] flex-1"
            >
              <Link to={`/app/applications/${app.id}/keys`}>
                <KeyRound data-icon="inline-start" />
                API keys
              </Link>
            </Button>
            <button
              type="button"
              onClick={onStartEdit}
              className="icon-btn"
              aria-label="Rename"
            >
              <Pencil size={12} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="icon-btn"
              aria-label="Delete"
            >
              <Trash2 size={12} />
            </button>
          </>
        )}
      </div>
    </div>
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
