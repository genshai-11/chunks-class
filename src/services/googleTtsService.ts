import { deepgramTts, DEEPGRAM_AURA_VOICES, sanitizeSpeechText } from './deepgramTtsService';
import { LanguageMode } from '../types';

export { sanitizeSpeechText };

export interface VoiceOption {
  id: string;
  name: string;
  languageCode: string;
  gender: 'FEMALE' | 'MALE';
  description: string;
  provider: 'GOOGLE' | 'DEEPGRAM';
}

export type AudioProvider = 'GOOGLE_TTS' | 'DEEPGRAM_AURA';
export type AudioSourceType = 'GCS_MASTER' | 'GOOGLE_CLOUD_AI' | 'DEEPGRAM_AURA' | 'BROWSER_LOCAL';
export type AudioBatchTarget = 'ENGLISH' | 'VIETNAMESE' | 'BOTH';

export interface PrepareAudioOptions {
  voiceEn?: string;
  voiceVi?: string;
  provider?: AudioProvider;
  target?: AudioBatchTarget;
  langMode?: LanguageMode;
  forceRegenerate?: boolean;
  onProgress?: (current: number, total: number, statusText: string) => void;
  concurrency?: number;
}

export interface ChunkAudioStatus {
  chunk_id: string;
  english: string;
  vietnamese: string;
  hasEnAudio: boolean;
  hasViAudio: boolean;
  hasGcsAudio: boolean;
  enSource?: AudioSourceType;
  viSource?: AudioSourceType;
}

export interface LessonAudioStatus {
  total: number;
  enCached: number;
  viCached: number;
  isFullyCached: boolean;
  details: ChunkAudioStatus[];
}

export interface SingleChunkSynthesisResult {
  base64: string;
  source: AudioSourceType;
  voice: string;
  language: 'en' | 'vi';
}

export interface GoogleApiKeyConfig {
  key: string;
  type: 'GOOGLE_CLOUD_TTS' | 'GEMINI_AI_STUDIO';
  rateLimitedUntil?: number; // timestamp in ms
  lastUsedAt?: number;
  lastError?: string;
  status?: 'READY' | 'RATE_LIMITED' | 'ERROR';
}

export interface SingleKeyTestResult {
  success: boolean;
  statusCode: number;
  message: string;
  type: 'GOOGLE_CLOUD_TTS' | 'GEMINI_AI_STUDIO';
  isBlocked: boolean;
}

export const BUILTIN_GOOGLE_KEYS: string[] = [
  "AIzaSyBrH0sAU__R4k1IBrSYIF73fFdASeSpdE4",
  (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42Smd3UVhxWVFTSTkxRXdYc1BVWlpEaWhBLWJrR0ZEcWxoUy1kOUJXSU5Gc0E=') : ''),
  import.meta.env.VITE_GEMINI_API_KEY || (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42SmU3d2NZQTZLLWs0YmlnOUprZDRrd3RfOUJlbE1WT3VzU2J5a3ZFWnRkYVE=') : '')
].filter(Boolean);

export function detectGoogleKeyType(key: string): 'GOOGLE_CLOUD_TTS' | 'GEMINI_AI_STUDIO' {
  return key.trim().startsWith('AQ.') ? 'GEMINI_AI_STUDIO' : 'GOOGLE_CLOUD_TTS';
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return `${key.slice(0, 8)}...${key.slice(-5)}`;
}

export function pcm16ToWavDataUri(base64Pcm: string, sampleRate = 24000, numChannels = 1): string {
  const binaryString = atob(base64Pcm);
  const pcmLength = binaryString.length;
  const buffer = new ArrayBuffer(44 + pcmLength);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, pcmLength, true);

  const pcmBytes = new Uint8Array(buffer, 44);
  for (let i = 0; i < pcmLength; i++) {
    pcmBytes[i] = binaryString.charCodeAt(i);
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const CHUNK_SIZE = 8192;
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK_SIZE)));
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

export interface AudioConnectionStatus {
  cloudTtsStatus: 'CONNECTED' | 'BLOCKED' | 'ERROR' | 'UNTESTED';
  cloudTtsStatusCode?: number;
  cloudTtsError?: string | null;
  deepgramStatus?: 'CONNECTED' | 'BLOCKED' | 'ERROR' | 'UNTESTED';
  gcsStatus: 'CONNECTED' | 'UNTESTED' | 'ERROR';
  activeSource: AudioSourceType;
  lastTestedAt: string | null;
  usingCustomApiKey: boolean;
  browserVoicesCount: number;
}

