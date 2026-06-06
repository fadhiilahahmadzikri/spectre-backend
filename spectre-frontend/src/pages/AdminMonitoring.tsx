import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AdminUser, AdminApplication, AdminApiKey, AdminFaceProfile, AdminSession,
  Pagination,
} from "@/lib/api";
import { useIosAlert } from "@/app/providers/ios-alert-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, AppWindow, KeyRound, ScanFace, Activity,
  Trash2, Ban, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Page                                                                  */
/* ═══════════════════════════════════════════════════════════════════════ */
export function AdminMonitoring() {
  return (
    <div className="w-full flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="page-title">Admin Monitoring</h1>
        <p className="face-helper text-[13px]">
          Global view of all platform resources.
        </p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="users"><Users size={14} className="mr-1.5" /> Users</TabsTrigger>
          <TabsTrigger value="applications"><AppWindow size={14} className="mr-1.5" /> Applications</TabsTrigger>
          <TabsTrigger value="api-keys"><KeyRound size={14} className="mr-1.5" /> API Keys</TabsTrigger>
          <TabsTrigger value="face-profiles"><ScanFace size={14} className="mr-1.5" /> Face Profiles</TabsTrigger>
          <TabsTrigger value="sessions"><Activity size={14} className="mr-1.5" /> Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="applications"><ApplicationsTab /></TabsContent>
        <TabsContent value="api-keys"><ApiKeysTab /></TabsContent>
        <TabsContent value="face-profiles"><FaceProfilesTab /></TabsContent>
        <TabsContent value="sessions"><SessionsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  USERS TAB                                                             */
/* ═══════════════════════════════════════════════════════════════════════ */
function UsersTab() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const iosAlert = useIosAlert();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", page],
    queryFn: ({ signal }) => api.adminListUsers(page, 20, { signal }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.adminDeleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const users = data?.data ?? [];
  const pagination = data?.pagination;

  async function handleDelete(u: AdminUser) {
    const ok = await iosAlert.confirm({
      title: "Delete user?",
      message: `"${u.email}" will be permanently removed.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      destructive: true,
    });
    if (ok) deleteMut.mutate(u.id);
  }

  return (
    <>
      <DataTable loading={isLoading} empty={users.length === 0} emptyLabel="No users found" cols={6}>
        <thead>
          <tr><Th>Email</Th><Th>Display Name</Th><Th>Role</Th><Th>Active</Th><Th>Created</Th><Th /></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="table-row-hover">
              <Td mono>{u.email}</Td>
              <Td>{u.display_name ?? "—"}</Td>
              <Td><RoleBadge role={u.role} /></Td>
              <Td><StatusDot active={u.is_active} /></Td>
              <Td dim>{fmtDate(u.created_at)}</Td>
              <Td>
                <button onClick={() => handleDelete(u)} className="icon-btn" aria-label="Delete">
                  <Trash2 size={13} />
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      <PaginationBar pagination={pagination} page={page} onPageChange={setPage} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  APPLICATIONS TAB                                                      */
/* ═══════════════════════════════════════════════════════════════════════ */
function ApplicationsTab() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const iosAlert = useIosAlert();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "applications", page],
    queryFn: ({ signal }) => api.adminListAllApps(page, 20, { signal }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.adminDeleteApp(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "applications"] }),
  });

  const apps = data?.data ?? [];
  const pagination = data?.pagination;

  async function handleDelete(a: AdminApplication) {
    const ok = await iosAlert.confirm({
      title: "Delete application?",
      message: `"${a.name}" and all related data will be removed.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      destructive: true,
    });
    if (ok) deleteMut.mutate(a.id);
  }

  return (
    <>
      <DataTable loading={isLoading} empty={apps.length === 0} emptyLabel="No applications found" cols={5}>
        <thead>
          <tr><Th>Name</Th><Th>Owner</Th><Th>Status</Th><Th>Created</Th><Th /></tr>
        </thead>
        <tbody>
          {apps.map((a) => (
            <tr key={a.id} className="table-row-hover">
              <Td>{a.name}</Td>
              <Td mono>{a.owner_id.slice(0, 8)}…</Td>
              <Td><AppStatusBadge status={a.status} /></Td>
              <Td dim>{fmtDate(a.created_at)}</Td>
              <Td>
                <button onClick={() => handleDelete(a)} className="icon-btn" aria-label="Delete">
                  <Trash2 size={13} />
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      <PaginationBar pagination={pagination} page={page} onPageChange={setPage} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  API KEYS TAB                                                          */
/* ═══════════════════════════════════════════════════════════════════════ */
function ApiKeysTab() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const iosAlert = useIosAlert();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "api-keys", page],
    queryFn: ({ signal }) => api.adminListAllApiKeys(page, 20, { signal }),
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => api.adminRevokeApiKey(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "api-keys"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.adminDeleteApiKey(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "api-keys"] }),
  });

  const keys = data?.data ?? [];
  const pagination = data?.pagination;

  async function handleRevoke(k: AdminApiKey) {
    const ok = await iosAlert.confirm({
      title: "Revoke API key?",
      message: `Key "${k.key_prefix}…" will be permanently disabled.`,
      confirmLabel: "Revoke",
      cancelLabel: "Cancel",
      destructive: true,
    });
    if (ok) revokeMut.mutate(k.id);
  }

  return (
    <>
      <DataTable loading={isLoading} empty={keys.length === 0} emptyLabel="No API keys found" cols={6}>
        <thead>
          <tr><Th>Prefix</Th><Th>App ID</Th><Th>Status</Th><Th>Last Used</Th><Th>Created</Th><Th /></tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k.id} className="table-row-hover">
              <Td mono>{k.key_prefix}…</Td>
              <Td mono>{k.app_id.slice(0, 8)}…</Td>
              <Td><KeyStatusBadge status={k.status} /></Td>
              <Td dim>{k.last_used_at ? fmtDate(k.last_used_at) : "Never"}</Td>
              <Td dim>{fmtDate(k.created_at)}</Td>
              <Td>
                <div className="flex gap-1">
                  {k.status === "active" && (
                    <button onClick={() => handleRevoke(k)} className="icon-btn" aria-label="Revoke">
                      <Ban size={13} />
                    </button>
                  )}
                  <button onClick={() => deleteMut.mutate(k.id)} className="icon-btn" aria-label="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      <PaginationBar pagination={pagination} page={page} onPageChange={setPage} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  FACE PROFILES TAB                                                     */
/* ═══════════════════════════════════════════════════════════════════════ */
function FaceProfilesTab() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const iosAlert = useIosAlert();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "face-profiles", page],
    queryFn: ({ signal }) => api.adminListFaceProfiles(page, 20, undefined, { signal }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.adminDeleteFaceProfile(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "face-profiles"] }),
  });

  const profiles = data?.data ?? [];
  const pagination = data?.pagination;

  async function handleDelete(f: AdminFaceProfile) {
    const ok = await iosAlert.confirm({
      title: "Delete face profile?",
      message: `Profile for "${f.external_user_id}" will be removed.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      destructive: true,
    });
    if (ok) deleteMut.mutate(f.id);
  }

  return (
    <>
      <DataTable loading={isLoading} empty={profiles.length === 0} emptyLabel="No face profiles found" cols={6}>
        <thead>
          <tr><Th>External User ID</Th><Th>App ID</Th><Th>Model</Th><Th>Active</Th><Th>Created</Th><Th /></tr>
        </thead>
        <tbody>
          {profiles.map((f) => (
            <tr key={f.id} className="table-row-hover">
              <Td mono>{f.external_user_id}</Td>
              <Td mono>{f.app_id.slice(0, 8)}…</Td>
              <Td dim>{f.model_version ?? "—"}</Td>
              <Td><StatusDot active={f.is_active} /></Td>
              <Td dim>{fmtDate(f.created_at)}</Td>
              <Td>
                <button onClick={() => handleDelete(f)} className="icon-btn" aria-label="Delete">
                  <Trash2 size={13} />
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      <PaginationBar pagination={pagination} page={page} onPageChange={setPage} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  SESSIONS TAB                                                          */
/* ═══════════════════════════════════════════════════════════════════════ */
function SessionsTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "sessions", page],
    queryFn: ({ signal }) => api.adminListSessions(page, 20, { signal }),
  });

  const sessions = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <>
      <DataTable loading={isLoading} empty={sessions.length === 0} emptyLabel="No sessions found" cols={7}>
        <thead>
          <tr><Th>User</Th><Th>Type</Th><Th>Status</Th><Th>Liveness</Th><Th>Similarity</Th><Th>Time (ms)</Th><Th>Created</Th></tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} className="table-row-hover">
              <Td mono>{s.external_user_id}</Td>
              <Td><SessionTypeBadge type={s.session_type} /></Td>
              <Td><SessionStatusBadge status={s.status} /></Td>
              <Td mono>{s.liveness_confidence != null ? `${(s.liveness_confidence * 100).toFixed(1)}%` : "—"}</Td>
              <Td mono>{s.similarity_score != null ? `${(s.similarity_score * 100).toFixed(1)}%` : "—"}</Td>
              <Td mono>{s.inference_time_ms ?? "—"}</Td>
              <Td dim>{fmtDate(s.created_at)}</Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      <PaginationBar pagination={pagination} page={page} onPageChange={setPage} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Shared primitives                                                     */
/* ═══════════════════════════════════════════════════════════════════════ */

function DataTable({
  children, loading, empty, emptyLabel, cols = 5
}: { children: React.ReactNode; loading: boolean; empty: boolean; emptyLabel: string; cols?: number }) {
  if (loading) {
    return (
      <div className="glass rounded-[var(--radius-card)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3 border-b border-[color:var(--poc-border)]">
                  <Skeleton className="h-3 w-16 bg-[color:var(--border-strong)]/30" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="px-4 py-3 border-b border-[color:var(--poc-border)]/40">
                    <Skeleton className="h-4 w-full max-w-[120px] bg-[color:var(--border-strong)]/20" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="glass rounded-[var(--radius-card)] p-10 flex flex-col items-center gap-2 text-center">
        <p className="face-helper text-[13px]">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div className="glass rounded-[var(--radius-card)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">{children}</table>
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="text-left font-medium text-[11px] text-[color:var(--label-secondary)] uppercase tracking-wider px-4 py-3 border-b border-[color:var(--poc-border)]">{children}</th>;
}

function Td({ children, mono, dim }: { children: React.ReactNode; mono?: boolean; dim?: boolean }) {
  return (
    <td className={cn(
      "px-4 py-3 border-b border-[color:var(--poc-border)]/40",
      mono && "font-mono text-[12px]",
      dim && "text-[color:var(--label-secondary)]",
    )}>
      {children}
    </td>
  );
}

function PaginationBar({ pagination, page, onPageChange }: {
  pagination?: Pagination; page: number; onPageChange: (p: number) => void;
}) {
  if (!pagination || pagination.total <= pagination.page_size) return null;
  const totalPages = Math.ceil(pagination.total / pagination.page_size);
  return (
    <div className="flex items-center justify-between pt-4">
      <span className="kbd-mono">
        Page {page} of {totalPages} · {pagination.total} total
      </span>
      <div className="flex gap-2">
        <Button variant="ghost-glass" size="inline" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft size={14} /> Prev
        </Button>
        <Button variant="ghost-glass" size="inline" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Next <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={cn(
      "inline-block w-2.5 h-2.5 rounded-full",
      active ? "bg-[var(--sys-green)]" : "bg-[color:var(--fill-tertiary)]",
    )} />
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge variant={role === "admin" ? "destructive" : "secondary"}>
      {role}
    </Badge>
  );
}

function AppStatusBadge({ status }: { status: string }) {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    deleted: "destructive",
    suspended: "secondary",
  };
  return <Badge variant={map[status] ?? "outline"}>{status}</Badge>;
}

function KeyStatusBadge({ status }: { status: string }) {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    revoked: "destructive",
  };
  return <Badge variant={map[status] ?? "outline"}>{status}</Badge>;
}

function SessionTypeBadge({ type }: { type: string }) {
  return <Badge variant="outline">{type}</Badge>;
}

function SessionStatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    SUCCESS: "default",
    FAILED: "destructive",
    SPOOF_DETECTED: "destructive",
    PENDING: "secondary",
  };
  return <Badge variant={map[s] ?? "outline"}>{status}</Badge>;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
