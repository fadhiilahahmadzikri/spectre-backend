import { useOrchestrationStore } from "@/lib/store";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Terminal, ShieldAlert } from "lucide-react";

export function OrchestrationOverlay() {
  const { isFrozen, freezeReason, logs } = useOrchestrationStore();

  return (
    <Dialog open={isFrozen}>
      <DialogContent 
        className="sm:max-w-[480px] bg-black/80 backdrop-blur-2xl border-white/10 shadow-2xl scanner-dialog"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-col items-center gap-6 py-8">
          <div className="relative">
            {/* Pulsing Aura Animation */}
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse scale-150" />
            <div className="gate-icon-ring relative z-10 border-blue-500/20">
               <ShieldAlert className="w-8 h-8 text-blue-500 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1">
               <Spinner />
            </div>
          </div>
          
          <div className="text-center space-y-2 relative z-10">
            <DialogTitle className="face-title text-2xl tracking-tight">
              {freezeReason}
            </DialogTitle>
            <DialogDescription className="face-helper text-sm max-w-[300px] mx-auto text-blue-200/60">
              Synchronizing infrastructure state. The application is temporarily frozen to prevent data desync.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5 bg-white/5 flex items-center gap-2">
            <Terminal className="w-3 h-3 text-green-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-green-400/80">Real-time Orchestration Sync</span>
          </div>
          <div className="p-4 h-[140px] overflow-y-auto font-mono text-[11px] flex flex-col-reverse gap-2 scrollbar-thin">
            {logs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex gap-3 opacity-90 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-white/20 shrink-0 select-none">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className={`
                  ${log.type === "success" ? "text-green-400" : ""}
                  ${log.type === "error" ? "text-red-400" : ""}
                  ${log.type === "warn" ? "text-yellow-400" : ""}
                  ${log.type === "info" ? "text-blue-300" : ""}
                `}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="py-2 text-center">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] animate-pulse">
            Waiting for server readiness...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