export const GOOGLE_TTS_VOICES: VoiceOption[] = [
  {
    id: 'en-US-Journey-F',
    name: 'en-US-Journey-F (Google Natural Female)',
    languageCode: 'en-US',
    gender: 'FEMALE',
    description: 'Ultra-realistic American English conversational voice.',
    provider: 'GOOGLE'
  },
  {
    id: 'en-US-Journey-M',
    name: 'en-US-Journey-M (Google Natural Male)',
    languageCode: 'en-US',
    gender: 'MALE',
    description: 'Ultra-realistic American English conversational voice (Male).',
    provider: 'GOOGLE'
  },
  {
    id: 'en-US-Studio-O',
    name: 'en-US-Studio-O (Google Studio Master)',
    languageCode: 'en-US',
    gender: 'FEMALE',
    description: 'High-clarity studio master for phonetic pronunciation drills.',
    provider: 'GOOGLE'
  },
  {
    id: 'en-US-Neural2-F',
    name: 'en-US-Neural2-F (Google Studio Clarity)',
    languageCode: 'en-US',
    gender: 'FEMALE',
    description: 'Broadcast-grade studio clarity with balanced intonation.',
    provider: 'GOOGLE'
  },
  {
    id: 'en-US-Neural2-D',
    name: 'en-US-Neural2-D (Google Studio Deep)',
    languageCode: 'en-US',
    gender: 'MALE',
    description: 'Deep, crisp male studio articulation.',
    provider: 'GOOGLE'
  },
  {
    id: 'en-US-Studio-Q',
    name: 'en-US-Studio-Q (Google Studio Male)',
    languageCode: 'en-US',
    gender: 'MALE',
    description: 'Broadcast-grade studio clarity for academic narrations.',
    provider: 'GOOGLE'
  },
  {
    id: 'en-US-Casual-K',
    name: 'en-US-Casual-K (Google Casual Conversational)',
    languageCode: 'en-US',
    gender: 'MALE',
    description: 'Relaxed, natural American conversational tone.',
    provider: 'GOOGLE'
  },
  {
    id: 'en-US-Journey-D',
    name: 'en-US-Journey-D (Google Journey Expressive)',
    languageCode: 'en-US',
    gender: 'MALE',
    description: 'Dynamic conversational inflection.',
    provider: 'GOOGLE'
  },
  // =========================================================================
  // Google Cloud Text-to-Speech: Full 40 Vietnamese Models (vi-VN)
  // =========================================================================

  // --- 30 Google Chirp3-HD Models (Studio Quality) ---
  // Female (14)
  {
    id: 'vi-VN-Chirp3-HD-Achernar',
    name: 'vi-VN-Chirp3-HD-Achernar (Chirp3-HD Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese female voice (Achernar).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Aoede',
    name: 'vi-VN-Chirp3-HD-Aoede (Chirp3-HD Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese female voice (Aoede).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Autonoe',
    name: 'vi-VN-Chirp3-HD-Autonoe (Chirp3-HD Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese female voice (Autonoe).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Callirrhoe',
    name: 'vi-VN-Chirp3-HD-Callirrhoe (Chirp3-HD Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese female voice (Callirrhoe).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Despina',
    name: 'vi-VN-Chirp3-HD-Despina (Chirp3-HD Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese female voice (Despina).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Erinome',
    name: 'vi-VN-Chirp3-HD-Erinome (Chirp3-HD Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese female voice (Erinome).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Gacrux',
    name: 'vi-VN-Chirp3-HD-Gacrux (Chirp3-HD Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese female voice (Gacrux).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Kore',
    name: 'vi-VN-Chirp3-HD-Kore (Chirp3-HD Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese female voice (Kore).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Laomedeia',
    name: 'vi-VN-Chirp3-HD-Laomedeia (Chirp3-HD Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese female voice (Laomedeia).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Leda',
    name: 'vi-VN-Chirp3-HD-Leda (Chirp3-HD Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese female voice (Leda).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Pulcherrima',
    name: 'vi-VN-Chirp3-HD-Pulcherrima (Chirp3-HD Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese female voice (Pulcherrima).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Sulafat',
    name: 'vi-VN-Chirp3-HD-Sulafat (Chirp3-HD Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese female voice (Sulafat).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Vindemiatrix',
    name: 'vi-VN-Chirp3-HD-Vindemiatrix (Chirp3-HD Nữ Khuyên Dùng)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese female voice, highly natural and clear.',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Zephyr',
    name: 'vi-VN-Chirp3-HD-Zephyr (Chirp3-HD Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese female voice (Zephyr).',
    provider: 'GOOGLE'
  },
  // Male (16)
  {
    id: 'vi-VN-Chirp3-HD-Achird',
    name: 'vi-VN-Chirp3-HD-Achird (Chirp3-HD Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese male voice (Achird).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Algenib',
    name: 'vi-VN-Chirp3-HD-Algenib (Chirp3-HD Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese male voice (Algenib).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Algieba',
    name: 'vi-VN-Chirp3-HD-Algieba (Chirp3-HD Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese male voice (Algieba).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Alnilam',
    name: 'vi-VN-Chirp3-HD-Alnilam (Chirp3-HD Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese male voice (Alnilam).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Charon',
    name: 'vi-VN-Chirp3-HD-Charon (Chirp3-HD Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese male voice (Charon).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Enceladus',
    name: 'vi-VN-Chirp3-HD-Enceladus (Chirp3-HD Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese male voice (Enceladus).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Fenrir',
    name: 'vi-VN-Chirp3-HD-Fenrir (Chirp3-HD Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese male voice (Fenrir).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Iapetus',
    name: 'vi-VN-Chirp3-HD-Iapetus (Chirp3-HD Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese male voice (Iapetus).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Orus',
    name: 'vi-VN-Chirp3-HD-Orus (Chirp3-HD Nam Khuyên Dùng)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese male voice, resonant and clear.',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Puck',
    name: 'vi-VN-Chirp3-HD-Puck (Chirp3-HD Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese male voice (Puck).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Rasalgethi',
    name: 'vi-VN-Chirp3-HD-Rasalgethi (Chirp3-HD Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese male voice (Rasalgethi).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Sadachbia',
    name: 'vi-VN-Chirp3-HD-Sadachbia (Chirp3-HD Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese male voice (Sadachbia).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Sadaltager',
    name: 'vi-VN-Chirp3-HD-Sadaltager (Chirp3-HD Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese male voice (Sadaltager).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Schedar',
    name: 'vi-VN-Chirp3-HD-Schedar (Chirp3-HD Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese male voice (Schedar).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Umbriel',
    name: 'vi-VN-Chirp3-HD-Umbriel (Chirp3-HD Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese male voice (Umbriel).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Zubenelgenubi',
    name: 'vi-VN-Chirp3-HD-Zubenelgenubi (Chirp3-HD Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Next-gen Ultra-HD Studio Vietnamese male voice (Zubenelgenubi).',
    provider: 'GOOGLE'
  },

  // --- 2 Google Neural2 Models (Chuẩn Tự Nhiên) ---
  {
    id: 'vi-VN-Neural2-A',
    name: 'vi-VN-Neural2-A (Neural2 Nữ Chuẩn Bắc)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Neural2 Vietnamese standard female voice with natural Northern intonation.',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Neural2-D',
    name: 'vi-VN-Neural2-D (Neural2 Nam Chuẩn Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Neural2 Vietnamese standard male voice with clear Southern intonation.',
    provider: 'GOOGLE'
  },

  // --- 4 Google WaveNet Models ---
  {
    id: 'vi-VN-Wavenet-A',
    name: 'vi-VN-Wavenet-A (WaveNet Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'WaveNet high-fidelity Vietnamese female pronunciation.',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Wavenet-B',
    name: 'vi-VN-Wavenet-B (WaveNet Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'WaveNet natural Vietnamese male pronunciation.',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Wavenet-C',
    name: 'vi-VN-Wavenet-C (WaveNet Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'WaveNet natural Vietnamese female pronunciation (Alternative).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Wavenet-D',
    name: 'vi-VN-Wavenet-D (WaveNet Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'WaveNet crisp Vietnamese male pronunciation (Alternative).',
    provider: 'GOOGLE'
  },

  // --- 4 Google Standard Models ---
  {
    id: 'vi-VN-Standard-A',
    name: 'vi-VN-Standard-A (Standard Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Standard Vietnamese female voice.',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Standard-B',
    name: 'vi-VN-Standard-B (Standard Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Standard Vietnamese male voice.',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Standard-C',
    name: 'vi-VN-Standard-C (Standard Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Standard Vietnamese female voice (Alternative).',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Standard-D',
    name: 'vi-VN-Standard-D (Standard Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Standard Vietnamese male voice (Alternative).',
    provider: 'GOOGLE'
  }
];

export type ViVoiceSubcategory = 'CHIRP3_HD' | 'NEURAL2' | 'WAVENET' | 'STANDARD';

export function getViVoiceSubcategory(voiceId: string): ViVoiceSubcategory {
  if (voiceId.includes('Chirp3-HD')) return 'CHIRP3_HD';
  if (voiceId.includes('Neural2')) return 'NEURAL2';
  if (voiceId.includes('Wavenet')) return 'WAVENET';
  return 'STANDARD';
}

export const ALL_VOICES: VoiceOption[] = [
  ...GOOGLE_TTS_VOICES,
  ...DEEPGRAM_AURA_VOICES.map(v => ({
    id: v.id,
    name: `${v.name} (Deepgram)`,
    languageCode: 'en-US',
    gender: v.gender,
    description: v.description,
    provider: 'DEEPGRAM' as const
  }))
];

/**
 * Check if text contains Vietnamese diacritics or voice starts with 'vi'
 */
export function isVietnameseText(text: string, voiceName?: string): boolean {
  if (voiceName && voiceName.toLowerCase().startsWith('vi')) return true;
  if (!text) return false;
  return /[\u00C0-\u1EF9\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01A0\u01A1\u01AF\u01B0]/.test(text);
}

/**
 * Cleanly normalize LanguageMode variations
 */
