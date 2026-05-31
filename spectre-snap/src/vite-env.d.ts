/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SCAN_REDIRECT_URL?: string;
  readonly VITE_SCAN_REDIRECT_DELAY?: string;
  readonly VITE_SCAN_API_URL?: string;
}

declare module "*.css" {}
declare module "*.mp4" {
  const src: string;
  export default src;
}
