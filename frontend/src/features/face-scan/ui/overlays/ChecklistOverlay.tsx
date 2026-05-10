import { motion } from "framer-motion";
import { AnimatedStatusIcon } from "./AnimatedStatusIcon";

interface ChecklistOverlayProps {
  kind: "success" | "spoof" | "error" | null;
}

const TRANSITION = { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const };

export function ChecklistOverlay({ kind }: ChecklistOverlayProps) {
  if (!kind) return null;

  if (kind === "success") {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={TRANSITION}
          className="flex flex-col items-center gap-3 drop-shadow-2xl"
        >
          <AnimatedStatusIcon
            type="success"
            size={100}
            circleFill="rgba(52,211,153,0.15)"
            strokeWidth={5}
            style={{ filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.4))" }}
          />
          <div
            className="text-white text-base font-semibold tracking-tight"
            style={{
              letterSpacing: "-0.01em",
              textShadow: "0 2px 4px rgba(0,0,0,0.8)",
            }}
          >
            Identitas Terverifikasi
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={TRANSITION}
        className="flex flex-col items-center gap-3 drop-shadow-2xl"
      >
        <AnimatedStatusIcon
          type="error"
          size={100}
          circleFill="rgba(248,113,113,0.15)"
          strokeWidth={5}
          style={{ filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.4))" }}
        />
        <div
          className="text-white text-base font-semibold tracking-tight"
          style={{
            color: "#ff9090",
            letterSpacing: "-0.01em",
            textShadow: "0 2px 4px rgba(0,0,0,0.8)",
          }}
        >
          {kind === "spoof" ? "Spoofing Terdeteksi" : "Tidak Dikenali"}
        </div>
      </motion.div>
    </div>
  );
}
