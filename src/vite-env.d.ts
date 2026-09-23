/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_GCP_PROJECT_ID?: string;
  readonly VITE_GCP_PROJECT_NUMBER?: string;
  readonly VITE_GCP_REGION?: string;
  readonly VITE_ENABLE_GOOGLE_TTS?: string;
  readonly VITE_GOOGLE_TTS_VOICE_NAME?: string;
  readonly VITE_GOOGLE_TTS_LANGUAGE_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'bun:test' {
  export const describe: (name: string, fn: () => void | Promise<void>) => void;
  export const it: (name: string, fn: () => any) => void;
  export const test: (name: string, fn: () => any) => void;
  export const expect: any;
  export const beforeEach: (fn: () => any) => void;
  export const afterEach: (fn: () => any) => void;
  export const beforeAll: (fn: () => any) => void;
  export const afterAll: (fn: () => any) => void;
  export const mock: <T extends (...args: any[]) => any>(fn?: T) => any;
  export const spyOn: any;
}

