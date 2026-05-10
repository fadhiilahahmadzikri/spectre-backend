export interface ConfigDraft {
  fas: boolean;
  requirePose: boolean;
  showPreview: boolean;
  redirectUrl: string;
}

export const CONFIG_DRAFT_DEFAULT: ConfigDraft = {
  fas: true,
  requirePose: true,
  showPreview: false,
  redirectUrl: "",
};
