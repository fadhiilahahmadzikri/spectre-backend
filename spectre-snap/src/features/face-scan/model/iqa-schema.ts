import { z } from "zod";
import { IQA_STATE, IQA_THRESHOLDS, BRIGHTNESS_THRESHOLD } from "./constants";

const baseSchema = z.object({
  hasFace: z
    .boolean()
    .refine((v) => v === true, { message: IQA_STATE.NO_FACE }),
  centerDist: z
    .number()
    .max(IQA_THRESHOLDS.CENTER_TOLERANCE, { message: IQA_STATE.NOT_CENTERED }),
  luminance: z
    .number()
    .min(BRIGHTNESS_THRESHOLD, { message: IQA_STATE.LOW_LIGHT }),
  blur: z
    .number()
    .min(IQA_THRESHOLDS.BLUR_LAPLACIAN_MIN, { message: IQA_STATE.BLURRY }),
  blurDelta: z
    .number()
    .max(IQA_THRESHOLDS.BLUR_DELTA_MAX, { message: IQA_STATE.BLURRY }),
  faceArea: z
    .number()
    .min(IQA_THRESHOLDS.FACE_AREA_MIN, { message: IQA_STATE.TOO_FAR })
    .max(IQA_THRESHOLDS.FACE_AREA_MAX, { message: IQA_STATE.TOO_CLOSE }),
  ear: z
    .number()
    .min(IQA_THRESHOLDS.EAR_MIN, { message: IQA_STATE.EYES_CLOSED }),
});

const poseSchema = baseSchema.extend({
  yaw: z
    .number()
    .max(IQA_THRESHOLDS.YAW_MAX, { message: IQA_STATE.BAD_POSE }),
  pitch: z
    .number()
    .max(IQA_THRESHOLDS.PITCH_MAX, { message: IQA_STATE.BAD_POSE }),
});

export type IqaSchema = typeof baseSchema | typeof poseSchema;

export function getIqaSchema(ignorePose: boolean): IqaSchema {
  return ignorePose ? baseSchema : poseSchema;
}
