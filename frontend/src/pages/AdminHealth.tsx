import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ConfigSwitcher, type ConfigOption } from "@/shared/ui/ConfigSwitcher";
import { getBaseUrl, setBaseUrl, resolveEnvName, ENV, type EnvName } from "@/lib/config";
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
  Eye,
  EyeOff,
  Search,
  LockKeyhole
} from "lucide-react";

export function AdminHealth() {
  const qc = useQueryClient();
  const [apiEnv, setApiEnv] = useState<EnvName>(() => resolveEnvName(getBaseUrl()));
  const [showSecrets, setShowSecrets] = useState(false);
  const [envSearch, setEnvSearch] = useState("");

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

  const { data: envVars, isLoading: loadingEnv, refetch: refetchEnv } = useQuery({
    queryKey: ["admin-env"],
    queryFn: () => api.getAdminEnv(),
  });

  const isLoading = loadingHealth || loadingStats || loadingEnv;

  function refreshAll() {
    refetchHealth();
    refetchStats();
    refetchEnv();
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

  const handleApiSwitch = async (id: string) => {
    await new Promise((r) => setTimeout(r, 600));
    const nextUrl = id === "hf" ? ENV.HF_SPACES : ENV.LOCAL;
    setBaseUrl(nextUrl);
    qc.invalidateQueries();
  };

  const handleDbSwitch = async (id: string) => {
    await api.switchDatabase(id);
    await refetchStats();
    qc.invalidateQueries();
  };

  const filteredEnv = envVars ? Object.entries(envVars).filter(([k]) => 
    k.toLowerCase().includes(envSearch.toLowerCase())
  ) : [];

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
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[color:var(--label-primary)]" />
            <h1 className="face-title text-2xl">Infrastructure Health</h1>
          </div>
          <p className="face-helper text-sm">Real-time status of Spectre services and keep-alive orchestration.</p>
        </div>
        <button 
          onClick={refreshAll}
          disabled={isLoading}
          className="btn-ghost p-2 rounded-full hover:bg-[color:var(--bg-secondary)] transition-colors disabled:opacity-50"
          title="Refresh stats"
        >
          <RefreshCcw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-strong rounded-[20px] p-6 flex flex-col gap-4 shadow-sm">
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
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[color:var(--label-secondary)]">Version</span>
              <span className="text-[color:var(--label-primary)]">{health?.version || "---"}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[color:var(--label-secondary)]">Uptime</span>
              <span className="text-[color:var(--label-primary)]">Proactive (20h Cycle)</span>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-[20px] p-6 flex flex-col gap-4 shadow-sm">
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
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[color:var(--label-secondary)]">Engine</span>
              <span className="text-[color:var(--label-primary)]">PostgreSQL 17</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[color:var(--label-secondary)]">Target</span>
              <span className="text-[color:var(--label-primary)] truncate max-w-[150px]" title={stats?.active_db}>
                {stats?.active_db || "---"}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-[20px] p-6 flex flex-col gap-4 shadow-sm">
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
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[color:var(--label-secondary)]">Framework</span>
              <span className="text-[color:var(--label-primary)]">TensorFlow</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[color:var(--label-secondary)]">Status</span>
              <span className="text-[color:var(--label-primary)]">Ready for Scan</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="glass-strong rounded-[20px] shadow-sm overflow-hidden border-[color:var(--border-primary)]">
        <div className="p-6 border-b border-[color:var(--border-secondary)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LockKeyhole className="w-4 h-4 text-orange-500" />
            <h2 className="font-medium text-lg">Environment Audit</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--label-tertiary)]" />
              <input 
                type="text" 
                placeholder="Search keys..." 
                value={envSearch}
                onChange={(e) => setEnvSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 rounded-lg bg-[color:var(--bg-secondary)] border-none text-xs font-mono w-full md:w-[200px] focus:ring-1 focus:ring-blue-500/50 outline-none"
              />
            </div>
            <button 
              onClick={() => setShowSecrets(!showSecrets)}
              className="btn-ghost flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[color:var(--bg-secondary)] hover:bg-[color:var(--bg-primary)] border border-[color:var(--border-secondary)] transition-all"
            >
              {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="text-[11px] font-medium">{showSecrets ? "Hide Values" : "Reveal Values"}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[color:var(--bg-secondary)] text-[11px] font-mono uppercase tracking-widest text-[color:var(--label-tertiary)]">
                <th className="px-6 py-3 font-medium">Variable Key</th>
                <th className="px-6 py-3 font-medium">Active Value (Hugging Face)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border-secondary)]">
              {filteredEnv.map(([key, value]) => (
                <tr key={key} className="hover:bg-[color:var(--bg-secondary)]/30 transition-colors">
                  <td className="px-6 py-3 text-xs font-mono font-semibold text-[color:var(--label-primary)]">
                    {key}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded font-mono text-[11px] break-all ${
                        showSecrets 
                          ? "bg-blue-500/5 text-blue-400 border border-blue-500/10" 
                          : "bg-[color:var(--bg-secondary)] text-[color:var(--label-tertiary)] opacity-40 italic select-none"
                      }`}>
                        {showSecrets ? value : "••••••••••••••••"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredEnv.length && !loadingEnv && (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-[color:var(--label-tertiary)] font-mono text-sm">
                    No matching environment variables found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-[color:var(--bg-secondary)]/50 border-t border-[color:var(--border-secondary)]">
          <p className="text-[10px] text-[color:var(--label-tertiary)] flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-green-500" />
            Values are fetched directly from the Hugging Face runtime (os.environ). Access restricted to Admin role.
          </p>
        </div>
      </div>

      <div className="glass-strong rounded-[20px] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[color:var(--border-secondary)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[color:var(--label-secondary)]" />
            <h2 className="font-medium text-lg">Keep-Alive Heartbeats</h2>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            Sync: 20h Cron
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[color:var(--bg-secondary)] text-[11px] font-mono uppercase tracking-widest text-[color:var(--label-tertiary)]">
                <th className="px-6 py-3 font-medium">Timestamp</th>
                <th className="px-6 py-3 font-medium">Source</th>
                <th className="px-6 py-3 font-medium">Request ID</th>
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
                    <span className="px-2 py-1 rounded bg-[color:var(--bg-secondary)] text-[color:var(--label-secondary)] font-mono text-[11px]">
                      {hb.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-[color:var(--label-tertiary)] truncate max-w-[200px]">
                    {hb.id}
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
                    No heartbeat records found in Supabase.
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
