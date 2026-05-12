import { SCAN_CONFIG } from "@/shared/config/scan.config";

export interface ConfigDraft {
  fas: boolean;
  requirePose: boolean;
  showPreview: boolean;
  redirectUrl: string;
  detailMode: boolean;
  benchmarkMode: boolean;
}

export const CONFIG_DRAFT_DEFAULT: ConfigDraft = {
  fas: true,
  requirePose: true,
  showPreview: false,
  redirectUrl: SCAN_CONFIG.redirectUrl,
  detailMode: false,
  benchmarkMode: false,
};
