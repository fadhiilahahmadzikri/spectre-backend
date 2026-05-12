import { motion } from "framer-motion";
import { FaceIDGlyph, MoreVertIcon, CloseIcon } from "@/shared/icons";

interface ScanningHeaderProps {
  opacity?: number;
  onOpenConfig: () => void;
  onClose?: () => void;
}

export function ScanningHeader({ opacity = 1, onOpenConfig, onClose }: ScanningHeaderProps) {
  return (
    <motion.header
      className="scanning-header"
      animate={{ opacity }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {onClose ? (
        <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </button>
      ) : (
        <div className="w-9" />
      )}
      <div className="scanning-center-brand">
        <div style={{ color: "rgba(255,255,255,0.80)" }}>
          <FaceIDGlyph size={20} />
        </div>
        <div className="face-title" style={{ fontSize: 12 }}>
          Spectre
        </div>
      </div>
      <button
        type="button"
        className="icon-btn"
        aria-label="Open settings"
        onClick={onOpenConfig}
      >
        <MoreVertIcon />
      </button>
    </motion.header>
  );
}
