import { motion } from "framer-motion";
import type { ScanResult } from "../../model/types";

interface ResultPanelProps {
  result: ScanResult | null;
  onReset: () => void;
  redirectIn: number | null;
}

export function ResultPanel({ result, onReset, redirectIn }: ResultPanelProps) {
  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 22 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-3 mx-auto w-full max-w-[420px]"
    >
      <div className="flex gap-2 items-center">
        <button type="button" className="btn-ghost flex-1" onClick={onReset}>
          Pindai Ulang
        </button>
        {typeof redirectIn === "number" && (
          <div className="flex-1 flex items-center justify-center kbd-mono">
            Mengalihkan {redirectIn}s
          </div>
        )}
      </div>
    </motion.div>
  );
}
