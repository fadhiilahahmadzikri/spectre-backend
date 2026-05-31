import { describe, it, expect } from "vitest";
import { computeIQA } from "../lib/compute-iqa";
import { IQA_STATE, IQA_THRESHOLDS, BRIGHTNESS_THRESHOLD } from "../model/constants";
import { buildIqaInput } from "./fixtures";

describe("computeIQA", () => {
  describe("NO_FACE short circuit", () => {
    it("returns NO_FACE when landmarks are null", () => {
      const r = computeIQA(buildIqaInput({ landmarks: null }));
      expect(r.state).toBe(IQA_STATE.NO_FACE);
      expect(r.fails).toEqual([IQA_STATE.NO_FACE]);
    });

    it("returns NO_FACE when landmarks are fewer than 400", () => {
      const r = computeIQA(buildIqaInput({ landmarks: [] }));
      expect(r.state).toBe(IQA_STATE.NO_FACE);
    });

    it("returns NO_FACE when face is far off-center (centerDist > 0.35)", () => {
      const r = computeIQA(buildIqaInput({ face: { center: { x: 0.95, y: 0.95 } } }));
      expect(r.state).toBe(IQA_STATE.NO_FACE);
    });
  });

  describe("READY", () => {
    it("returns READY on a well-lit, centered, sharp face", () => {
      const r = computeIQA(buildIqaInput());
      expect(r.state).toBe(IQA_STATE.READY);
      expect(r.fails).toEqual([]);
    });
  });

  describe("individual failure modes", () => {
    it("LOW_LIGHT when luminance is below threshold", () => {
      const r = computeIQA(buildIqaInput({ luminance: BRIGHTNESS_THRESHOLD - 1 }));
      expect(r.fails).toContain(IQA_STATE.LOW_LIGHT);
    });

    it("BLURRY when blur is below laplacian minimum", () => {
      const r = computeIQA(buildIqaInput({ blur: IQA_THRESHOLDS.BLUR_LAPLACIAN_MIN - 1 }));
      expect(r.fails).toContain(IQA_STATE.BLURRY);
    });

    it("BLURRY when blurDelta exceeds maximum", () => {
      const r = computeIQA(buildIqaInput({ blurDelta: IQA_THRESHOLDS.BLUR_DELTA_MAX + 1 }));
      expect(r.fails).toContain(IQA_STATE.BLURRY);
    });

    it("TOO_FAR when face area is below minimum", () => {
      const r = computeIQA(buildIqaInput({ face: { faceW: 0.05, faceH: 0.05 } }));
      expect(r.fails).toContain(IQA_STATE.TOO_FAR);
    });

    it("TOO_CLOSE when face area exceeds maximum", () => {
      const r = computeIQA(buildIqaInput({ face: { faceW: 0.9, faceH: 0.7 } }));
      expect(r.fails).toContain(IQA_STATE.TOO_CLOSE);
    });

    it("NOT_CENTERED when drift exceeds CENTER_TOLERANCE but within rejection radius", () => {
      const r = computeIQA(buildIqaInput({ face: { center: { x: 0.72, y: 0.5 } } }));
      expect(r.fails).toContain(IQA_STATE.NOT_CENTERED);
    });

    it("BAD_POSE when yaw exceeds max", () => {
      const r = computeIQA(buildIqaInput({ face: { noseOffset: { x: 0.06, y: 0 } } }));
      expect(r.fails).toContain(IQA_STATE.BAD_POSE);
    });

    it("EYES_CLOSED when ear ratio is below minimum", () => {
      const r = computeIQA(buildIqaInput({ face: { earOpenness: 0 } }));
      expect(r.fails).toContain(IQA_STATE.EYES_CLOSED);
    });

    it("ignorePose drops BAD_POSE from the check set", () => {
      const r = computeIQA(
        buildIqaInput({ face: { noseOffset: { x: 0.08, y: 0 } }, ignorePose: true }),
      );
      expect(r.fails).not.toContain(IQA_STATE.BAD_POSE);
    });
  });

  describe("priority sort of multiple failures", () => {
    it("returns NOT_CENTERED (p=1.5) before LOW_LIGHT (p=2)", () => {
      const r = computeIQA(
        buildIqaInput({
          face: { center: { x: 0.72, y: 0.5 } },
          luminance: BRIGHTNESS_THRESHOLD - 5,
        }),
      );
      expect(r.state).toBe(IQA_STATE.NOT_CENTERED);
      expect(r.fails[0]).toBe(IQA_STATE.NOT_CENTERED);
    });
  });
});
