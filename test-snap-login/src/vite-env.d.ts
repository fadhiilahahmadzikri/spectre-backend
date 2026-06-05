/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPECTRE_BASE_URL: string
  readonly VITE_SPECTRE_API_KEY: string
  readonly VITE_WEBHOOK_RECEIVER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
