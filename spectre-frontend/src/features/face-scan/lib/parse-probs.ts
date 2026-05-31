import { FAS_CLASSES, type FasClass } from "../model/constants";
import type { ScanSummary } from "../model/types";

const EXPECTED_LENGTH = 6;

function toNumberArray(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length !== EXPECTED_LENGTH) return null;
  const nums = value.map((v) => (typeof v === "number" ? v : parseFloat(String(v))));
  if (nums.some((n) => Number.isNaN(n))) return null;
  return nums;
}

export function parseSummary(probs: unknown): ScanSummary {
  const arr = toNumberArray(probs);
  if (!arr) return { live: 1.0, spoof: 0.0 };
  const live = arr[5];
  return { live, spoof: 1.0 - live };
}

export function parseDetail(probs: unknown): Record<FasClass, number> | null {
  const arr = toNumberArray(probs);
  if (!arr) return null;
  const result = {} as Record<FasClass, number>;
  FAS_CLASSES.forEach((cls, i) => {
    result[cls] = arr[i];
  });
  return result;
}
