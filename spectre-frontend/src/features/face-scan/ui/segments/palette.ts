import { IQA_STATE, PHASES } from "../../model/constants";
import type { IqaState, Phase } from "../../model/types";

export interface SegmentPalette {
  dynamicFrameColor: string;
  segBase: string;
  segReveal: string;
  segActive: string;
}

const DEFAULT_PALETTE: SegmentPalette = {
  dynamicFrameColor: "rgba(255,255,255,0.88)",
  segBase: "rgba(255,255,255,0.12)",
  segReveal: "rgba(255,255,255,0.3)",
  segActive: "#ffffff",
};

const SUCCESS_PALETTE: SegmentPalette = {
  dynamicFrameColor: "rgba(52,211,153,1)",
  segBase: "rgba(52,211,153,0.5)",
  segReveal: "rgba(52,211,153,0.8)",
  segActive: "rgba(52,211,153,1)",
};

const FAILURE_PALETTE: SegmentPalette = {
  dynamicFrameColor: "rgba(248,113,113,1)",
  segBase: "rgba(248,113,113,0.5)",
  segReveal: "rgba(248,113,113,0.8)",
  segActive: "rgba(248,113,113,1)",
};

const CAPTURE_PALETTE: SegmentPalette = {
  dynamicFrameColor: "rgba(52,211,153,0.95)",
  segBase: "rgba(52,211,153,0.2)",
  segReveal: "rgba(52,211,153,0.5)",
  segActive: "#ffffff",
};

const READY_PALETTE: SegmentPalette = {
  dynamicFrameColor: "rgba(52,211,153,0.95)",
  segBase: "rgba(52,211,153,0.2)",
  segReveal: "rgba(52,211,153,0.5)",
  segActive: "rgba(52,211,153,0.95)",
};

const WARN_PALETTE: SegmentPalette = {
  dynamicFrameColor: "rgba(251,191,36,0.95)",
  segBase: "rgba(251,191,36,0.25)",
  segReveal: "rgba(251,191,36,0.6)",
  segActive: "rgba(251,191,36,0.95)",
};

const SCANNING_NO_FACE_PALETTE: SegmentPalette = {
  dynamicFrameColor: "rgba(248,113,113,0.85)",
  segBase: "rgba(248,113,113,0.25)",
  segReveal: "rgba(248,113,113,0.5)",
  segActive: "rgba(248,113,113,0.95)",
};

export function resolveSegmentPalette(phase: Phase, iqaState: IqaState): SegmentPalette {
  if (phase === PHASES.COMPLETE) return SUCCESS_PALETTE;
  if (phase === PHASES.FAILED) return FAILURE_PALETTE;
  if (
    phase === PHASES.CAPTURING ||
    phase === PHASES.PREVIEW ||
    phase === PHASES.ANALYZING
  ) {
    return CAPTURE_PALETTE;
  }

  if (
    phase === PHASES.SEARCHING ||
    phase === PHASES.MORPHING ||
    phase === PHASES.SCANNING
  ) {
    if (iqaState === IQA_STATE.NO_FACE) {
      if (phase === PHASES.SCANNING) return SCANNING_NO_FACE_PALETTE;
      return { ...DEFAULT_PALETTE, dynamicFrameColor: "rgba(255,255,255,0.4)" };
    }
    if (iqaState === IQA_STATE.READY) return READY_PALETTE;
    return WARN_PALETTE;
  }

  return DEFAULT_PALETTE;
}
