import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Activity } from "lucide-react";
import type { Phase } from "../../model/types";
import { PHASES } from "../../model/constants";

interface LiveStatusOverlayProps {
  phase: Phase;
  detailMode: boolean;
  benchmarkMode: boolean;
}

const PHASE_LABELS: Partial<Record<Phase, string>> = {
  [PHASES.SEARCHING]: "Detecting face…",
  [PHASES.MORPHING]: "Preparing capture…",
  [PHASES.SCANNING]: "Scanning…",
  [PHASES.ANALYZING]: "Running inference…",
  [PHASES.COMPLETE]: "Complete",
  [PHASES.FAILED]: "Failed",
};

export function LiveStatusOverlay({ phase, detailMode, benchmarkMode }: LiveStatusOverlayProps) {
  const { data } = useQuery({
    queryKey: ["ml-status"],
    queryFn: ({ signal }) => api.getMlStatus({ signal }),
    staleTime: 60_000,
    retry: false,
  });

  if (!detailMode && !benchmarkMode) return null;

  const phaseLabel = PHASE_LABELS[phase] ?? phase;
  const modelId = data?.active_model?.model_id ?? "…";

  return (
    <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/70 backdrop-blur-sm border border-white/[0.08] shadow-lg">
        <Activity size={12} className="text-indigo-400 animate-pulse" />
        <div className="flex flex-col">
          <span className="text-[10px] text-white font-medium">{phaseLabel}</span>
          <span className="text-[9px] text-[color:var(--label-tertiary)]">
            {benchmarkMode ? `benchmark • ${data?.benchmark_models?.length ?? 0} models` : `model: ${modelId}`}
            {detailMode && " • detail trace"}
          </span>
        </div>
      </div>
    </div>
  );
}
