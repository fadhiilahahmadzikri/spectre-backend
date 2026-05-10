import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type Application } from "@/lib/api";
import { notify } from "@/shared/lib/notify";
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
} from "lucide-react";
import { useAppsUi } from "@/features/applications/model/apps-ui-store";
import { CreateApplicationDialog } from "@/features/applications/ui/CreateApplicationDialog";
import { EmptyResourceState } from "@/shared/ui/EmptyResourceState";
import { AddResourceTile } from "@/shared/ui/AddResourceTile";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";

export function Applications() {
  const qc = useQueryClient();
  const iosAlert = useIosAlert();
  const { editingId, setEditing, openCreate } = useAppsUi();
  const [editName, setEditName] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["apps"], queryFn: api.listApps });

  const updateMut = useMutation({
    mutationFn: () => api.updateApp(editingId!, { name: editName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apps"] });
      setEditing(null);
      notify.success("Application updated");
    },
    onError: (err) => notify.error((err as Error).message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deleteApp(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apps"] });
      notify.success("Application removed");
    },
    onError: (err) => notify.error((err as Error).message),
  });

  async function handleDelete(id: string, appName: string) {
    const ok = await iosAlert.confirm({
      title: "Delete application?",
      message: `"${appName}" and all its API keys will be removed.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      destructive: true,
    });
    if (ok) deleteMut.mutate(id);
  }

  const apps = data?.data ?? [];
  const isEmpty = !isLoading && apps.length === 0;

  return (
    <>
      <div className="w-full flex flex-col gap-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <h1 className="page-title">Applications</h1>
            <p className="face-helper text-[13px]">Manage your registered apps.</p>
          </div>
          {!isEmpty && !isLoading && (
            <button
              type="button"
              onClick={openCreate}
              className="btn-primary is-inline px-5 inline-flex items-center gap-2"
            >
              <Plus size={16} />
              New application
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner label="Loading applications..." /></div>
        ) : isEmpty ? (
          <EmptyResourceState
            icon={<Sparkles size={26} />}
            title="No applications yet"
            description="Create your first application to start issuing API keys and running face scans."
            actionLabel="Create application"
            actionIcon={<Plus size={16} />}
            onAction={openCreate}
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                editing={editingId === app.id}
                editName={editName}
                onStartEdit={() => {
                  setEditing(app.id);
                  setEditName(app.name);
                }}
                onCancelEdit={() => setEditing(null)}
                onChangeEdit={setEditName}
                onSaveEdit={() => updateMut.mutate()}
                onDelete={() => handleDelete(app.id, app.name)}
              />
            ))}
            <AddResourceTile title="New application" onClick={openCreate} />
          </div>
        )}
      </div>

      <CreateApplicationDialog />
    </>
  );
}

interface AppCardProps {
  app: Application;
  editing: boolean;
  editName: string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChangeEdit: (value: string) => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}

function AppCard({
  app,
  editing,
  editName,
  onStartEdit,
  onCancelEdit,
  onChangeEdit,
  onSaveEdit,
  onDelete,
}: AppCardProps) {
  return (
    <div className="glass hover-glow rounded-[18px] p-5 flex flex-col gap-3 relative overflow-hidden min-h-[132px]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[12px] bg-[color:var(--fill-tertiary)] border border-[color:var(--poc-border)] flex items-center justify-center shrink-0">
          <AppWindow size={18} className="text-[color:var(--label-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
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
          ) : (
            <p className="face-title text-[14px] truncate">{app.name}</p>
          )}
          <p className="kbd-mono truncate mt-0.5">{app.id.slice(0, 12)}…</p>
        </div>
      </div>

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
            <Link
              to={`/applications/${app.id}/keys`}
              className="btn-ghost is-inline inline-flex items-center gap-1.5 !py-1.5 !px-3 text-[12px] flex-1 justify-center"
            >
              <KeyRound size={12} />
              API keys
            </Link>
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
