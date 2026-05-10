import { useState, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ConfigSwitcher, type ConfigOption } from "@/shared/ui/ConfigSwitcher";
import { getBaseUrl, setBaseUrl, resolveEnvName, ENV, type EnvName } from "@/lib/config";
import { useOrchestrationStore } from "@/lib/store";
import { notify } from "@/shared/lib/notify";
import { KeepAliveDrawer } from "./KeepAliveDrawer";
import {
  Database, Clock, RefreshCcw,
  Server, Cloud, Box, HardDrive, Settings2, ChevronRight,
} from "lucide-react";
import { HuggingFaceIcon, SupabaseIcon, TensorFlowIcon } from "@/shared/icons";

export function AdminHealth() {
  const qc = useQueryClient();
  const [apiEnv, setApiEnv] = useState<EnvName>(() => resolveEnvName(getBaseUrl()));
  const [isKeepAliveOpen, setKeepAliveOpen] = useState(false);
  const { isSyncing, setFrozen } = useOrchestrationStore();

  useEffect(() => {
    const listener = (e: Event) => setApiEnv(resolveEnvName((e as CustomEvent<string>).detail));
    window.addEventListener("spectre:env-change", listener);
    return () => window.removeEventListener("spectre:env-change", listener);
  }, []);

  const { data: health, isLoading: loadingHealth, refetch: refetchHealth } = useQuery({
    queryKey: ["health"],
    queryFn: () => api.getHealth(),
    refetchInterval: 30000,
  });

  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.getAdminStats(),
    refetchInterval: 60000,
  });

  const isLoading = loadingHealth || loadingStats || isSyncing;

  async function refreshAll() {
    notify.info("Refreshing infrastructure status...");
    await Promise.all([refetchHealth(), refetchStats()]);
    notify.success("Health status updated.");
  }

  const waitForReadiness = async (maxAttempts = 30) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const h = await api.getHealth();
        if (h.status === "healthy") return true;
      } catch { /* expected */ }
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error("Readiness timeout.");
  };

  const handleApiSwitch = async (id: string) => {
    setFrozen(true, "Switching API...");
    notify.info("Switching API environment...");
    try {
      setBaseUrl(id === "hf" ? ENV.HF_SPACES : ENV.LOCAL);
      await waitForReadiness();
      await qc.invalidateQueries();
      notify.success("API environment synchronized.");
    } catch (err) {
      notify.error(`Switch failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setFrozen(false);
    }
  };

  const handleDbSwitch = async (id: string) => {
    setFrozen(true, "Database failover...");
    notify.info("Orchestrating database failover...");
    try {
      await api.switchDatabase(id);
      if (apiEnv === "hf") await new Promise((r) => setTimeout(r, 5000));
      await waitForReadiness();
      await refetchStats();
      qc.invalidateQueries();
      notify.success(`Database transitioned to ${id}.`);
    } catch (err) {
      notify.error(`Failover failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setFrozen(false);
    }
  };

  const apiOptions: ConfigOption[] = [
    { id: "local", label: "Local Development", description: "localhost:8000", icon: <Server className="w-5 h-5" /> },
    { id: "hf", label: "Hugging Face Spaces", description: "Production API proxy", icon: <Cloud className="w-5 h-5" /> },
  ];

  const dbOptions: ConfigOption[] = [
    { id: "supabase", label: "Supabase (Session Pooler)", description: "Remote PostgreSQL + pgBouncer", icon: <Database className="w-5 h-5" /> },
    { id: "alpine", label: "Alpine PostgreSQL", description: "Local container via supervisord", icon: <HardDrive className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16">
      <KeepAliveDrawer open={isKeepAliveOpen} onClose={() => setKeepAliveOpen(false)} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div className="flex flex-col gap-1">
          <p className="face-helper text-[13px]">Infrastructure Control</p>
          <h1 className="page-title">Admin Health</h1>
        </div>
        <button
          onClick={refreshAll}
          disabled={isLoading}
          className="btn-ghost inline-flex items-center gap-2 text-[13px] w-fit"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Infrastructure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfraCard
          icon={<HuggingFaceIcon size={22} />}
          accent="yellow"
          label="System Status"
          title="Hugging Face Space"
          status={health?.status}
          loading={loadingHealth}
          rows={[
            ["Version", health?.version || "---"],
            ["Uptime", "Proactive (20h)"],
          ]}
        />
        <InfraCard
          icon={<SupabaseIcon size={22} />}
          accent="green"
          label="Storage Layer"
          title="Active Database"
          status={health?.components.database}
          loading={loadingHealth}
          rows={[
            ["Engine", "PostgreSQL 17"],
            ["Target", stats?.active_db || "---"],
          ]}
        />
        <InfraCard
          icon={<TensorFlowIcon size={22} />}
          accent="orange"
          label="Inference Engine"
          title="ML Model"
          status={health?.components.ml_model === "loaded" ? "healthy" : "not_loaded"}
          loading={loadingHealth}
          rows={[
            ["Framework", "TensorFlow"],
            ["Status", "Ready"],
          ]}
        />
      </div>

      {/* Environment Switchers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConfigSwitcher title="API Target" description="Route requests to backend." icon={<Box className="w-5 h-5" />} options={apiOptions} activeId={apiEnv} onChange={handleApiSwitch} />
        <ConfigSwitcher title="Database" description="Switch active storage layer." icon={<HardDrive className="w-5 h-5" />} options={dbOptions} activeId={stats?.active_db === "supabase" ? "supabase" : "alpine"} onChange={handleDbSwitch} />
      </div>

      {/* Keep-Alive */}
      <section className="glass-strong rounded-[20px] overflow-hidden border border-white/5">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-[color:var(--label-secondary)]" />
            <span className="face-title text-[15px]">Keep-Alive Heartbeats</span>
          </div>
          <button onClick={() => setKeepAliveOpen(true)} className="btn-ghost text-[11px] inline-flex items-center gap-1.5 w-fit group">
            <Settings2 className="w-3.5 h-3.5" />
            Manage
            <ChevronRight className="w-3 h-3 opacity-50 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[color:var(--label-tertiary)]">
                <th className="px-5 py-2.5 text-[10px] font-mono font-medium uppercase tracking-wider">Timestamp</th>
                <th className="px-5 py-2.5 text-[10px] font-mono font-medium uppercase tracking-wider">Source</th>
                <th className="px-5 py-2.5 text-[10px] font-mono font-medium uppercase tracking-wider">Target</th>
                <th className="px-5 py-2.5 text-[10px] font-mono font-medium uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingStats && (
                <tr><td colSpan={4}><div className="flex justify-center py-10"><Spinner /></div></td></tr>
              )}
              {!loadingStats && stats?.heartbeats.map((hb, i) => (
                <tr key={hb.id} className={`hover:bg-white/[0.02] transition-colors ${i > 0 ? "border-t border-white/[0.04]" : ""}`}>
                  <td className="px-5 py-3 kbd-mono text-[12px]">{new Date(hb.pinged_at).toLocaleString()}</td>
                  <td className="px-5 py-3 kbd-mono text-[11px]">{hb.source}</td>
                  <td className="px-5 py-3 kbd-mono text-[11px] flex items-center gap-2">
                    {hb.source === "github-actions" ? <Database className="w-3 h-3" /> : <Server className="w-3 h-3" />}
                    {hb.source === "github-actions" ? "Supabase Ping" : "HF /health"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center gap-1.5 text-green-500/80 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
                      OK
                    </span>
                  </td>
                </tr>
              ))}
              {!loadingStats && !stats?.heartbeats.length && (
                <tr><td colSpan={4}><EmptyState title="No heartbeat records" description="Heartbeats will appear once the keep-alive engine runs." compact /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* --- InfraCard: reusable infrastructure status card --- */

const ACCENT_MAP = {
  yellow: { bg: "bg-yellow-500/5", border: "border-yellow-500/10", icon: "text-yellow-500" },
  green: { bg: "bg-green-500/5", border: "border-green-500/10", icon: "text-green-500" },
  orange: { bg: "bg-orange-500/5", border: "border-orange-500/10", icon: "text-orange-500" },
} as const;

interface InfraCardProps {
  icon: ReactNode;
  accent: keyof typeof ACCENT_MAP;
  label: string;
  title: string;
  status?: string;
  loading: boolean;
  rows: [string, string][];
}

function InfraCard({ icon, accent, label, title, status, loading, rows }: InfraCardProps) {
  const colors = ACCENT_MAP[accent];
  const statusColor = (() => {
    switch (status?.toLowerCase()) {
      case "healthy": case "loaded": return "text-green-500";
      case "degraded": case "not_loaded": return "text-yellow-500";
      default: return "text-red-500";
    }
  })();

  return (
    <div className={`glass-strong rounded-[20px] p-5 flex flex-col gap-4 border ${colors.border} ${colors.bg}`}>
      <div className="flex items-center justify-between">
        <div className={colors.icon}>{icon}</div>
        {loading ? <Spinner /> : status && (
          <span className={`text-[11px] font-mono font-medium uppercase ${statusColor}`}>{status}</span>
        )}
      </div>
      <div>
        <p className="eyebrow">{label}</p>
        <h3 className="face-title text-lg mt-0.5">{title}</h3>
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between text-[11px] font-mono">
            <span className="text-[color:var(--label-tertiary)]">{k}</span>
            <span className="text-[color:var(--label-primary)] truncate max-w-[140px]">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
