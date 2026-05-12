import { IQA_STATE, IQA_FEEDBACK } from "../model/constants";
import { getIqaSchema } from "../model/iqa-schema";
import type { IqaResult, IqaState, Landmark } from "../model/types";
import { computeEAR, LEFT_EYE_INDICES, RIGHT_EYE_INDICES } from "./compute-ear";

const MIN_LANDMARKS = 400;
const CENTER_DIST_REJECTION = 0.35;

export interface ComputeIqaInput {
  landmarks: readonly Landmark[] | null;
  luminance: number;
  blur: number;
  blurDelta?: number;
  ignorePose?: boolean;
}

export function computeIQA(input: ComputeIqaInput): IqaResult {
  const { landmarks, luminance, blur, blurDelta = 0, ignorePose = false } = input;

  const hasFace = !!landmarks && landmarks.length >= MIN_LANDMARKS;
  if (!hasFace) {
    return { state: IQA_STATE.NO_FACE, fails: [IQA_STATE.NO_FACE] };
  }

  const leftEar = landmarks[234];
  const rightEar = landmarks[454];
  const top = landmarks[10];
  const bottom = landmarks[152];
  const nose = landmarks[1];

  const cx = (leftEar.x + rightEar.x) / 2;
  const cy = (top.y + bottom.y) / 2;
  const centerDist = Math.hypot(cx - 0.5, cy - 0.5);

  if (centerDist > CENTER_DIST_REJECTION) {
    return { state: IQA_STATE.NO_FACE, fails: [IQA_STATE.NO_FACE] };
  }

  const faceW = Math.abs(rightEar.x - leftEar.x);
  const faceH = Math.abs(bottom.y - top.y);
  const faceArea = faceW * faceH;

  const yaw = Math.abs(nose.x - cx);
  const pitch = Math.abs(nose.y - cy) - faceH * 0.05;

  const earL = computeEAR(landmarks, LEFT_EYE_INDICES);
  const earR = computeEAR(landmarks, RIGHT_EYE_INDICES);
  const ear = (earL + earR) / 2;

  const metrics = {
    hasFace: true,
    centerDist,
    luminance,
    blur,
    blurDelta,
    faceArea,
    yaw,
    pitch,
    ear,
  };

  const schema = getIqaSchema(ignorePose);
  const result = schema.safeParse(metrics);

  if (result.success) {
    return { state: IQA_STATE.READY, fails: [] };
  }

  const unique = Array.from(new Set(result.error.issues.map((i) => i.message as IqaState)));
  unique.sort((a, b) => IQA_FEEDBACK[a].p - IQA_FEEDBACK[b].p);
  return { state: unique[0], fails: unique };
}
