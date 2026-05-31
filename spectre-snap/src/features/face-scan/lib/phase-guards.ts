import {
  ACTIVE_PHASES,
  CANVAS_PHASES,
  IQA_PHASES,
  PHASES,
  TERMINAL_PHASES,
  VIGNETTE_PHASES,
} from "../model/constants";
import type { Phase } from "../model/types";

export const isCanvasPhase = (phase: Phase): boolean => CANVAS_PHASES.has(phase);
export const isVignettePhase = (phase: Phase): boolean => VIGNETTE_PHASES.has(phase);
export const isTerminalPhase = (phase: Phase): boolean => TERMINAL_PHASES.has(phase);
export const isActivePhase = (phase: Phase): boolean => ACTIVE_PHASES.has(phase);
export const isIqaPhase = (phase: Phase): boolean => IQA_PHASES.has(phase);

export const isSquarePhase = (phase: Phase): boolean =>
  phase === PHASES.LOADING || phase === PHASES.SEARCHING;

export const isMorphingPhase = (phase: Phase): boolean => phase === PHASES.MORPHING;

export const isCirclePhase = (phase: Phase): boolean =>
  !isSquarePhase(phase) && !isMorphingPhase(phase);
