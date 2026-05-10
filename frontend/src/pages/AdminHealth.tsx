import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ConfigSwitcher, type ConfigOption } from "@/shared/ui/ConfigSwitcher";
import { getBaseUrl, setBaseUrl, resolveEnvName, ENV, type EnvName } from "@/lib/config";
import { useOrchestrationStore } from "@/lib/store";
import { OrchestrationOverlay } from "@/shared/ui/OrchestrationOverlay";
import { KeepAliveDrawer } from "./KeepAliveDrawer";
import { 
  Activity, 
  Database, 
  Cpu, 
  Clock, 
  RefreshCcw, 
  ShieldCheck,
  LayoutDashboard,
  Server,
  Cloud,
  Box,
  HardDrive,
  Terminal,
  Trash2,
  Settings2,
  ChevronRight
} from "lucide-react";

export function AdminHealth() {
  const qc = useQueryClient();
  const [apiEnv, setApiEnv] = useState<EnvName>(() => resolveEnvName(getBaseUrl()));
  const [isKeepAliveOpen, setKeepAliveOpen] = useState(false);
  
  const { logs, addLog, clearLogs, isSyncing, setFrozen } = useOrchestrationStore();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setApiEnv(resolveEnvName(detail));
    };
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
    addLog("Manual refresh triggered. Polling infrastructure status...", "info");
    await Promise.all([
      refetchHealth(),
      refetchStats()
    ]);
    addLog("Health status updated successfully.", "success");
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "loaded":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "degraded":
      case "not_loaded":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-red-500/10 text-red-500 border-red-500/20";
    }
  };

  const waitForReadiness = async (maxAttempts = 30) => {
    addLog("Starting readiness polling loop...", "info");
    for (let i = 0; i < maxAttempts; i++) {
      try {
        addLog(`Readiness check [attempt ${i+1}/${maxAttempts}]...`, "info");
        const h = await api.getHealth();
        if (h.status === "healthy") {
          addLog("Server responded with HEALTHY. Synchronization verified.", "success");
          return true;
        }
      } catch (e) {
        // Expected during reboot
      }
      await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error("Readiness timeout. Manual intervention may be required.");
  };

  const handleApiSwitch = async (id: string) => {
    setFrozen(true, "API Routing Migration");
    addLog(`Initiating API Environment switch to [${id.toUpperCase()}]...`, "info");
    
    try {
      addLog("Updating local configuration store...", "info");
      const nextUrl = id === "hf" ? ENV.HF_SPACES : ENV.LOCAL;
      setBaseUrl(nextUrl);
      
      addLog(`API Base URL updated to: ${nextUrl}`, "info");
      addLog("Invalidating query cache...", "info");
      
      await waitForReadiness();
      await qc.invalidateQueries();
      addLog("Synchronization complete. System operating on new target.", "success");
    } catch (err) {
      addLog(`API switch failed: ${err instanceof Error ? err.message : String(err)}`, "error");
    } finally {
      setFrozen(false);
    }
  };

  const handleDbSwitch = async (id: string) => {
    setFrozen(true, "Database Cluster Failover");
    addLog(`Orchestrating Database Failover to [${id.toUpperCase()}]...`, "info");
    
    try {
      addLog("Sending configuration command to backend...", "info");
      await api.switchDatabase(id);
      
      addLog("Backend secrets updated. Hugging Face rebuild triggered.", "warn");
      addLog("Waiting for new container to initialize...", "info");
      
      if (apiEnv === "hf") {
        await new Promise(r => setTimeout(r, 5000));
      }

      await waitForReadiness();
      await refetchStats();
      qc.invalidateQueries();
      
      addLog(`Database environment successfully transitioned to ${id}.`, "success");
    } catch (err) {
      addLog(`Database failover failed: ${err instanceof Error ? err.message : String(err)}`, "error");
    } finally {
      setFrozen(false);
    }
  };

  const apiOptions: ConfigOption[] = [
    {
      id: "local",
      label: "Local Development Server",
      description: "Direct connection to localhost:8000.",
      icon: <Server className="w-5 h-5" />,
    },
    {
      id: "hf",
      label: "Hugging Face Spaces",
      description: "Production API proxy over HF spaces.",
      icon: <Cloud className="w-5 h-5" />,
    },
  ];

  const dbOptions: ConfigOption[] = [
    {
      id: "supabase",
      label: "Supabase (Session Pooler)",
      description: "Remote PostgreSQL with pgBouncer IPv4 proxy.",
      icon: <Database className="w-5 h-5" />,
    },
    {
      id: "alpine",
      label: "Alpine PostgreSQL Container",
      description: "Local database instance running via supervisord.",
      icon: <HardDrive className="w-5 h-5" />,
    },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <OrchestrationOverlay />
      <KeepAliveDrawer open={isKeepAliveOpen} onClose={() => setKeepAliveOpen(false)} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[color:var(--border-secondary)] pb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <h1 className="face-title text-3xl">Infrastructure Health</h1>
          </div>
          <p className="face-helper text-sm">Monitor and orchestrate Spectre cloud infrastructure in real-time.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-[color:var(--bg-secondary)] p-1 rounded-xl border border-[color:var(--border-secondary)]">
          <button 
            onClick={refreshAll}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[color:var(--bg-primary)] transition-all disabled:opacity-50 text-[13px] font-medium"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Orchestration Log Monitor */}
      <div className="glass-strong rounded-[20px] shadow-lg overflow-hidden border border-blue-500/10">
        <div className="px-5 py-3 bg-black/40 border-b border-[color:var(--border-secondary)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-green-500" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-green-500/80">Orchestration Log</span>
          </div>
          <button onClick={clearLogs} className="p-1 hover:text-red-400 transition-colors" title="Clear logs">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-4 bg-black/20 h-[120px] overflow-y-auto font-mono text-[11px] flex flex-col-reverse gap-1.5 scrollbar-thin">
          <div ref={logEndRef} />
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-1">
              <span className="text-[color:var(--label-tertiary)] shrink-0">
                [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
              </span>
              <span className={`
                ${log.type === "success" ? "text-green-400" : ""}
                ${log.type === "error" ? "text-red-400" : ""}
                ${log.type === "warn" ? "text-yellow-400" : ""}
                ${log.type === "info" ? "text-blue-400" : ""}
              `}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-strong rounded-[20px] p-6 flex flex-col gap-4 shadow-sm border border-white/5">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            {health ? (
              <Badge variant="outline" className={getStatusColor(health.status)}>
                {health.status.toUpperCase()}
              </Badge>
            ) : <Spinner />}
          </div>
          <div>
            <p className="text-xs font-mono text-[color:var(--label-tertiary)] uppercase tracking-wider">System Status</p>
            <h3 className="text-xl font-medium mt-1">Hugging Face Space</h3>
          </div>
          <div className="mt-2 flex flex-col gap-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[color:var(--label-secondary)]">Version</span>
              <span className="text-[color:var(--label-primary)]">{health?.version || "---"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[color:var(--label-secondary)]">Uptime</span>
              <span className="text-[color:var(--label-primary)]">Proactive (20h Cycle)</span>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-[20px] p-6 flex flex-col gap-4 shadow-sm border border-white/5">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Database className="w-5 h-5 text-purple-500" />
            </div>
            {health ? (
              <Badge variant="outline" className={getStatusColor(health.components.database)}>
                {health.components.database.toUpperCase()}
              </Badge>
            ) : <Spinner />}
          </div>
          <div>
            <p className="text-xs font-mono text-[color:var(--label-tertiary)] uppercase tracking-wider">Storage Layer</p>
            <h3 className="text-xl font-medium mt-1">Active Database</h3>
          </div>
          <div className="mt-2 flex flex-col gap-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[color:var(--label-secondary)]">Engine</span>
              <span className="text-[color:var(--label-primary)]">PostgreSQL 17</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[color:var(--label-secondary)]">Target</span>
              <span className="text-[color:var(--label-primary)] truncate max-w-[150px]" title={stats?.active_db}>
                {stats?.active_db || "---"}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-[20px] p-6 flex flex-col gap-4 shadow-sm border border-white/5">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Cpu className="w-5 h-5 text-orange-500" />
            </div>
            {health ? (
              <Badge variant="outline" className={getStatusColor(health.components.ml_model)}>
                {health.components.ml_model === "loaded" ? "LOADED" : "OFFLINE"}
              </Badge>
            ) : <Spinner />}
          </div>
          <div>
            <p className="text-xs font-mono text-[color:var(--label-tertiary)] uppercase tracking-wider">Inference Engine</p>
            <h3 className="text-xl font-medium mt-1">ML Model</h3>
          </div>
          <div className="mt-2 flex flex-col gap-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[color:var(--label-secondary)]">Framework</span>
              <span className="text-[color:var(--label-primary)]">TensorFlow</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[color:var(--label-secondary)]">Status</span>
              <span className="text-[color:var(--label-primary)]">Ready for Scan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Switchers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ConfigSwitcher
          title="API Target Environment"
          description="Route frontend requests to different backend environments."
          icon={<Box className="w-5 h-5" />}
          options={apiOptions}
          activeId={apiEnv}
          onChange={handleApiSwitch}
        />
        
        <ConfigSwitcher
          title="Database Environment"
          description="Dynamically switch the backend's active storage layer."
          icon={<HardDrive className="w-5 h-5" />}
          options={dbOptions}
          activeId={stats?.active_db === "supabase" ? "supabase" : "alpine"}
          onChange={handleDbSwitch}
        />
      </div>

      {/* Keep-Alive Section */}
      <div className="glass-strong rounded-[20px] shadow-sm overflow-hidden border border-white/5">
        <div className="p-6 border-b border-[color:var(--border-secondary)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h2 className="font-medium text-lg">Keep-Alive Heartbeats</h2>
          </div>
          <button 
            onClick={() => setKeepAliveOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[color:var(--bg-secondary)] hover:bg-[color:var(--bg-primary)] transition-all border border-[color:var(--border-secondary)] text-[11px] font-medium group"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Manage Engine</span>
            <ChevronRight className="w-3 h-3 opacity-50 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[color:var(--bg-secondary)] text-[11px] font-mono uppercase tracking-widest text-[color:var(--label-tertiary)]">
                <th className="px-6 py-3 font-medium">Timestamp</th>
                <th className="px-6 py-3 font-medium">Log Origin</th>
                <th className="px-6 py-3 font-medium">Target Service</th>
                <th className="px-6 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border-secondary)]">
              {stats?.heartbeats.map((hb) => (
                <tr key={hb.id} className="hover:bg-[color:var(--bg-secondary)]/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-[color:var(--label-primary)]">
                    {new Date(hb.pinged_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 rounded bg-[color:var(--bg-secondary)] text-[color:var(--label-secondary)] font-mono text-[11px] uppercase tracking-wider">
                      {hb.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-[color:var(--label-tertiary)]">
                    <div className="flex items-center gap-2">
                       {hb.source === "github-actions" ? <Database className="w-3 h-3" /> : <Server className="w-3 h-3" />}
                       <span>{hb.source === "github-actions" ? "Supabase Table Ping" : "Hugging Face /health"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-green-500 text-xs font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Captured
                    </div>
                  </td>
                </tr>
              ))}
              {!stats?.heartbeats.length && !loadingStats && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[color:var(--label-tertiary)] font-mono text-sm">
                    No heartbeat records found in current storage layer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-[color:var(--label-tertiary)] opacity-60">
        <LayoutDashboard className="w-3 h-3" />
        <span>Spectre Admin Protocol &bull; Server Time: {stats?.server_time ? new Date(stats.server_time).toUTCString() : "---"}</span>
      </div>
    </div>
  );
}
