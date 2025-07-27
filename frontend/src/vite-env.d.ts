/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_DEBUG: string
  readonly VITE_UPLOAD_MAX_SIZE: string
  readonly VITE_REQUEST_TIMEOUT: string
  readonly VITE_ENVIRONMENT: string
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
