import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { 
  Box, 
  Clock, 
  ExternalLink, 
  Activity, 
  ShieldCheck,
  Server,
  Database
} from "lucide-react";

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

  const getStatusBadge = (s: string, c: string) => {
    if (s === "in_progress") return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse">Running</Badge>;
    if (c === "success") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Success</Badge>;
    if (c === "failure") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
    return <Badge variant="outline">{s || "Unknown"}</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-md bg-[color:var(--bg-elev)] border-[color:var(--border-primary)] shadow-2xl overflow-y-auto">
        <SheetHeader className="text-left space-y-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl w-fit border border-blue-500/20">
            <Activity className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <SheetTitle className="face-title text-2xl">Keep-Alive Engine</SheetTitle>
            <SheetDescription className="face-helper text-sm">
              Configuration and real-time status of GitHub Actions orchestration.
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="mt-8 space-y-8 pb-12">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <Spinner />
              <p className="text-xs font-mono text-[color:var(--label-tertiary)] uppercase tracking-widest">Fetching GHA Metadata...</p>
            </div>
          ) : status?.error ? (
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 text-xs font-mono">
              {status.error}
            </div>
          ) : (
            <>
              {/* GitHub Workflow Info */}
              <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between">
                   <h3 className="section-label">GitHub Automation</h3>
                   {status && getStatusBadge(status.status, status.conclusion)}
                </div>
                
                <div className="glass-strong rounded-2xl p-5 space-y-4 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/5">
                        <Box className="w-4 h-4 text-white/60" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[color:var(--label-primary)]">Workflow Name</p>
                        <p className="text-[11px] font-mono text-[color:var(--label-tertiary)]">{status?.workflow}</p>
                      </div>
                    </div>
                    <a 
                      href={status?.html_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2 rounded-lg hover:bg-white/5 transition-colors text-blue-400"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <Separator className="bg-white/5" />

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5">
                      <Clock className="w-4 h-4 text-white/60" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[color:var(--label-primary)]">Last Sync Cycle</p>
                      <p className="text-[11px] font-mono text-[color:var(--label-tertiary)]">
                        {status?.last_run_at ? new Date(status.last_run_at).toLocaleString() : "Never"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5">
                      <ShieldCheck className="w-4 h-4 text-white/60" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[color:var(--label-primary)]">Cron Schedule</p>
                      <p className="text-[11px] font-mono text-[color:var(--label-tertiary)]">{status?.cron_interval}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Orchestration Targets */}
              <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                <h3 className="section-label">Target Infrastructure</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <Server className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium">Hugging Face Space</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono border-blue-500/20 text-blue-400">/health (200 OK)</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium">Supabase Database</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono border-purple-500/20 text-purple-400">keepalive_ping (POST)</Badge>
                  </div>
                </div>
              </section>

              {/* Technical Overview */}
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <p className="text-[11px] leading-relaxed text-blue-200/50 italic">
                  The Keep-Alive engine prevents free-tier dormancy by simulating traffic every 20 hours. 
                  If the repository remains idle for 50 days, an automated empty commit is triggered 
                  to prevent GitHub from disabling the workflow.
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
