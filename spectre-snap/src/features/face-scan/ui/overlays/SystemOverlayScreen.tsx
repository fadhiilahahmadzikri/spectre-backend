import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

interface SystemOverlayScreenProps {
  visible: boolean;
  spinner?: boolean;
  icon?: ReactNode;
  title: string;
  subtitle?: string;
}

export function SystemOverlayScreen({
  visible,
  spinner = false,
  icon,
  title,
  subtitle,
}: SystemOverlayScreenProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {spinner ? <div className="gate-spinner mb-4" /> : icon}
          <div
            className="text-white text-[16px] font-semibold mt-2 text-center"
            style={{ letterSpacing: "-0.01em" }}
          >
            {title}
          </div>
          {subtitle && (
            <div className="text-white/60 text-[13px] mt-1.5 text-center">{subtitle}</div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
