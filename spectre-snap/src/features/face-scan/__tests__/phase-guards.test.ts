import { describe, it, expect } from "vitest";
import {
  isActivePhase,
  isCanvasPhase,
  isCirclePhase,
  isIqaPhase,
  isMorphingPhase,
  isSquarePhase,
  isTerminalPhase,
  isVignettePhase,
} from "../lib/phase-guards";
import { PHASES } from "../model/constants";

describe("phase-guards", () => {
  it("isCanvasPhase covers SEARCHING through ANALYZING", () => {
    expect(isCanvasPhase(PHASES.SEARCHING)).toBe(true);
    expect(isCanvasPhase(PHASES.MORPHING)).toBe(true);
    expect(isCanvasPhase(PHASES.SCANNING)).toBe(true);
    expect(isCanvasPhase(PHASES.CAPTURING)).toBe(true);
    expect(isCanvasPhase(PHASES.PREVIEW)).toBe(true);
    expect(isCanvasPhase(PHASES.ANALYZING)).toBe(true);
    expect(isCanvasPhase(PHASES.LOADING)).toBe(false);
    expect(isCanvasPhase(PHASES.COMPLETE)).toBe(false);
  });

  it("isVignettePhase starts at SCANNING and includes terminal phases", () => {
    expect(isVignettePhase(PHASES.SCANNING)).toBe(true);
    expect(isVignettePhase(PHASES.COMPLETE)).toBe(true);
    expect(isVignettePhase(PHASES.FAILED)).toBe(true);
    expect(isVignettePhase(PHASES.SEARCHING)).toBe(false);
    expect(isVignettePhase(PHASES.LOADING)).toBe(false);
  });

  it("isTerminalPhase only covers COMPLETE and FAILED", () => {
    expect(isTerminalPhase(PHASES.COMPLETE)).toBe(true);
    expect(isTerminalPhase(PHASES.FAILED)).toBe(true);
    expect(isTerminalPhase(PHASES.SCANNING)).toBe(false);
  });

  it("isActivePhase covers CAPTURING and ANALYZING", () => {
    expect(isActivePhase(PHASES.CAPTURING)).toBe(true);
    expect(isActivePhase(PHASES.ANALYZING)).toBe(true);
    expect(isActivePhase(PHASES.SCANNING)).toBe(false);
  });

  it("isIqaPhase covers the IQA-gated phases", () => {
    expect(isIqaPhase(PHASES.SEARCHING)).toBe(true);
    expect(isIqaPhase(PHASES.MORPHING)).toBe(true);
    expect(isIqaPhase(PHASES.SCANNING)).toBe(true);
    expect(isIqaPhase(PHASES.CAPTURING)).toBe(true);
    expect(isIqaPhase(PHASES.LOADING)).toBe(false);
    expect(isIqaPhase(PHASES.COMPLETE)).toBe(false);
  });

  it("isSquarePhase covers LOADING and SEARCHING", () => {
    expect(isSquarePhase(PHASES.LOADING)).toBe(true);
    expect(isSquarePhase(PHASES.SEARCHING)).toBe(true);
    expect(isSquarePhase(PHASES.MORPHING)).toBe(false);
  });

  it("isMorphingPhase only matches MORPHING", () => {
    expect(isMorphingPhase(PHASES.MORPHING)).toBe(true);
    expect(isMorphingPhase(PHASES.SEARCHING)).toBe(false);
  });

  it("isCirclePhase is the complement of square + morphing", () => {
    expect(isCirclePhase(PHASES.SCANNING)).toBe(true);
    expect(isCirclePhase(PHASES.CAPTURING)).toBe(true);
    expect(isCirclePhase(PHASES.COMPLETE)).toBe(true);
    expect(isCirclePhase(PHASES.LOADING)).toBe(false);
    expect(isCirclePhase(PHASES.MORPHING)).toBe(false);
  });
});
