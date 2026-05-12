import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Activity } from "lucide-react";
import { api } from "@/lib/api";
import type { Phase } from "../../model/types";
import { PHASES } from "../../model/constants";

interface LiveStatusOverlayProps {
  phase: Phase;
  detailMode: boolean;
  benchmarkMode: boolean;
  /**
   * When false, the pill slides out of the bottom edge and unmounts. Parent
   * sets this to false as soon as the ResultPanel is about to take over the
   * bottom of the scanner, so the two never stack.
   */
  visible: boolean;
}

const PHASE_LABELS: Partial<Record<Phase, string>> = {
  [PHASES.SEARCHING]: "Detecting face…",
  [PHASES.MORPHING]: "Preparing capture…",
  [PHASES.SCANNING]: "Scanning…",
  [PHASES.ANALYZING]: "Running inference…",
  [PHASES.COMPLETE]: "Complete",
  [PHASES.FAILED]: "Failed",
};

export function LiveStatusOverlay({ phase, detailMode, benchmarkMode, visible }: LiveStatusOverlayProps) {
  const { data } = useQuery({
    queryKey: ["ml-status"],
    queryFn: ({ signal }) => api.getMlStatus({ signal }),
    staleTime: 60_000,
    retry: false,
  });

  const enabled = detailMode || benchmarkMode;
  const phaseLabel = PHASE_LABELS[phase] ?? phase;
  const modelId = data?.active_model?.model_id ?? "…";

  // Lives anchored to the ScannerView's `relative` root (NOT viewport). Sits
  // at bottom-center where it reads as a live-system pill during active
  // phases. When the parent signals that the ResultPanel is arriving (end of
  // a terminal phase), the pill exits by pulling down through the bottom edge
  // and unmounts — the two never share the bottom slot.
  return (
    <AnimatePresence>
      {enabled && visible && (
        <motion.div
          key="live-status-pill"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-1/2 -translate-x-1/2 bottom-6 z-30 pointer-events-none"
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/70 backdrop-blur-sm border border-white/[0.08] shadow-lg">
            <Activity size={12} className="text-indigo-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] text-white font-medium leading-tight">{phaseLabel}</span>
              <span className="text-[9px] text-[color:var(--label-tertiary)] leading-tight">
                {benchmarkMode ? `benchmark • ${data?.benchmark_models?.length ?? 0} models` : `model: ${modelId}`}
                {detailMode && " • detail trace"}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
