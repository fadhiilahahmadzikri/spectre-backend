import { describe, it, expect } from "vitest";
import { computeEAR, LEFT_EYE_INDICES, RIGHT_EYE_INDICES } from "../lib/compute-ear";
import { buildLandmarks } from "./fixtures";

describe("computeEAR", () => {
  it("returns a positive ratio for open eyes", () => {
    const landmarks = buildLandmarks({ earOpenness: 1 });
    const ear = computeEAR(landmarks, LEFT_EYE_INDICES);
    expect(ear).toBeGreaterThan(0.2);
    expect(Number.isFinite(ear)).toBe(true);
  });

  it("returns near zero for closed eyes", () => {
    const landmarks = buildLandmarks({ earOpenness: 0 });
    const ear = computeEAR(landmarks, LEFT_EYE_INDICES);
    expect(ear).toBeLessThan(0.02);
  });

  it("is symmetric between left and right indices on a centered face", () => {
    const landmarks = buildLandmarks({ earOpenness: 1 });
    const earL = computeEAR(landmarks, LEFT_EYE_INDICES);
    const earR = computeEAR(landmarks, RIGHT_EYE_INDICES);
    expect(earL).toBeCloseTo(earR, 3);
  });

  it("throws when given fewer than 6 indices", () => {
    const landmarks = buildLandmarks();
    expect(() => computeEAR(landmarks, [1, 2, 3])).toThrow();
  });
});
