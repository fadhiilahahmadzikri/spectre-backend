import { AnimatePresence, motion } from "framer-motion";
import { MODE_REGISTER } from "../../model/constants";
import type { ScanMode } from "../../model/types";

interface ModeIndicatorProps {
  visible: boolean;
  mode: ScanMode;
  top?: number;
}

export function ModeIndicator({ visible, mode, top = 88 }: ModeIndicatorProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="mode-badge"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mode-toggle-row"
          style={{ top }}
        >
          <div className={`mode-indicator ${mode === MODE_REGISTER ? "is-register" : "is-verify"}`}>
            {mode === MODE_REGISTER ? "Enrollment" : "Verification"}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
