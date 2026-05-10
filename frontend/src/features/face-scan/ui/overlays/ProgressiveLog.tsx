import { AnimatePresence, motion } from "framer-motion";
import type { LogEntry } from "../../model/types";

interface ProgressiveLogProps {
  log: LogEntry | null;
  visible: boolean;
}

export function ProgressiveLog({ log, visible }: ProgressiveLogProps) {
  return (
    <div
      className="log-replacement-container"
      style={{ transition: "opacity 300ms ease", opacity: visible ? 1 : 0 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {log && (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{
              opacity: log.fading ? 0.45 : 1,
              y: 0,
              filter: "blur(0px)",
              x: log.kind === "warn" || log.kind === "err" ? [-4, 4, -2, 2, 0] : 0,
            }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={`log-entry ${log.kind ? `is-${log.kind}` : ""}`}
          >
            <span className="dot" />
            <span>{log.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
