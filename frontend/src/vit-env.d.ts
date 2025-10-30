/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    // add other env vars here if needed, e.g.:
    // readonly VITE_APP_NAME?: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  