import { describe, it, expect } from "vitest";
import { parseSummary, parseDetail } from "../lib/parse-probs";
import { FAS_CLASSES } from "../model/constants";

describe("parseSummary", () => {
  it("extracts live/spoof from index 5 of a 6-element array", () => {
    const summary = parseSummary([0.1, 0.05, 0.02, 0.03, 0.0, 0.8]);
    expect(summary.live).toBeCloseTo(0.8, 5);
    expect(summary.spoof).toBeCloseTo(0.2, 5);
  });

  it("parses string numbers", () => {
    const summary = parseSummary(["0.1", "0.05", "0.02", "0.03", "0.0", "0.8"]);
    expect(summary.live).toBeCloseTo(0.8, 5);
  });

  it("returns safe default for malformed input", () => {
    expect(parseSummary(null)).toEqual({ live: 1.0, spoof: 0.0 });
    expect(parseSummary([0.1, 0.9])).toEqual({ live: 1.0, spoof: 0.0 });
    expect(parseSummary([1, 2, 3, 4, 5, "not-a-number"])).toEqual({ live: 1.0, spoof: 0.0 });
  });
});

describe("parseDetail", () => {
  it("maps each FAS class to the corresponding probability index", () => {
    const probs = [0.1, 0.2, 0.3, 0.15, 0.05, 0.2];
    const detail = parseDetail(probs);
    expect(detail).not.toBeNull();
    FAS_CLASSES.forEach((cls, i) => {
      expect(detail![cls]).toBeCloseTo(probs[i], 5);
    });
  });

  it("returns null for malformed input", () => {
    expect(parseDetail(undefined)).toBeNull();
    expect(parseDetail([0.1, 0.9])).toBeNull();
  });
});