export function normalizeLanguageMode(mode?: LanguageMode): 'EN_ONLY' | 'VI_ONLY' | 'EN_THEN_VI' | 'VI_THEN_EN' {
  if (!mode) return 'EN_THEN_VI';
  const m = String(mode).toUpperCase();
  if (m === 'PRIMARY_ONLY' || m === 'EN_ONLY') return 'EN_ONLY';
  if (m === 'SECONDARY_ONLY' || m === 'VI_ONLY') return 'VI_ONLY';
  if (m === 'PRIMARY_THEN_SECONDARY' || m === 'EN_THEN_VI') return 'EN_THEN_VI';
  if (m === 'SECONDARY_THEN_PRIMARY' || m === 'VI_THEN_EN') return 'VI_THEN_EN';
  return 'EN_THEN_VI';
}

const DB_NAME = 'chunks_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_blobs';

function openIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
      request.onsuccess = (e: any) => resolve(e.target.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveAudioBlobToDB(key: string, base64: string): Promise<void> {
  const db = await openIndexedDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ key, base64, timestamp: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function getAudioBlobFromDB(key: string): Promise<string | null> {
  const db = await openIndexedDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = (e: any) => {
        const record = e.target.result;
        resolve(record && record.base64 ? record.base64 : null);
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function loadAllAudioBlobsFromDB(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const db = await openIndexedDB();
  if (!db) return map;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = (e: any) => {
        const records = e.target.result || [];
        for (const r of records) {
          if (r && r.key && r.base64) {
            map.set(r.key, r.base64);
          }
        }
        resolve(map);
      };
      request.onerror = () => resolve(map);
    } catch {
      resolve(map);
    }
  });
}

async function clearAudioBlobsFromDB(): Promise<void> {
  const db = await openIndexedDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

class AudioPlayService {
  private currentAudio: HTMLAudioElement | null = null;
  private audioCache = new Map<string, string>(); // key (model::text) -> base64 dataUri or blobUrl
  private gcsAvailabilityCache = new Map<string, boolean>();
  private lastSource: AudioSourceType = 'DEEPGRAM_AURA';
  private activeProvider: AudioProvider = 'DEEPGRAM_AURA';
  private sourceListeners: ((source: AudioSourceType) => void)[] = [];
  private loadingListeners: ((isLoading: boolean) => void)[] = [];
  private customApiKeys: string[] = [];
  private apiKeyPool: GoogleApiKeyConfig[] = [];
  private activeSequenceId: number = 0;
  private isDBLoaded: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedKeysRaw = localStorage.getItem('chunks_custom_tts_api_keys');
        const legacyKey = localStorage.getItem('chunks_custom_tts_api_key');

        if (savedKeysRaw) {
          try {
            const parsed = JSON.parse(savedKeysRaw);
            if (Array.isArray(parsed)) {
              this.customApiKeys = parsed.map((k: any) => String(k).trim()).filter(Boolean);
            } else if (typeof parsed === 'string') {
              this.customApiKeys = parsed.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
            }
          } catch {
            this.customApiKeys = savedKeysRaw.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
          }
        } else if (legacyKey && legacyKey.trim()) {
          this.customApiKeys = [legacyKey.trim()];
        }

        const savedProvider = localStorage.getItem('chunks_active_audio_provider');
        if (savedProvider === 'DEEPGRAM_AURA' || savedProvider === 'GOOGLE_TTS') {
          this.activeProvider = savedProvider;
        } else {
          this.activeProvider = 'DEEPGRAM_AURA';
        }
      } catch {}

      this.rebuildApiKeyPool();

      // Asynchronously restore persistent audio cache from IndexedDB
      loadAllAudioBlobsFromDB().then((map) => {
        for (const [k, v] of map) {
          this.audioCache.set(k, v);
        }
        this.isDBLoaded = true;
      }).catch((e) => {
        console.warn('[AudioService] Could not load persisted audio cache from IndexedDB:', e);
      });
    } else {
      this.rebuildApiKeyPool();
    }
  }

  public rebuildApiKeyPool(): void {
    const existingMap = new Map<string, GoogleApiKeyConfig>();
    for (const item of this.apiKeyPool) {
      existingMap.set(item.key, item);
    }

    const allRawKeys = [
      ...this.customApiKeys,
      ...BUILTIN_GOOGLE_KEYS
    ];

    const uniqueKeys: string[] = [];
    for (const k of allRawKeys) {
      const trimmed = k?.trim();
      if (trimmed && !uniqueKeys.includes(trimmed)) {
        uniqueKeys.push(trimmed);
      }
    }

    this.apiKeyPool = uniqueKeys.map(key => {
      const existing = existingMap.get(key);
      if (existing) return existing;
      return {
        key,
        type: detectGoogleKeyType(key),
        status: 'READY'
      };
    });
  }

  public getApiKeyPool(): GoogleApiKeyConfig[] {
    this.rebuildApiKeyPool();
    return this.apiKeyPool;
  }

  public getCustomApiKeys(): string[] {
    return [...this.customApiKeys];
  }

  public setCustomApiKeys(keys: string[]): void {
    this.customApiKeys = keys.map(k => k.trim()).filter(Boolean);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('chunks_custom_tts_api_keys', JSON.stringify(this.customApiKeys));
        if (this.customApiKeys.length > 0) {
          localStorage.setItem('chunks_custom_tts_api_key', this.customApiKeys[0]);
        } else {
          localStorage.removeItem('chunks_custom_tts_api_key');
        }
      } catch {}
    }
    this.rebuildApiKeyPool();
  }

  public setCustomApiKey(key: string) {
    const parts = key.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
    this.setCustomApiKeys(parts);
  }

  public getCustomApiKey(): string {
    return this.customApiKeys.join('\n');
  }

  public getPoolStats(): { total: number; ready: number; rateLimited: number; error: number } {
    const now = Date.now();
    let ready = 0;
    let rateLimited = 0;
    let error = 0;
    for (const k of this.apiKeyPool) {
      if (k.rateLimitedUntil && k.rateLimitedUntil > now) {
        rateLimited++;
      } else if (k.status === 'ERROR') {
        error++;
      } else {
        ready++;
      }
    }
    return {
      total: this.apiKeyPool.length,
      ready,
      rateLimited,
      error
    };
  }

  public setCache(key: string, base64: string) {
    this.audioCache.set(key, base64);
    saveAudioBlobToDB(key, base64).catch(() => {});
  }

  public clearAllCache() {
    this.audioCache.clear();
    clearAudioBlobsFromDB().catch(() => {});
  }

  public setAudioProvider(provider: AudioProvider) {
    this.activeProvider = provider;
    if (typeof window !== 'undefined') {
      localStorage.setItem('chunks_active_audio_provider', provider);
    }
  }

  public getAudioProvider(): AudioProvider {
    return this.activeProvider;
  }

  public onSourceChange(listener: (source: AudioSourceType) => void): () => void {
    this.sourceListeners.push(listener);
    return () => {
      this.sourceListeners = this.sourceListeners.filter(l => l !== listener);
    };
  }

  public onLoadingChange(listener: (isLoading: boolean) => void): () => void {
    this.loadingListeners.push(listener);
    return () => {
      this.loadingListeners = this.loadingListeners.filter(l => l !== listener);
    };
  }

  private setLastSource(source: AudioSourceType) {
    this.lastSource = source;
    this.sourceListeners.forEach(l => l(source));
  }

  public getLastSource(): AudioSourceType {
    return this.lastSource;
  }

  private setAudioLoading(loading: boolean) {
    this.loadingListeners.forEach(l => l(loading));
  }

  public getCacheKey(voice: string, text: string): string {
    return `${voice}::${text.trim().toLowerCase()}`;
  }

  public clearCache(filter?: 'ALL' | 'EN' | 'VI'): void {
    if (!filter || filter === 'ALL') {
      this.audioCache.clear();
      deepgramTts.clearCache();
      return;
    }

    for (const key of Array.from(this.audioCache.keys())) {
      const isViKey = key.startsWith('vi-');
      if (filter === 'VI' && isViKey) {
        this.audioCache.delete(key);
      } else if (filter === 'EN' && !isViKey) {
        this.audioCache.delete(key);
      }
    }

    if (filter === 'EN') {
      deepgramTts.clearCache();
    }
  }

  public isChunkCached(text: string, voiceName?: string): boolean {
    if (!text) return false;
    if (this.audioCache.has(text)) return true;
    const clean = sanitizeSpeechText(text);
    if (clean && this.audioCache.has(clean)) return true;
    if (voiceName) {
      if (this.audioCache.has(this.getCacheKey(voiceName, clean))) return true;
      if (this.audioCache.has(this.getCacheKey(voiceName, text))) return true;
    }
    return false;
  }

  /**
   * Synchronous cache retrieval (Memory Map).
   * Checks raw keys, clean speech text, and composite model::text keys.
   */
  public getCachedAudio(text: string, voiceName?: string): string | null {
    if (!text) return null;
    if (this.audioCache.has(text)) {
      return this.audioCache.get(text)!;
    }
    const clean = sanitizeSpeechText(text);
    if (clean && this.audioCache.has(clean)) {
      return this.audioCache.get(clean)!;
    }
    if (voiceName) {
      const k1 = this.getCacheKey(voiceName, clean);
      if (this.audioCache.has(k1)) return this.audioCache.get(k1)!;
      const k2 = this.getCacheKey(voiceName, text);
      if (this.audioCache.has(k2)) return this.audioCache.get(k2)!;
    }
    return null;
  }

  /**
   * Asynchronous cache retrieval (IndexedDB + Memory).
   * Checks in-memory cache first; if missing, fetches from IndexedDB
   * and populates memory for instant 0ms subsequent access.
   */
  public async getCachedAudioAsync(text: string, voiceName?: string): Promise<string | null> {
    if (!text) return null;
    const memCached = this.getCachedAudio(text, voiceName);
    if (memCached) return memCached;

    const clean = sanitizeSpeechText(text);
    const keysToCheck: string[] = [text];
    if (clean && clean !== text) keysToCheck.push(clean);
    if (voiceName) {
      keysToCheck.push(this.getCacheKey(voiceName, clean));
      if (clean !== text) keysToCheck.push(this.getCacheKey(voiceName, text));
    }

    for (const key of keysToCheck) {
      const fromDb = await getAudioBlobFromDB(key);
      if (fromDb) {
        this.audioCache.set(key, fromDb);
        return fromDb;
      }
    }

    return null;
  }

  public setCachedAudio(text: string, voiceName: string, base64: string): void {
    const clean = sanitizeSpeechText(text);
    this.setCache(this.getCacheKey(voiceName, clean), base64);
  }

  public getCacheEntriesCount(): number {
    return this.audioCache.size;
  }

  /**
   * Get list of local browser voices installed on current OS/device
   */
  getBrowserVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices();
  }

  /**
   * Fast GCS Resource Check with in-memory caching
   */
  async checkGcsResource(url: string): Promise<boolean> {
    if (!url || !url.startsWith('http')) return false;
    if (this.gcsAvailabilityCache.has(url)) {
      return this.gcsAvailabilityCache.get(url)!;
    }

    try {
      const resp = await fetch(url, { method: 'HEAD', cache: 'force-cache' });
      const available = resp.ok;
      this.gcsAvailabilityCache.set(url, available);
      return available;
    } catch {
      this.gcsAvailabilityCache.set(url, false);
      return false;
    }
  }

  /**
   * Test a single key (either Google Cloud TTS or Gemini AI Studio)
   */
  async testSingleKey(key: string): Promise<SingleKeyTestResult> {
    const trimmed = key.trim();
    if (!trimmed) {
      return {
        success: false,
        statusCode: 0,
        message: 'API Key is empty',
        type: 'GOOGLE_CLOUD_TTS',
        isBlocked: false
      };
    }

    const type = detectGoogleKeyType(trimmed);

    if (type === 'GEMINI_AI_STUDIO') {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${trimmed}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Connection verification" }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' }
                }
              }
            }
          })
        });

        if (response.ok) {
          return {
            success: true,
            statusCode: response.status,
            message: "Google Gemini Flash TTS Connected (AI Studio Ready)",
            type,
            isBlocked: false
          };
        } else {
          const errText = await response.text();
          const isBlocked = response.status === 403 || errText.includes('PERMISSION_DENIED');
          return {
            success: false,
            statusCode: response.status,
            message: errText,
            type,
            isBlocked
          };
        }
      } catch (e: any) {
        return {
          success: false,
          statusCode: 0,
          message: e?.message || 'Network error',
          type,
          isBlocked: false
        };
      }
    } else {
      // GOOGLE_CLOUD_TTS
      try {
        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${trimmed}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input: { text: "Connection verification" },
            voice: { languageCode: 'en-US', name: 'en-US-Journey-F' },
            audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 }
          })
        });

        if (response.ok) {
          return {
            success: true,
            statusCode: response.status,
            message: "Google Cloud TTS Connected (Journey-F Online)",
            type,
            isBlocked: false
          };
        } else {
          const text = await response.text();
          const isBlocked = response.status === 403 || text.includes('PERMISSION_DENIED') || text.includes('API_KEY_SERVICE_BLOCKED');
          return {
            success: false,
            statusCode: response.status,
            message: text,
            type,
            isBlocked
          };
        }
      } catch (e: any) {
        return {
          success: false,
          statusCode: 0,
          message: e?.message || "Network Error",
          type,
          isBlocked: false
        };
      }
    }
  }

  /**
   * Test Live Google Cloud TTS API connectivity across the key pool or with override key
   */
  async testCloudTtsConnection(overrideKey?: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    isBlocked: boolean;
    activeKey?: string;
    type?: 'GOOGLE_CLOUD_TTS' | 'GEMINI_AI_STUDIO';
  }> {
    if (overrideKey && overrideKey.trim()) {
      const single = await this.testSingleKey(overrideKey);
      return {
        success: single.success,
        statusCode: single.statusCode,
        message: single.message,
        isBlocked: single.isBlocked,
        activeKey: overrideKey.trim(),
        type: single.type
      };
    }

    this.rebuildApiKeyPool();
    const pool = this.apiKeyPool;
    if (pool.length === 0) {
      return {
        success: false,
        statusCode: 0,
        message: 'No API keys configured in pool',
        isBlocked: false
      };
    }

    let lastResult: SingleKeyTestResult | null = null;
    for (const item of pool) {
      const result = await this.testSingleKey(item.key);
      item.lastUsedAt = Date.now();
      if (result.success) {
        item.status = 'READY';
        item.lastError = undefined;
        item.rateLimitedUntil = undefined;
        return {
          success: true,
          statusCode: result.statusCode,
          message: result.message,
          isBlocked: false,
          activeKey: item.key,
          type: result.type
        };
      } else {
        if (result.statusCode === 429) {
          item.status = 'RATE_LIMITED';
          item.rateLimitedUntil = Date.now() + 60000;
          item.lastError = '429 Rate Limit Exceeded';
        } else {
          item.status = 'ERROR';
          item.lastError = result.message.slice(0, 100);
        }
        lastResult = result;
      }
    }

    return {
      success: false,
      statusCode: lastResult?.statusCode || 0,
      message: lastResult ? `All ${pool.length} pool keys failed: ${lastResult.message}` : 'All pool keys failed',
      isBlocked: lastResult?.isBlocked || false,
      activeKey: lastResult ? pool[pool.length - 1].key : undefined,
      type: lastResult?.type
    };
  }

  /**
   * Test Deepgram Aura TTS API connectivity
   */
  async testDeepgramConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const base64 = await deepgramTts.synthesizeText("Deepgram Aura online test", "aura-asteria-en");
      return { success: !!base64, message: "Deepgram Aura Connected (Asteria Online)" };
    } catch (e: any) {
      return { success: false, message: e?.message || "Deepgram Connection Failed" };
    }
  }

  /**
   * Get in-memory audio preparation status and detailed chunk status for a lesson
   */
  getLessonAudioStatus(
    chunks: { chunk_id?: string; english: string; vietnamese?: string; audio_url?: string | null }[],
    voiceEn: string = 'aura-asteria-en',
    voiceVi: string = 'vi-VN-Neural2-A'
  ): LessonAudioStatus {
    let enCached = 0;
    let viCached = 0;
    const details: ChunkAudioStatus[] = [];

    const effectiveVoiceEn = voiceEn && !voiceEn.startsWith('vi-') ? voiceEn : 'aura-asteria-en';
    const effectiveVoiceVi = voiceVi && voiceVi.startsWith('vi-') ? voiceVi : 'vi-VN-Neural2-A';

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const cleanEn = sanitizeSpeechText(c.english);
      const cleanVi = c.vietnamese ? sanitizeSpeechText(c.vietnamese) : '';

      const hasEnAudio = Boolean(
        cleanEn && (
          this.audioCache.has(this.getCacheKey(effectiveVoiceEn, cleanEn)) ||
          this.audioCache.has(this.getCacheKey(effectiveVoiceEn, c.english))
        )
      );

      const hasViAudio = Boolean(
        cleanVi && (
          this.audioCache.has(this.getCacheKey(effectiveVoiceVi, cleanVi)) ||
          this.audioCache.has(this.getCacheKey(effectiveVoiceVi, c.vietnamese || ''))
        )
      );

      const hasGcsAudio = Boolean(c.audio_url && c.audio_url.startsWith('http'));

      if (hasEnAudio) enCached++;
      if (hasViAudio) viCached++;

      details.push({
        chunk_id: c.chunk_id || `chunk_${i + 1}`,
        english: c.english,
        vietnamese: c.vietnamese || '',
        hasEnAudio,
        hasViAudio,
        hasGcsAudio,
        enSource: hasEnAudio ? (effectiveVoiceEn.startsWith('aura-') ? 'DEEPGRAM_AURA' : 'GOOGLE_CLOUD_AI') : (hasGcsAudio ? 'GCS_MASTER' : undefined),
        viSource: hasViAudio ? 'GOOGLE_CLOUD_AI' : undefined
      });
    }

    return {
      total: chunks.length,
      enCached,
      viCached,
      isFullyCached: chunks.length > 0 && enCached === chunks.length && viCached === chunks.length,
      details
    };
  }

  /**
   * Play Chunk Audio with clean Engine Prioritization:
   * 1. Check in-memory preparation cache (Instant 0ms).
   * 2. Vietnamese routing:
   *    Strictly routes to Google Cloud TTS (vi-VN-Neural2-A / vi-VN-Standard-A) -> Public Google Vietnamese TTS -> Browser Speech (vi-VN).
   *    Never sends Deepgram or en-US to Vietnamese text.
   * 3. English routing:
   *    If provider is DEEPGRAM_AURA or voice is aura-*: Deepgram Aura API.
   *    Else if GCS permanent audio is available: Streams directly.
   *    Else: Synthesizes via Google Cloud Text-to-Speech API (en-US).
   *    Fallback to local Browser Speech (en-US).
   */
  async playChunk(
    text: string,
    permanentAudioUrl?: string | null,
    voiceName: string = 'aura-asteria-en',
    speed: number = 1.0,
    forceCloudTts: boolean = false
  ): Promise<void> {
    this.stop();
    if (!text || !text.trim()) return;

    const cleanText = sanitizeSpeechText(text);
    if (!cleanText) return;

    this.setAudioLoading(true);
    try {
      const isVietnamese = isVietnameseText(cleanText, voiceName);

      // ======================================================================
      // 1. VIETNAMESE PLAYBACK PIPELINE
      // Strictly routes to Google Cloud TTS (vi-VN) -> Public Google TTS -> Browser Speech (vi-VN)
      // Never sends Deepgram voices or en-US languageCode to Vietnamese text.
      // ======================================================================
      if (isVietnamese) {
        const effectiveViVoice = (voiceName && voiceName.startsWith('vi-')) ? voiceName : 'vi-VN-Neural2-A';
        const cacheKey = this.getCacheKey(effectiveViVoice, cleanText);
        const cached = await this.getCachedAudioAsync(cleanText, effectiveViVoice);

        if (cached) {
          this.setLastSource('GOOGLE_CLOUD_AI');
          await this.playBase64(cached, speed);
          return;
        }

        // Tier 1: Google Cloud TTS REST API (vi-VN: Neural2-A / Standard-A / WaveNet / Chirp3)
        try {
          const base64Audio = await this.synthesizeWithGoogleTTS(cleanText, effectiveViVoice, 1.0);
          if (base64Audio) {
            this.setCache(cacheKey, base64Audio);
            this.setLastSource('GOOGLE_CLOUD_AI');
            await this.playBase64(base64Audio, speed);
            return;
          }
        } catch (cloudErr: any) {
          console.warn(`[Audio] Google Cloud TTS (VI) failed (${cloudErr?.message}), falling back to local Browser Speech Synthesis...`);
        }

        // Tier 2: Local Browser Speech Synthesis Fallback (lang: 'vi-VN')
        this.setLastSource('BROWSER_LOCAL');
        await this.playBrowserTts(cleanText, 'vi-VN', speed);
        return;
      }

      // ======================================================================
      // 2. ENGLISH PLAYBACK PIPELINE
      // Routes to Deepgram Aura (if aura-* voice or provider is DEEPGRAM_AURA and not en-US-*)
      // Or Google Cloud TTS (if en-US-* voice or provider is GOOGLE_TTS)
      // ======================================================================
      const isAuraVoice = Boolean(voiceName && voiceName.startsWith('aura-'));
      const isGoogleEnVoice = Boolean(voiceName && voiceName.startsWith('en-US-'));
      const isDeepgram = !forceCloudTts && (isAuraVoice || (!isGoogleEnVoice && this.activeProvider === 'DEEPGRAM_AURA'));
      const effectiveEnVoice = isDeepgram
        ? (isAuraVoice ? voiceName : 'aura-asteria-en')
        : (isGoogleEnVoice ? voiceName : (voiceName && !voiceName.startsWith('vi-') ? voiceName : 'en-US-Journey-F'));

      const cacheKey = this.getCacheKey(effectiveEnVoice, cleanText);
      const cached = await this.getCachedAudioAsync(cleanText, effectiveEnVoice);

      if (cached) {
        this.setLastSource(isDeepgram ? 'DEEPGRAM_AURA' : 'GOOGLE_CLOUD_AI');
        await this.playBase64(cached, speed);
        return;
      }

      // Step 1: Deepgram Aura Engine (if provider or voice is aura-*)
      if (isDeepgram) {
        try {
          const dgModel = effectiveEnVoice;
          const base64 = await deepgramTts.synthesizeText(cleanText, dgModel);
          if (base64) {
            this.setCache(cacheKey, base64);
            this.setLastSource('DEEPGRAM_AURA');
            await this.playBase64(base64, speed);
            return;
          }
        } catch (dgErr: any) {
          console.warn(`[Audio] Deepgram Aura synthesis failed (${dgErr?.message}), trying GCS master or Google Cloud TTS...`, dgErr);
        }
      }

      // Step 2: GCS Master Permanent Audio (if not forced to TTS and GCS URL exists and not custom voice)
      const isCustomVoice = (isAuraVoice && effectiveEnVoice !== 'aura-asteria-en') || (isGoogleEnVoice && effectiveEnVoice !== 'en-US-Journey-F');
      if (!forceCloudTts && !isDeepgram && !isCustomVoice && permanentAudioUrl && permanentAudioUrl.startsWith('http')) {
        try {
          this.setLastSource('GCS_MASTER');
          await this.playUrl(permanentAudioUrl, speed);
          return;
        } catch (err) {
          console.warn(`[Audio] GCS master audio unreachable (${permanentAudioUrl}), synthesizing via Google Cloud TTS...`);
        }
      }

      // Step 3: Google Cloud Text-to-Speech (en-US)
      try {
        const googleVoice = effectiveEnVoice.startsWith('aura-') ? 'en-US-Journey-F' : effectiveEnVoice;
        const base64Audio = await this.synthesizeWithGoogleTTS(cleanText, googleVoice, 1.0);
        if (base64Audio) {
          this.setCache(cacheKey, base64Audio);
          this.setLastSource('GOOGLE_CLOUD_AI');
          await this.playBase64(base64Audio, speed);
          return;
        }
      } catch (err: any) {
        console.warn(`[Audio] Google Cloud TTS (EN) failed (${err?.message}), falling back to local Browser Speech...`);
      }

      // Step 4: Local Browser Speech Synthesis Fallback (lang: 'en-US')
      this.setLastSource('BROWSER_LOCAL');
      await this.playBrowserTts(cleanText, 'en-US', speed);
    } finally {
      this.setAudioLoading(false);
    }
  }

  /**
   * Play sequential bilingual drill: EN_ONLY, VI_ONLY, EN_THEN_VI, VI_THEN_EN
   * Supports 'PRIMARY_ONLY', 'SECONDARY_ONLY', 'PRIMARY_THEN_SECONDARY', 'SECONDARY_THEN_PRIMARY'
   * Protected with activeSequenceId to completely prevent overlapping speech on fast clicking.
   */
  async playBilingualSequence(
    englishText: string,
    vietnameseText: string,
    mode: LanguageMode = 'EN_THEN_VI',
    englishAudioUrl?: string | null,
    voiceEn: string = 'aura-asteria-en',
    voiceVi: string = 'vi-VN-Neural2-A',
    speed: number = 1.0,
    repeatCount: number = 1,
    onStepChange?: (step: 'en' | 'vi' | 'idle') => void
  ): Promise<void> {
    this.stop();
    const seqId = this.activeSequenceId;
    const normalizedMode = normalizeLanguageMode(mode);

    // Determine effective voices
    const isDeepgram = this.activeProvider === 'DEEPGRAM_AURA' || voiceEn.startsWith('aura-');
    const effectiveVoiceEn = isDeepgram && !voiceEn.startsWith('aura-') ? 'aura-asteria-en' : (voiceEn || 'aura-asteria-en');
    const effectiveVoiceVi = (voiceVi && voiceVi.startsWith('vi-')) ? voiceVi : 'vi-VN-Neural2-A';

    for (let r = 0; r < repeatCount; r++) {
      if (this.activeSequenceId !== seqId) return;

      if (normalizedMode === 'EN_ONLY') {
        onStepChange?.('en');
        await this.playChunk(englishText, isDeepgram ? null : englishAudioUrl, effectiveVoiceEn, speed);
      } else if (normalizedMode === 'VI_ONLY') {
        onStepChange?.('vi');
        await this.playChunk(vietnameseText, null, effectiveVoiceVi, speed);
      } else if (normalizedMode === 'EN_THEN_VI') {
        onStepChange?.('en');
        await this.playChunk(englishText, isDeepgram ? null : englishAudioUrl, effectiveVoiceEn, speed);
        
        if (this.activeSequenceId !== seqId) return;
        // Natural 500ms cadence pause between English and Vietnamese
        await new Promise(res => setTimeout(res, 500));
        if (this.activeSequenceId !== seqId) return;

        onStepChange?.('vi');
        await this.playChunk(vietnameseText, null, effectiveVoiceVi, speed);
      } else if (normalizedMode === 'VI_THEN_EN') {
        onStepChange?.('vi');
        await this.playChunk(vietnameseText, null, effectiveVoiceVi, speed);
        
        if (this.activeSequenceId !== seqId) return;
        // Natural 500ms cadence pause between Vietnamese and English
        await new Promise(res => setTimeout(res, 500));
        if (this.activeSequenceId !== seqId) return;

        onStepChange?.('en');
        await this.playChunk(englishText, isDeepgram ? null : englishAudioUrl, effectiveVoiceEn, speed);
      }

      if (r < repeatCount - 1) {
        if (this.activeSequenceId !== seqId) return;
        await new Promise(res => setTimeout(res, 600));
      }
    }

    if (this.activeSequenceId === seqId) {
      onStepChange?.('idle');
    }
  }

  /**
   * Synthesize a single chunk's text (EN or VI) using the appropriate voice and provider.
   * Returns base64 audio and the active source used.
   */
  async synthesizeSingleChunk(params: {
    text: string;
    language: 'EN' | 'VI' | 'en' | 'vi';
    voiceName?: string;
    speed?: number;
    forceRegenerate?: boolean;
    provider?: AudioProvider;
  }): Promise<SingleChunkSynthesisResult> {
    const cleanText = sanitizeSpeechText(params.text);
    if (!cleanText) throw new Error('Text to synthesize is empty');

    const isVi = params.language.toUpperCase() === 'VI' || isVietnameseText(cleanText, params.voiceName);
    const speed = params.speed || 1.0;
    const forceRegenerate = params.forceRegenerate || false;

    if (isVi) {
      const voiceVi = (params.voiceName && params.voiceName.startsWith('vi-')) ? params.voiceName : 'vi-VN-Neural2-A';
      const cacheKey = this.getCacheKey(voiceVi, cleanText);

      if (!forceRegenerate) {
        const cached = await this.getCachedAudioAsync(cleanText, voiceVi);
        if (cached) {
          return { base64: cached, source: 'GOOGLE_CLOUD_AI', voice: voiceVi, language: 'vi' };
        }
      }

      // 1. Google Cloud TTS (vi-VN: Neural2-A / Standard-A / WaveNet / Chirp3)
      try {
        const base64 = await this.synthesizeWithGoogleTTS(cleanText, voiceVi, speed, forceRegenerate);
        if (base64) {
          this.setCache(cacheKey, base64);
          return { base64, source: 'GOOGLE_CLOUD_AI', voice: voiceVi, language: 'vi' };
        }
      } catch (err: any) {
        throw new Error(`Google Cloud TTS (VI) synthesis failed: ${err?.message}`);
      }

      throw new Error('Vietnamese TTS synthesis failed.');
    } else {
      // English
      const activeProvider = params.provider || this.activeProvider;
      const isAura = Boolean(params.voiceName && params.voiceName.startsWith('aura-'));
      const isGoogleEn = Boolean(params.voiceName && params.voiceName.startsWith('en-US-'));
      const isDeepgram = isAura || (!isGoogleEn && activeProvider === 'DEEPGRAM_AURA');
      const voiceEn = isDeepgram
        ? (isAura ? params.voiceName! : 'aura-asteria-en')
        : (isGoogleEn ? params.voiceName! : (params.voiceName || 'en-US-Journey-F'));
      const cacheKey = this.getCacheKey(voiceEn, cleanText);

      if (!forceRegenerate) {
        const cached = await this.getCachedAudioAsync(cleanText, voiceEn);
        if (cached) {
          return { base64: cached, source: isDeepgram ? 'DEEPGRAM_AURA' : 'GOOGLE_CLOUD_AI', voice: voiceEn, language: 'en' };
        }
      }

      if (isDeepgram) {
        const dgModel = voiceEn.startsWith('aura-') ? voiceEn : 'aura-asteria-en';
        if (forceRegenerate) {
          deepgramTts.clearCache();
        }
        const base64 = await deepgramTts.synthesizeText(cleanText, dgModel);
        if (base64) {
          this.setCache(cacheKey, base64);
          return { base64, source: 'DEEPGRAM_AURA', voice: dgModel, language: 'en' };
        }
      } else {
        const base64 = await this.synthesizeWithGoogleTTS(cleanText, voiceEn, speed, forceRegenerate);
        if (base64) {
          this.setCache(cacheKey, base64);
          return { base64, source: 'GOOGLE_CLOUD_AI', voice: voiceEn, language: 'en' };
        }
      }

      throw new Error('English TTS synthesis failed.');
    }
  }

  /**
   * Fast Concurrent Batch Pre-generator (Worker pool + English / Vietnamese / Both)
   */
  async prepareChunksAudio(
    chunks: { english: string; vietnamese?: string; audio_url?: string | null; chunk_id?: string }[],
    optionsOrVoiceEn?: PrepareAudioOptions | string,
    providerLegacy: AudioProvider = 'DEEPGRAM_AURA',
    onProgressLegacy?: (current: number, total: number, statusText: string) => void
  ): Promise<{ prepared: number; failed: number; total: number; skipped: number }> {
    let opts: PrepareAudioOptions = {};

    if (typeof optionsOrVoiceEn === 'string') {
      opts = {
        voiceEn: optionsOrVoiceEn,
        voiceVi: 'vi-VN-Neural2-A',
        provider: providerLegacy,
        target: 'BOTH',
        forceRegenerate: false,
        onProgress: onProgressLegacy,
        concurrency: 4
      };
    } else if (optionsOrVoiceEn) {
      opts = optionsOrVoiceEn;
    }

    const provider = opts.provider || this.activeProvider;
    const voiceEn = opts.voiceEn || (provider === 'DEEPGRAM_AURA' ? 'aura-asteria-en' : 'en-US-Journey-F');
    const voiceVi = opts.voiceVi || 'vi-VN-Neural2-A';
    const target = opts.target || 'BOTH';
    const forceRegenerate = opts.forceRegenerate || false;
    const onProgress = opts.onProgress;
    const concurrency = Math.max(1, Math.min(8, opts.concurrency || 4));

    const total = chunks.length;
    if (total === 0) return { prepared: 0, failed: 0, total: 0, skipped: 0 };

    const isDeepgram = provider === 'DEEPGRAM_AURA';
    const modelEn = isDeepgram && !voiceEn.startsWith('aura-') ? 'aura-asteria-en' : voiceEn;
    const modelVi = (voiceVi && voiceVi.startsWith('vi-')) ? voiceVi : 'vi-VN-Neural2-A';

    let prepared = 0;
    let failed = 0;
    let skipped = 0;
    let chunkIndex = 0;

    const worker = async () => {
      while (chunkIndex < total) {
        const index = chunkIndex++;
        const c = chunks[index];
        const cleanEn = sanitizeSpeechText(c.english);
        const cleanVi = c.vietnamese ? sanitizeSpeechText(c.vietnamese) : '';

        // 1. Synthesize English if requested
        if (target === 'ENGLISH' || target === 'BOTH') {
          if (cleanEn) {
            const cacheKeyEn = this.getCacheKey(modelEn, cleanEn);
            if (forceRegenerate || !this.audioCache.has(cacheKeyEn)) {
              try {
                if (isDeepgram) {
                  const base64 = await deepgramTts.synthesizeText(cleanEn, modelEn);
                  if (base64) {
                    this.setCache(cacheKeyEn, base64);
                    prepared++;
                  } else {
                    failed++;
                  }
                } else {
                  const base64 = await this.synthesizeWithGoogleTTS(cleanEn, modelEn, 1.0, forceRegenerate);
                  if (base64) {
                    this.setCache(cacheKeyEn, base64);
                    prepared++;
                  } else {
                    failed++;
                  }
                }
              } catch (e) {
                console.warn(`[Audio Batch] EN synthesis failed for chunk #${index + 1}:`, e);
                failed++;
              }
            } else {
              skipped++;
            }
          }
        }

        // 2. Synthesize Vietnamese if requested and present
        if ((target === 'VIETNAMESE' || target === 'BOTH') && cleanVi) {
          const cacheKeyVi = this.getCacheKey(modelVi, cleanVi);
          if (forceRegenerate || !this.audioCache.has(cacheKeyVi)) {
            let success = false;
            try {
              const base64 = await this.synthesizeWithGoogleTTS(cleanVi, modelVi, 1.0, forceRegenerate);
              if (base64) {
                this.setCache(cacheKeyVi, base64);
                prepared++;
                success = true;
              }
            } catch (cloudErr) {
              console.warn(`[Audio Batch] VI synthesis failed for chunk #${index + 1}:`, cloudErr);
            }
            if (!success) {
              failed++;
            }
          } else {
            skipped++;
          }
        }

        const totalSteps = total * (target === 'BOTH' ? 2 : 1);
        const doneSteps = prepared + failed + skipped;
        onProgress?.(
          Math.min(doneSteps, totalSteps),
          totalSteps,
          `Đang xử lý #${index + 1}/${total}: "${cleanEn.slice(0, 20)}..."`
        );
      }
    };

    const pool = Array.from({ length: Math.min(concurrency, total) }, () => worker());
    await Promise.all(pool);

    const totalSteps = total * (target === 'BOTH' ? 2 : 1);
    onProgress?.(
      totalSteps,
      totalSteps,
      `Hoàn tất chuẩn bị audio! (${prepared} tạo mới, ${skipped} đã có sẵn, ${failed} lỗi)`
    );
    return { prepared, failed, total, skipped };
  }

  /**
   * Google Gemini Flash TTS Preview Synthesizer (AI Studio)
   * Supports keys starting with 'AQ.'
   */
  private async synthesizeWithGeminiTTS(
    text: string,
    apiKey: string,
    voiceName: string = 'en-US-Journey-F'
  ): Promise<string> {
    const isMale = voiceName.includes('-M') || voiceName.includes('-D') || voiceName.includes('Nam') || voiceName.includes('Orus');
    const geminiVoice = isMale ? 'Puck' : 'Kore';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: geminiVoice }
            }
          }
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini Flash TTS Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const base64Pcm = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Pcm) {
      throw new Error('Gemini Flash TTS returned no audio data');
    }

    return pcm16ToWavDataUri(base64Pcm, 24000, 1);
  }

  /**
   * Synthesize with Google Cloud TTS or Gemini Flash TTS with automatic Multi-Key Failover:
   * Handles 429 (Rate Limit / Quota Exceeded), 403, and 503 errors gracefully by rotating to next key in pool.
   */
  private async synthesizeWithGoogleTTS(
    text: string, 
    voiceName: string = 'en-US-Journey-F', 
    speed: number = 1.0,
    forceRefresh: boolean = false
  ): Promise<string> {
    const cleanText = sanitizeSpeechText(text);
    if (!cleanText) return '';

    const isVi = isVietnameseText(cleanText, voiceName);
    const effectiveVoice = isVi
      ? (voiceName && voiceName.startsWith('vi-') ? voiceName : 'vi-VN-Neural2-A')
      : (voiceName && !voiceName.startsWith('aura-') && !voiceName.startsWith('vi-') ? voiceName : 'en-US-Journey-F');
    const langCode = isVi ? 'vi-VN' : 'en-US';

    const cacheKey = this.getCacheKey(effectiveVoice, cleanText);
    if (!forceRefresh && this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    this.rebuildApiKeyPool();
    const now = Date.now();

    // Reset rate-limited status for keys whose cooldown has expired
    for (const item of this.apiKeyPool) {
      if (item.rateLimitedUntil && item.rateLimitedUntil <= now) {
        item.rateLimitedUntil = undefined;
        if (item.status === 'RATE_LIMITED') {
          item.status = 'READY';
        }
      }
    }

    // Prioritize active keys that are NOT currently rate-limited
    const activeKeys = this.apiKeyPool.filter(k => !k.rateLimitedUntil || k.rateLimitedUntil <= now);
    let candidateKeys = activeKeys.length > 0 ? activeKeys : this.apiKeyPool;

    if (isVi) {
      // Prioritize GOOGLE_CLOUD_TTS keys for Vietnamese models (Chirp3-HD, Neural2, WaveNet, Standard)
      candidateKeys = [...candidateKeys].sort((a, b) => {
        if (a.type === 'GOOGLE_CLOUD_TTS' && b.type !== 'GOOGLE_CLOUD_TTS') return -1;
        if (a.type !== 'GOOGLE_CLOUD_TTS' && b.type === 'GOOGLE_CLOUD_TTS') return 1;
        return 0;
      });
    }

    if (candidateKeys.length === 0) {
      throw new Error('No API keys configured in pool.');
    }

    let lastErrorMsg = '';

    for (const candidate of candidateKeys) {
      candidate.lastUsedAt = Date.now();

      if (candidate.type === 'GOOGLE_CLOUD_TTS') {
        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${candidate.key}`;
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              input: { text: cleanText },
              voice: { languageCode: langCode, name: effectiveVoice },
              audioConfig: { audioEncoding: 'MP3', speakingRate: speed }
            })
          });

          if (response.status === 429) {
            candidate.rateLimitedUntil = Date.now() + 60000;
            candidate.status = 'RATE_LIMITED';
            candidate.lastError = '429 Rate Limit Exceeded';
            lastErrorMsg = `Key ${maskApiKey(candidate.key)} hit 429 Rate Limit`;
            console.warn(`[GoogleTTS] Key ${maskApiKey(candidate.key)} hit 429. Rotating to next key in pool...`);
            continue;
          }

          if (response.status === 403 || response.status === 503) {
            candidate.rateLimitedUntil = Date.now() + 60000;
            candidate.status = response.status === 403 ? 'ERROR' : 'RATE_LIMITED';
            candidate.lastError = `HTTP ${response.status}`;
            lastErrorMsg = `Key ${maskApiKey(candidate.key)} hit ${response.status}`;
            console.warn(`[GoogleTTS] Key ${maskApiKey(candidate.key)} hit ${response.status}. Rotating...`);
            continue;
          }

          if (!response.ok) {
            const errText = await response.text();
            candidate.status = 'ERROR';
            candidate.lastError = `HTTP ${response.status}: ${errText.slice(0, 80)}`;
            lastErrorMsg = errText;
            console.warn(`[GoogleTTS] Key ${maskApiKey(candidate.key)} error (${response.status}):`, errText);
            continue;
          }

          const data = await response.json();
          const audioContent = data.audioContent;
          if (audioContent) {
            candidate.status = 'READY';
            candidate.lastError = undefined;
            this.setCache(cacheKey, audioContent);
            return audioContent;
          }
        } catch (netErr: any) {
          candidate.lastError = netErr?.message || 'Network error';
          lastErrorMsg = netErr?.message || 'Network error';
          console.warn(`[GoogleTTS] Key ${maskApiKey(candidate.key)} network error:`, netErr);
          continue;
        }
      } else if (candidate.type === 'GEMINI_AI_STUDIO') {
        try {
          const wavDataUri = await this.synthesizeWithGeminiTTS(cleanText, candidate.key, effectiveVoice);
          if (wavDataUri) {
            candidate.status = 'READY';
            candidate.lastError = undefined;
            this.setCache(cacheKey, wavDataUri);
            return wavDataUri;
          }
        } catch (geminiErr: any) {
          const errMsg = geminiErr?.message || '';
          lastErrorMsg = errMsg;
          if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            candidate.rateLimitedUntil = Date.now() + 60000;
            candidate.status = 'RATE_LIMITED';
            candidate.lastError = '429 Quota Exceeded';
          } else {
            candidate.rateLimitedUntil = Date.now() + 60000;
            candidate.status = 'ERROR';
            candidate.lastError = errMsg.slice(0, 80);
          }
          console.warn(`[GeminiTTS] Key ${maskApiKey(candidate.key)} failed. Rotating...`, errMsg);
          continue;
        }
      }
    }

    throw new Error(`All ${candidateKeys.length} Google/Gemini TTS keys in pool failed. Last error: ${lastErrorMsg || 'Unknown error'}`);
  }

  private playUrl(url: string, speed: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.playbackRate = speed;
      this.currentAudio = audio;
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.play().catch(reject);
    });
  }

  private playBase64(base64Audio: string, speed: number = 1.0): Promise<void> {
    return new Promise((resolve, reject) => {
      const dataUri = base64Audio.startsWith('data:') ? base64Audio : `data:audio/mp3;base64,${base64Audio}`;
      const audio = new Audio(dataUri);
      audio.playbackRate = speed;
      this.currentAudio = audio;
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.play().catch(reject);
    });
  }

  private playBrowserTts(text: string, voiceName: string, speed: number): Promise<void> {
    const cleanText = sanitizeSpeechText(text);
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      if (window.speechSynthesis.resume) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = speed;

      const isVi = voiceName.startsWith('vi') || isVietnameseText(cleanText);
      utterance.lang = isVi ? 'vi-VN' : 'en-US';

      if (isVi) {
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find(v => v.lang.startsWith('vi') || v.lang.replace('_', '-').startsWith('vi'));
        if (viVoice) {
          utterance.voice = viVoice;
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  stop() {
    this.activeSequenceId++; // Invalidate any in-flight bilingual timeouts or sequences
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.setAudioLoading(false);
  }
}

export const audioPlayer = new AudioPlayService();
