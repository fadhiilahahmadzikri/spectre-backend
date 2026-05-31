import { AnimatePresence, motion } from "framer-motion";

interface CaptureFlashProps {
  visible: boolean;
  borderRadius?: number;
}

export function CaptureFlash({ visible, borderRadius = 130 }: CaptureFlashProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, times: [0, 0.15, 1] }}
          className="absolute inset-0 bg-white z-[60] pointer-events-none"
          style={{ borderRadius }}
        />
      )}
    </AnimatePresence>
  );
}
