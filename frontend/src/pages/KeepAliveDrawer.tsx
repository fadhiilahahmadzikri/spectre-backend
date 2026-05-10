import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassDrawer, GlassDrawerHeader } from "@/shared/ui/GlassDrawer";
import { Spinner } from "@/components/ui/spinner";
import { Activity, Box, Clock, ExternalLink, ShieldCheck } from "lucide-react";
import { HuggingFaceIcon, SupabaseIcon } from "@/shared/icons";

interface KeepAliveDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function KeepAliveDrawer({ open, onClose }: KeepAliveDrawerProps) {
  const { data: status, isLoading } = useQuery({
    queryKey: ["automation-status"],
    queryFn: () => api.getAutomationStatus(),
    enabled: open,
  });

  return (
    <GlassDrawer open={open} onClose={onClose} title="Keep-Alive Engine">
      <GlassDrawerHeader
        icon={<Activity className="w-5 h-5 text-blue-500" />}
        title="Keep-Alive Engine"
        subtitle="GitHub Actions"
        onClose={onClose}
      />

      <div className="overflow-y-auto px-6 py-6 flex flex-col gap-6 pb-12">
        {isLoading ? (
          <div className="py-12 flex justify-center"><Spinner /></div>
        ) : status?.error ? (
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 text-xs font-mono">
            {status.error}
          </div>
        ) : (
          <>
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="eyebrow">Workflow</div>
                <span className={`text-[11px] font-mono font-medium ${status?.conclusion === "success" ? "text-green-500" : status?.status === "in_progress" ? "text-blue-400 animate-pulse" : "text-red-400"}`}>
                  {status?.status === "in_progress" ? "RUNNING" : status?.conclusion?.toUpperCase() || "UNKNOWN"}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <InfoRow icon={<Box className="w-4 h-4" />} label="Name" value={status?.workflow} href={status?.html_url} />
                <InfoRow icon={<Clock className="w-4 h-4" />} label="Last run" value={status?.last_run_at ? new Date(status.last_run_at).toLocaleString() : "Never"} />
                <InfoRow icon={<ShieldCheck className="w-4 h-4" />} label="Schedule" value={status?.cron_interval} />
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <div className="eyebrow">Targets</div>
              <TargetRow icon={<HuggingFaceIcon size={16} />} label="Hugging Face Space" detail="/health" />
              <TargetRow icon={<SupabaseIcon size={16} />} label="Supabase Database" detail="keepalive_ping" />
            </section>
          </>
        )}
      </div>
    </GlassDrawer>
  );
}

function InfoRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value?: string; href?: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <div className="flex items-center gap-3">
        <span className="text-[color:var(--label-tertiary)]">{icon}</span>
        <div>
          <p className="text-[12px] font-medium text-[color:var(--label-primary)]">{label}</p>
          <p className="kbd-mono text-[10px]">{value || "---"}</p>
        </div>
      </div>
      {href && (
        <a href={href} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-[color:var(--label-tertiary)]">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

function TargetRow({ icon, label, detail }: { icon: React.ReactNode; label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-[13px] font-medium text-[color:var(--label-primary)]">{label}</span>
      </div>
      <span className="kbd-mono text-[10px]">{detail}</span>
    </div>
  );
}
