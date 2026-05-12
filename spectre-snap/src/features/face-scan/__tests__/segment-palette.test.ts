import { describe, it, expect } from "vitest";
import { resolveSegmentPalette } from "../ui/segments/palette";
import { IQA_STATE, PHASES } from "../model/constants";

describe("resolveSegmentPalette", () => {
  it("returns the success palette when COMPLETE", () => {
    const p = resolveSegmentPalette(PHASES.COMPLETE, IQA_STATE.READY);
    expect(p.dynamicFrameColor).toBe("rgba(52,211,153,1)");
  });

  it("returns the failure palette when FAILED", () => {
    const p = resolveSegmentPalette(PHASES.FAILED, IQA_STATE.READY);
    expect(p.dynamicFrameColor).toBe("rgba(248,113,113,1)");
  });

  it("returns the capture palette during CAPTURING/PREVIEW/ANALYZING", () => {
    for (const phase of [PHASES.CAPTURING, PHASES.PREVIEW, PHASES.ANALYZING] as const) {
      const p = resolveSegmentPalette(phase, IQA_STATE.READY);
      expect(p.dynamicFrameColor).toBe("rgba(52,211,153,0.95)");
    }
  });

  it("returns warn palette when IQA is non-ready/non-no_face during scan phases", () => {
    const p = resolveSegmentPalette(PHASES.SCANNING, IQA_STATE.BLURRY);
    expect(p.dynamicFrameColor).toBe("rgba(251,191,36,0.95)");
  });

  it("returns ready palette when IQA is READY during scan phases", () => {
    const p = resolveSegmentPalette(PHASES.SCANNING, IQA_STATE.READY);
    expect(p.dynamicFrameColor).toBe("rgba(52,211,153,0.95)");
  });

  it("shows red-tinted no-face palette during SCANNING when no face", () => {
    const p = resolveSegmentPalette(PHASES.SCANNING, IQA_STATE.NO_FACE);
    expect(p.dynamicFrameColor).toBe("rgba(248,113,113,0.85)");
  });

  it("returns default palette during LOADING", () => {
    const p = resolveSegmentPalette(PHASES.LOADING, IQA_STATE.NO_FACE);
    expect(p.dynamicFrameColor).toBe("rgba(255,255,255,0.88)");
  });
});
