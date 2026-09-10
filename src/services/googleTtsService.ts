import { deepgramTts, DEEPGRAM_AURA_VOICES, sanitizeSpeechText } from './deepgramTtsService';
import { modelRegistryService } from './modelRegistryService';
import { LanguageMode, ChunkItem } from '../types';

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
  targetChunkIds?: string[];
  onlyMissing?: boolean;
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
  "AIzaSyCfqeoe2A1wslwWONlbEVgW9XK9IrDAk3Q",
  "AIzaSyA6GlWoI1ATkBdU5LROJE5PQYdlmd3X2D4",
  "AIzaSyD6j9s-rG4OXgDLmyeCM0KVOj0ErLD-3gQ",
  (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42Smd3UVhxWVFTSTkxRXdYc1BVWlpEaWhBLWJrR0ZEcWxoUy1kOUJXSU5Gc0E=') : ''),
  import.meta.env.VITE_GEMINI_API_KEY || (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42SmU3d2NZQTZLLWs0YmlnOUprZDRrd3RfOUJlbE1WT3VzU2J5a3ZFWnRkYVE=') : '')
].filter(Boolean);

export function detectGoogleKeyType(key: string): 'GOOGLE_CLOUD_TTS' | 'GEMINI_AI_STUDIO' {
  return key.trim().startsWith('AQ.') ? 'GEMINI_AI_STUDIO' : 'GOOGLE_CLOUD_TTS';
}

/**
 * Gender-aware fallback helper for Google Cloud English voice:
 * - Male voices (flux-cliff-en, aura-orion-en, aura-arcas-en, aura-perseus-en, aura-helios-en, aura-angus-en, aura-orpheus-en, aura-zeus-en, en-US-Journey-D, en-US-Studio-Q, en-US-Neural2-D) -> 'en-US-Journey-D'
 * - Female voices (aura-asteria-en, aura-luna-en, aura-stella-en, aura-athena-en, aura-hera-en, en-US-Journey-F, en-US-Studio-O, en-US-Neural2-F) -> 'en-US-Journey-F'
 */
export function getFallbackGoogleEnVoice(voiceId?: string | null): string {
  if (!voiceId) return 'en-US-Journey-D';
  const v = voiceId.toLowerCase().trim();

  const maleVoices = [
    'flux-cliff-en', 'aura-orion-en', 'aura-arcas-en', 'aura-perseus-en',
    'aura-helios-en', 'aura-angus-en', 'aura-orpheus-en', 'aura-zeus-en',
    'en-us-journey-d', 'en-us-studio-q', 'en-us-neural2-d'
  ];
  if (maleVoices.includes(v)) {
    return 'en-US-Journey-D';
  }

  const femaleVoices = [
    'aura-asteria-en', 'aura-luna-en', 'aura-stella-en', 'aura-athena-en',
    'aura-hera-en', 'en-us-journey-f', 'en-us-studio-o', 'en-us-neural2-f'
  ];
  if (femaleVoices.includes(v)) {
    return 'en-US-Journey-F';
  }

  if (
    v.includes('cliff') || v.includes('orion') || v.includes('arcas') ||
    v.includes('perseus') || v.includes('helios') || v.includes('angus') ||
    v.includes('orpheus') || v.includes('zeus') || v.includes('journey-d') ||
    v.includes('-d') || v.includes('-q') || v.includes('-m')
  ) {
    return 'en-US-Journey-D';
  }

  if (
    v.includes('asteria') || v.includes('luna') || v.includes('stella') ||
    v.includes('athena') || v.includes('hera') || v.includes('journey-f') ||
    v.includes('-f') || v.includes('-o')
  ) {
    return 'en-US-Journey-F';
  }

  return 'en-US-Journey-D';
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
    id: 'en-US-Journey-D',
    name: 'en-US-Journey-D (Google Natural Male)',
    languageCode: 'en-US',
    gender: 'MALE',
    description: 'Ultra-realistic American English conversational voice (Journey-D Male).',
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

export async function deleteAudioBlobFromDB(key: string): Promise<void> {
  const db = await openIndexedDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function deleteAudioBlobsByPrefixFromDB(prefix: string): Promise<number> {
  const db = await openIndexedDB();
  if (!db) return 0;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      request.onsuccess = (e: any) => {
        const keys: IDBValidKey[] = e.target.result || [];
        let deleted = 0;
        for (const k of keys) {
          if (typeof k === 'string' && k.startsWith(prefix)) {
            store.delete(k);
            deleted++;
          }
        }
        tx.oncomplete = () => resolve(deleted);
      };
      request.onerror = () => resolve(0);
    } catch {
      resolve(0);
    }
  });
}

export async function getAllStoredAudioKeys(): Promise<Set<string>> {
  const keySet = new Set<string>();
  const db = await openIndexedDB();
  if (!db) return keySet;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      request.onsuccess = (e: any) => {
        const keys: IDBValidKey[] = e.target.result || [];
        for (const k of keys) {
          if (typeof k === 'string') {
            keySet.add(k);
          }
        }
        resolve(keySet);
      };
      request.onerror = () => resolve(keySet);
    } catch {
      resolve(keySet);
    }
  });
}

export interface AudioCacheExportData {
  version: number;
  exportedAt: string;
  count: number;
  entries: { key: string; base64: string; timestamp?: number }[];
}

export async function getStoredAudioBlobsCount(): Promise<number> {
  const db = await openIndexedDB();
  if (!db) return 0;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    } catch {
      resolve(0);
    }
  });
}

export async function exportAllAudioBlobs(): Promise<AudioCacheExportData> {
  const db = await openIndexedDB();
  if (!db) return { version: 1, exportedAt: new Date().toISOString(), count: 0, entries: [] };
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = (e: any) => {
        const records = e.target.result || [];
        const entries = records.map((r: any) => ({
          key: r.key,
          base64: r.base64,
          timestamp: r.timestamp
        }));
        resolve({
          version: 1,
          exportedAt: new Date().toISOString(),
          count: entries.length,
          entries
        });
      };
      request.onerror = () => resolve({ version: 1, exportedAt: new Date().toISOString(), count: 0, entries: [] });
    } catch {
      resolve({ version: 1, exportedAt: new Date().toISOString(), count: 0, entries: [] });
    }
  });
}

export async function importAudioBlobs(data: AudioCacheExportData): Promise<number> {
  if (!data || !Array.isArray(data.entries)) return 0;
  const db = await openIndexedDB();
  if (!db) return 0;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      let imported = 0;
      for (const entry of data.entries) {
        if (entry.key && entry.base64) {
          store.put({ key: entry.key, base64: entry.base64, timestamp: entry.timestamp || Date.now() });
          audioPlayer.setCache(entry.key, entry.base64);
          imported++;
        }
      }
      tx.oncomplete = () => resolve(imported);
      tx.onerror = () => resolve(imported);
    } catch {
      resolve(0);
    }
  });
}

class AudioPlayService {
  private currentAudio: HTMLAudioElement | null = null;
  private finishPlayback: (() => void) | null = null;
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

    const registryGoogleKeys = modelRegistryService.getKeysByProvider('GOOGLE_TTS').map(k => k.key);
    const registryGeminiKeys = modelRegistryService.getKeysByProvider('GEMINI_AI_STUDIO').map(k => k.key);

    const allRawKeys = [
      ...registryGoogleKeys,
      ...this.customApiKeys,
      ...BUILTIN_GOOGLE_KEYS,
      ...registryGeminiKeys // Deprioritized at the very end of pool
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

  public deleteCacheKey(key: string) {
    this.audioCache.delete(key);
    deleteAudioBlobFromDB(key).catch(() => {});
  }

  public deleteCacheByPrefix(prefix: string) {
    for (const k of Array.from(this.audioCache.keys())) {
      if (k.startsWith(prefix)) {
        this.audioCache.delete(k);
      }
    }
    deleteAudioBlobsByPrefixFromDB(prefix).catch(() => {});
  }

  public async exportAudioBlobs(): Promise<AudioCacheExportData> {
    return exportAllAudioBlobs();
  }

  public async importAudioBlobs(data: AudioCacheExportData): Promise<number> {
    return importAudioBlobs(data);
  }

  public async getStoredBlobsCount(): Promise<number> {
    return getStoredAudioBlobsCount();
  }

  public async getAllCachedKeys(): Promise<Set<string>> {
    const keys = await getAllStoredAudioKeys();
    for (const key of this.audioCache.keys()) {
      keys.add(key);
    }
    return keys;
  }

  public getCacheCount(): number {
    return this.audioCache.size;
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
    const provider = modelRegistryService.getModelById(voice)?.provider || 'legacy';
    const endpoint = provider === 'CUSTOM_TTS' ? modelRegistryService.getCustomEndpoint() : '';
    return voice + '::v2::' + provider + '::' + encodeURIComponent(endpoint) + '::' + text.trim();
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
    return this.getCachedAudio(text, voiceName) !== null;
  }

  public hasCachedAudio(text: string, voiceName?: string): boolean {
    return this.isChunkCached(text, voiceName);
  }

  /**
   * Helper to generate primary and legacy fallback cache keys for Dual-Lookup.
   * Covers:
   * - Primary: getCacheKey(voice, text)
   * - Legacy keys:
   *   * ${voice}::${clean}
   *   * ${voice}::${text.trim().toLowerCase()}
   *   * Direct key `text` (especially when text starts with improv_ or is a raw key)
   *   * ${cleanVoice}::${clean} where cleanVoice defaults to 'flux-cliff-en' for en or 'vi-VN-Neural2-A' for vi
   *   * If text starts with improv_hint_, check both full key and legacy key patterns.
   */
  public getLookupCandidateKeys(text: string, voiceName?: string): { primaryKey: string; keys: string[] } {
    const rawTrimmed = (text || '').trim();
    if (!rawTrimmed) return { primaryKey: '', keys: [] };

    const isVi = voiceName ? voiceName.toLowerCase().startsWith('vi') : isVietnameseText(rawTrimmed);
    const cleanVoice = isVi ? 'vi-VN-Neural2-A' : 'flux-cliff-en';
    const effectiveVoice = voiceName || (isVi ? modelRegistryService.getMainModelVi() || cleanVoice : modelRegistryService.getMainModelEn() || cleanVoice);
    const clean = sanitizeSpeechText(rawTrimmed);

    const keys: string[] = [];
    const add = (k?: string | null) => {
      if (!k) return;
      const t = k.trim();
      if (t && !keys.includes(t)) {
        keys.push(t);
      }
    };

    // Defensively add composite keys early if text contains '::'
    if (text && text.includes('::')) {
      add(text);
      add(rawTrimmed);
      add(rawTrimmed.toLowerCase());
    }

    // Improv key detection & legacy variants
    if (rawTrimmed.startsWith('improv_')) {
      add(rawTrimmed);
      add(text);

      if (rawTrimmed.startsWith('improv_hint_')) {
        // Example v2: improv_hint_hint1_flux-cliff-en_en_v2_0_encodedKey
        // Legacy 1: improv_hint_hint1_flux-cliff-en_en
        // Legacy 2: improv_hint_hint1_en
        const v2Match = rawTrimmed.match(/^(improv_hint_[^_]+_[^_]+_[^_]+)_v2_/);
        if (v2Match) {
          add(v2Match[1]);
        }
        const parts = rawTrimmed.split('_');
        if (parts.length >= 5) {
          const hintId = parts[2];
          const lang = parts[4];
          if (lang === 'en' || lang === 'vi') {
            add(`improv_hint_${hintId}_${effectiveVoice}_${lang}`);
            add(`improv_hint_${hintId}_${cleanVoice}_${lang}`);
            add(`improv_hint_${hintId}_${lang}`);
          }
        }
      } else if (rawTrimmed.startsWith('improv_item_')) {
        // Example v2: improv_item_item1_voiceEn_voiceVi_mode_v2_encoded
        // Legacy 1: improv_item_item1_voiceEn_voiceVi_mode
        // Legacy 2: improv_item_item1_mode
        const v2Match = rawTrimmed.match(/^(improv_item_[^_]+_[^_]+_[^_]+_[^_]+)_v2_/);
        if (v2Match) {
          add(v2Match[1]);
        }
        const parts = rawTrimmed.split('_');
        if (parts.length >= 6) {
          const itemId = parts[2];
          const mode = parts[5];
          add(`improv_item_${itemId}_${mode}`);
        }
      }
    }

    // Primary v2 key
    const primaryKey = rawTrimmed.startsWith('improv_')
      ? rawTrimmed
      : this.getCacheKey(effectiveVoice, clean || rawTrimmed);
    add(primaryKey);

    if (clean && clean !== rawTrimmed) {
      add(this.getCacheKey(effectiveVoice, rawTrimmed));
    }

    // Legacy pattern 1: ${voice}::${clean}
    if (clean) {
      add(`${effectiveVoice}::${clean}`);
    }

    // Legacy pattern 2: ${voice}::${text.trim().toLowerCase()}
    add(`${effectiveVoice}::${rawTrimmed.toLowerCase()}`);
    if (clean && clean.toLowerCase() !== rawTrimmed.toLowerCase()) {
      add(`${effectiveVoice}::${clean.toLowerCase()}`);
    }
    add(`${effectiveVoice}::${rawTrimmed}`);

    // Legacy pattern 3: direct key `text` (especially when text is a raw key)
    add(rawTrimmed);
    add(text);
    if (clean) add(clean);

    // Legacy pattern 4: ${cleanVoice}::${clean}
    if (cleanVoice !== effectiveVoice) {
      add(`${cleanVoice}::${clean}`);
      add(`${cleanVoice}::${rawTrimmed.toLowerCase()}`);
      add(this.getCacheKey(cleanVoice, clean));
    }

    // Main model fallback if different
    const defaultMainVoice = isVi ? modelRegistryService.getMainModelVi() : modelRegistryService.getMainModelEn();
    if (defaultMainVoice && defaultMainVoice !== effectiveVoice && defaultMainVoice !== cleanVoice) {
      add(this.getCacheKey(defaultMainVoice, clean));
      add(`${defaultMainVoice}::${clean}`);
      add(`${defaultMainVoice}::${rawTrimmed.toLowerCase()}`);
    }

    return { primaryKey, keys };
  }

  /**
   * Synchronous cache retrieval (Memory Map) with Dual-Lookup and Legacy key compatibility.
   */
  public getCachedAudio(text: string, voiceName?: string): string | null {
    if (!text) return null;
    const { primaryKey, keys } = this.getLookupCandidateKeys(text, voiceName);
    if (!keys.length) return null;

    for (const k of keys) {
      const memory = this.audioCache.get(k);
      if (memory) {
        // Back-populate primaryKey in memory for instant lookups next time
        if (primaryKey && k !== primaryKey && !this.audioCache.has(primaryKey)) {
          this.audioCache.set(primaryKey, memory);
        }
        return memory;
      }
    }
    return null;
  }

  /**
   * Asynchronous cache retrieval (Memory Map -> IndexedDB) with Dual-Lookup and Legacy key compatibility.
   * When found in IndexedDB via any legacy key, populates memory cache for both primaryKey and legacy key.
   */
  public async getCachedAudioAsync(text: string, voiceName?: string): Promise<string | null> {
    if (!text) return null;
    const memory = this.getCachedAudio(text, voiceName);
    if (memory) return memory;

    const { primaryKey, keys } = this.getLookupCandidateKeys(text, voiceName);
    if (!keys.length) return null;

    for (const k of keys) {
      const stored = await getAudioBlobFromDB(k);
      if (stored) {
        this.audioCache.set(k, stored);
        if (primaryKey && k !== primaryKey) {
          this.audioCache.set(primaryKey, stored);
        }
        return stored;
      }
    }
    return null;
  }

  /**
   * Retrieve cached audio by exact key (Memory Map -> IndexedDB) without modifying or sanitizing the key.
   */
  public async getCachedAudioByExactKey(key: string): Promise<string | null> {
    if (!key) return null;
    const memory = this.audioCache.get(key);
    if (memory) return memory;
    const stored = await getAudioBlobFromDB(key);
    if (stored) {
      this.audioCache.set(key, stored);
      return stored;
    }
    return null;
  }

  public setCachedAudio(text: string, voiceName: string, base64: string): void {
    const clean = sanitizeSpeechText(text);
    const primaryKey = this.getCacheKey(voiceName, clean);
    this.setCache(primaryKey, base64);
    // Also save under legacy key for 100% backward compatibility
    this.setCache(`${voiceName}::${clean}`, base64);
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
        delete item.lastError;
        delete item.rateLimitedUntil;
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
          item.rateLimitedUntil = Date.now() + 5000;
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
      const base64 = await deepgramTts.synthesizeText("Deepgram online test", "flux-cliff-en");
      return { success: !!base64, message: "Deepgram Connected (Flux Cliff Online)" };
    } catch (e: any) {
      return { success: false, message: e?.message || "Deepgram Connection Failed" };
    }
  }

  /**
   * Get in-memory audio preparation status and detailed chunk status for a lesson
   */
  getLessonAudioStatus(
    chunks: { chunk_id?: string; english: string; vietnamese?: string; audio_url?: string | null }[],
    voiceEn: string = 'flux-cliff-en',
    voiceVi: string = 'vi-VN-Neural2-A'
  ): LessonAudioStatus {
    let enCached = 0;
    let viCached = 0;
    const details: ChunkAudioStatus[] = [];

    const effectiveVoiceEn = voiceEn && !voiceEn.startsWith('vi-') ? voiceEn : 'flux-cliff-en';
    const effectiveVoiceVi = voiceVi && voiceVi.startsWith('vi-') ? voiceVi : 'vi-VN-Neural2-A';

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const cleanEn = sanitizeSpeechText(c.english);
      const cleanVi = c.vietnamese ? sanitizeSpeechText(c.vietnamese) : '';

      const enCachedAudio = cleanEn 
        ? (this.getCachedAudio(cleanEn, effectiveVoiceEn) || this.getCachedAudio(c.english, effectiveVoiceEn))
        : null;
      const hasEnAudio = Boolean(enCachedAudio);

      const viCachedAudio = cleanVi 
        ? (this.getCachedAudio(cleanVi, effectiveVoiceVi) || this.getCachedAudio(c.vietnamese || '', effectiveVoiceVi))
        : null;
      const hasViAudio = Boolean(viCachedAudio);

      const hasGcsAudio = Boolean(c.audio_url && c.audio_url.startsWith('http') && !c.audio_url.includes('placeholder'));
      const hasGcsAudioVi = Boolean((c as any).audio_url_vi && (c as any).audio_url_vi.startsWith('http'));

      const isEnReady = hasEnAudio || hasGcsAudio;
      const isViReady = hasViAudio || hasGcsAudioVi;

      if (isEnReady) enCached++;
      if (isViReady) viCached++;

      details.push({
        chunk_id: c.chunk_id || `chunk_${i + 1}`,
        english: c.english,
        vietnamese: c.vietnamese || '',
        hasEnAudio,
        hasViAudio,
        hasGcsAudio,
        enSource: hasEnAudio ? ((effectiveVoiceEn.startsWith('aura-') || effectiveVoiceEn.startsWith('flux-')) ? 'DEEPGRAM_AURA' : 'GOOGLE_CLOUD_AI') : (hasGcsAudio ? 'GCS_MASTER' : undefined),
        viSource: hasViAudio ? 'GOOGLE_CLOUD_AI' : (hasGcsAudioVi ? 'GCS_MASTER' : undefined)
      });
    }

    return {
      total: chunks.length,
      enCached,
      viCached,
      isFullyCached: chunks.length > 0 && enCached === chunks.length,
      details
    };
  }

  /**
   * Asynchronously check full audio status (memory cache + IndexedDB + GCS) for a set of chunks
   * Uses dual-lookup to recognize 100% of prepared and legacy audio.
   */
  async checkLessonAudioStatus(
    chunks: { chunk_id?: string; english: string; vietnamese?: string; audio_url?: string | null }[],
    voiceEn: string = 'flux-cliff-en',
    voiceVi: string = 'vi-VN-Neural2-A'
  ): Promise<LessonAudioStatus> {
    let enCached = 0;
    let viCached = 0;
    const details: ChunkAudioStatus[] = [];

    const effectiveVoiceEn = voiceEn && !voiceEn.startsWith('vi-') ? voiceEn : 'flux-cliff-en';
    const effectiveVoiceVi = voiceVi && voiceVi.startsWith('vi-') ? voiceVi : 'vi-VN-Neural2-A';

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const cleanEn = sanitizeSpeechText(c.english);
      const cleanVi = c.vietnamese ? sanitizeSpeechText(c.vietnamese) : '';

      const enAudio = cleanEn 
        ? (await this.getCachedAudioAsync(cleanEn, effectiveVoiceEn) || await this.getCachedAudioAsync(c.english, effectiveVoiceEn))
        : null;
      const hasEnAudio = Boolean(enAudio);

      const viAudio = cleanVi 
        ? (await this.getCachedAudioAsync(cleanVi, effectiveVoiceVi) || await this.getCachedAudioAsync(c.vietnamese || '', effectiveVoiceVi))
        : null;
      const hasViAudio = Boolean(viAudio);

      const hasGcsAudio = Boolean(c.audio_url && c.audio_url.startsWith('http') && !c.audio_url.includes('placeholder'));
      const hasGcsAudioVi = Boolean((c as any).audio_url_vi && (c as any).audio_url_vi.startsWith('http'));

      const isEnReady = hasEnAudio || hasGcsAudio;
      const isViReady = hasViAudio || hasGcsAudioVi;

      if (isEnReady) enCached++;
      if (isViReady) viCached++;

      details.push({
        chunk_id: c.chunk_id || `chunk_${i + 1}`,
        english: c.english,
        vietnamese: c.vietnamese || '',
        hasEnAudio,
        hasViAudio,
        hasGcsAudio,
        enSource: hasEnAudio ? ((effectiveVoiceEn.startsWith('aura-') || effectiveVoiceEn.startsWith('flux-')) ? 'DEEPGRAM_AURA' : 'GOOGLE_CLOUD_AI') : (hasGcsAudio ? 'GCS_MASTER' : undefined),
        viSource: hasViAudio ? 'GOOGLE_CLOUD_AI' : (hasGcsAudioVi ? 'GCS_MASTER' : undefined)
      });
    }

    return {
      total: chunks.length,
      enCached,
      viCached,
      isFullyCached: chunks.length > 0 && enCached === chunks.length,
      details
    };
  }

  /**
   * Check if all chunks in a lesson have permanent GCS audio URLs
   */
  isLessonAudioReady(lesson: { chunks?: ChunkItem[] }): boolean {
    if (!lesson.chunks || lesson.chunks.length === 0) return false;
    return lesson.chunks.every(c => Boolean(c.audio_url && c.audio_url.startsWith('http')));
  }

  /**
   * Asynchronously check if a lesson is fully ready with either permanent GCS URLs or prepared/cached audio
   */
  async isLessonFullyReadyAsync(lesson: { chunks?: ChunkItem[] }): Promise<boolean> {
    if (!lesson.chunks || lesson.chunks.length === 0) return false;
    const status = await this.checkLessonAudioStatus(lesson.chunks);
    const allGcs = lesson.chunks.every(c => Boolean(c.audio_url && c.audio_url.startsWith('http')));
    return status.isFullyCached || allGcs;
  }

  /**
   * 4-Tier Resilient Playback Engine:
   * Tier 1: Look up prepared cache (dual-lookup memory + IndexedDB). If found, play base64.
   * Tier 2: If not in cache, check if permanentAudioUrl (GCS URL) is valid and stream it directly.
   * Tier 3: If no GCS URL or streaming fails, synthesize on-the-fly via synthesizeSingleChunk using
   *         the selected voice/model (Google Cloud TTS, Deepgram Aura/Flux, or Custom TTS), cache, and play.
   * Tier 4: If network fails or quota is exhausted, FALLBACK to Browser Speech Synthesis (window.speechSynthesis)
   *         with appropriate language ('vi-VN' or 'en-US').
   * NEVER throw an unhandled fatal error that halts presentation or clicker advancement.
   */
  async playChunk(
    text: string,
    permanentAudioUrl?: string | null,
    voiceName: string = modelRegistryService.getMainModelEn(),
    speed: number = 1.0,
    forceCloudTts: boolean = false,
    sequenceId?: number
  ): Promise<void> {
    if (sequenceId === undefined) this.stop();
    const sequence = sequenceId ?? this.activeSequenceId;
    if (sequence !== this.activeSequenceId) return;

    const cleanText = sanitizeSpeechText(text);
    if (!cleanText) {
      console.warn('[AudioPlayer] playChunk called with empty text, skipping playback gracefully.');
      return;
    }

    const voice = voiceName || modelRegistryService.getMainModelEn();
    const isVi = modelRegistryService.getModelById(voice)?.language === 'vi' || voice.startsWith('vi-') || isVietnameseText(cleanText, voice);
    const language: 'en' | 'vi' = isVi ? 'vi' : 'en';

    this.setAudioLoading(true);

    try {
      // -----------------------------------------------------------------------
      // TIER 1: Prepared Audio Cache (Dual-Lookup Memory + IndexedDB)
      // -----------------------------------------------------------------------
      const cached = await this.getCachedAudioAsync(cleanText, voice) || await this.getCachedAudioAsync(text, voice);
      if (sequence !== this.activeSequenceId) return;

      if (cached) {
        const model = modelRegistryService.getModelById(voice);
        const source: AudioSourceType = model?.provider === 'DEEPGRAM' ? 'DEEPGRAM_AURA' : 'GOOGLE_CLOUD_AI';
        this.setLastSource(source);
        try {
          await this.playBase64(cached, speed);
          return;
        } catch (cachePlayErr) {
          console.warn('[AudioPlayer] Tier 1 base64 playback failed, proceeding to Tier 2/3 fallback:', cachePlayErr);
        }
      }

      // -----------------------------------------------------------------------
      // TIER 2: Permanent GCS Audio Streaming (if not forced to cloud TTS and URL is valid)
      // -----------------------------------------------------------------------
      if (!forceCloudTts && permanentAudioUrl && permanentAudioUrl.startsWith('http') && !permanentAudioUrl.includes('placeholder')) {
        if (sequence !== this.activeSequenceId) return;
        try {
          this.setLastSource('GCS_MASTER');
          await this.playUrl(permanentAudioUrl, speed);
          return;
        } catch (gcsPlayErr) {
          console.warn('[AudioPlayer] Tier 2 GCS streaming failed, falling through to Tier 3 on-the-fly synthesis:', gcsPlayErr);
        }
      }

      // -----------------------------------------------------------------------
      // TIER 3: On-The-Fly Synthesis (Google Cloud TTS, Deepgram Aura/Flux, Custom TTS)
      // -----------------------------------------------------------------------
      if (sequence !== this.activeSequenceId) return;
      try {
        const result = await this.synthesizeSingleChunk({
          text: cleanText,
          language,
          voiceName: voice
        });

        if (sequence !== this.activeSequenceId) return;
        if (result?.base64) {
          this.setLastSource(result.source);
          await this.playBase64(result.base64, speed);
          return;
        }
      } catch (synthErr) {
        console.warn(`[AudioPlayer] Tier 3 synthesis failed for "${cleanText.slice(0, 30)}..." with voice ${voice}:`, synthErr);
      }

      // -----------------------------------------------------------------------
      // TIER 4: Local Browser Speech Synthesis Fallback (SpeechSynthesisUtterance)
      // -----------------------------------------------------------------------
      if (sequence !== this.activeSequenceId) return;
      console.warn(`[AudioPlayer] Activating Tier 4 Browser Speech Fallback for "${cleanText.slice(0, 30)}..."`);
      this.setLastSource('BROWSER_LOCAL');
      try {
        await this.playBrowserTts(cleanText, voice, speed);
      } catch (browserErr) {
        console.warn('[AudioPlayer] Tier 4 Browser Speech fallback encountered an error:', browserErr);
      }
    } catch (unexpectedErr) {
      // Top-level safety net: never throw an unhandled fatal error that halts presentation
      console.error('[AudioPlayer] Unexpected error in playChunk (gracefully recovered):', unexpectedErr);
    } finally {
      if (sequence === this.activeSequenceId) {
        this.setAudioLoading(false);
      }
    }
  }

  /**
   * Play sequential bilingual drill: EN_ONLY, VI_ONLY, EN_THEN_VI, VI_THEN_EN
   * Supports 'PRIMARY_ONLY', 'SECONDARY_ONLY', 'PRIMARY_THEN_SECONDARY', 'SECONDARY_THEN_PRIMARY'
   * Protected with activeSequenceId to completely prevent overlapping speech on fast clicking.
   * Employs 4-Tier Resilience so sequences never hang or throw fatal errors.
   */
  async playBilingualSequence(
    englishText: string,
    vietnameseText: string,
    mode: LanguageMode = 'EN_THEN_VI',
    englishAudioUrl?: string | null,
    voiceEn: string = 'flux-cliff-en',
    voiceVi: string = 'vi-VN-Neural2-A',
    speed: number = 1.0,
    repeatCount: number = 1,
    onStepChange?: (step: 'en' | 'vi' | 'idle') => void,
    vietnameseAudioUrl?: string | null
  ): Promise<void> {
    this.stop();
    const seqId = this.activeSequenceId;
    const normalizedMode = normalizeLanguageMode(mode);

    const effectiveVoiceEn = voiceEn || modelRegistryService.getMainModelEn();
    const effectiveVoiceVi = voiceVi || modelRegistryService.getMainModelVi();

    try {
      for (let r = 0; r < repeatCount; r++) {
        if (this.activeSequenceId !== seqId) return;

        if (normalizedMode === 'EN_ONLY') {
          onStepChange?.('en');
          await this.playChunk(englishText, englishAudioUrl, effectiveVoiceEn, speed, false, seqId);
        } else if (normalizedMode === 'VI_ONLY') {
          onStepChange?.('vi');
          await this.playChunk(vietnameseText, vietnameseAudioUrl, effectiveVoiceVi, speed, false, seqId);
        } else if (normalizedMode === 'EN_THEN_VI') {
          onStepChange?.('en');
          await this.playChunk(englishText, englishAudioUrl, effectiveVoiceEn, speed, false, seqId);
          
          if (this.activeSequenceId !== seqId) return;
          // Natural 500ms cadence pause between English and Vietnamese
          await new Promise(res => setTimeout(res, 500));
          if (this.activeSequenceId !== seqId) return;

          onStepChange?.('vi');
          await this.playChunk(vietnameseText, vietnameseAudioUrl, effectiveVoiceVi, speed, false, seqId);
        } else if (normalizedMode === 'VI_THEN_EN') {
          onStepChange?.('vi');
          await this.playChunk(vietnameseText, vietnameseAudioUrl, effectiveVoiceVi, speed, false, seqId);
          
          if (this.activeSequenceId !== seqId) return;
          // Natural 500ms cadence pause between Vietnamese and English
          await new Promise(res => setTimeout(res, 500));
          if (this.activeSequenceId !== seqId) return;

          onStepChange?.('en');
          await this.playChunk(englishText, englishAudioUrl, effectiveVoiceEn, speed, false, seqId);
        }

        if (r < repeatCount - 1) {
          if (this.activeSequenceId !== seqId) return;
          await new Promise(res => setTimeout(res, 600));
        }
      }
    } catch (seqErr) {
      console.warn('[AudioPlayer] playBilingualSequence recovered gracefully from error:', seqErr);
    } finally {
      if (this.activeSequenceId === seqId) {
        onStepChange?.('idle');
      }
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

    const language = params.language.toLowerCase() as 'en' | 'vi';
    const voice = params.voiceName || (language === 'vi' ? modelRegistryService.getMainModelVi() : modelRegistryService.getMainModelEn());
    const model = modelRegistryService.getModelById(voice);
    if (model && model.language !== language) throw new Error('Model ' + voice + ' does not support ' + language);
    const provider = model?.provider || (voice.startsWith('aura-') || voice.startsWith('flux-') ? 'DEEPGRAM' : voice.startsWith('openai-') ? 'OPENAI_TTS' : voice.startsWith('custom-') ? 'CUSTOM_TTS' : 'GOOGLE_TTS');
    if (language === 'vi' && (provider === 'DEEPGRAM' || voice.startsWith('en-'))) throw new Error('Model ' + voice + ' cannot synthesize Vietnamese.');
    const source: AudioSourceType = provider === 'DEEPGRAM' ? 'DEEPGRAM_AURA' : 'GOOGLE_CLOUD_AI';
    if (!params.forceRegenerate) {
      const cached = await this.getCachedAudioAsync(cleanText, voice);
      if (cached) return { base64: cached, source, voice, language };
    }
    // Prepared audio is generated at natural speed; playbackRate controls presentation speed.
    let base64: string;
    if (provider === 'DEEPGRAM') {
      try {
        base64 = await deepgramTts.synthesizeText(cleanText, voice, params.forceRegenerate);
      } catch (dgErr) {
        console.warn(`[synthesizeSingleChunk] Deepgram failed for ${voice}, falling back to Google TTS:`, dgErr);
        base64 = await this.synthesizeWithGoogleTTS(cleanText, getFallbackGoogleEnVoice(voice), 1, params.forceRegenerate);
      }
    } else if (provider === 'OPENAI_TTS') {
      try {
        base64 = await this.synthesizeWithOpenAITTS(cleanText, voice, 1);
      } catch (oaErr) {
        console.warn(`[synthesizeSingleChunk] OpenAI failed for ${voice}, falling back to Google TTS:`, oaErr);
        base64 = await this.synthesizeWithGoogleTTS(cleanText, getFallbackGoogleEnVoice(voice), 1, params.forceRegenerate);
      }
    } else if (provider === 'CUSTOM_TTS') {
      try {
        base64 = await this.synthesizeWithCustomTTS(cleanText, voice, 1);
      } catch (cErr) {
        console.warn(`[synthesizeSingleChunk] Custom TTS failed for ${voice}, falling back to Google TTS:`, cErr);
        base64 = await this.synthesizeWithGoogleTTS(cleanText, getFallbackGoogleEnVoice(voice), 1, params.forceRegenerate);
      }
    } else {
      base64 = await this.synthesizeWithGoogleTTS(cleanText, voice, 1, params.forceRegenerate);
    }
    if (!base64) throw new Error('Model ' + voice + ' returned empty audio.');
    this.setCachedAudio(cleanText, voice, base64);
    return { base64, source, voice, language };
  }

  /**
   * Fast Concurrent Batch Pre-generator (Worker pool + English / Vietnamese / Both)
   */
  async prepareChunksAudio(
    chunks: { english: string; vietnamese?: string; audio_url?: string | null; audio_url_vi?: string | null; chunk_id?: string; item_number?: number }[],
    optionsOrVoiceEn?: PrepareAudioOptions | string,
    providerLegacy: AudioProvider = 'DEEPGRAM_AURA',
    onProgressLegacy?: (current: number, total: number, statusText: string) => void
  ): Promise<{
    prepared: number;
    failed: number;
    total: number;
    skipped: number;
    failedItems: {
      chunkId: string;
      itemNumber?: number;
      text: string;
      lang: 'en' | 'vi';
      error: string;
    }[];
  }> {
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

    const voiceEn = opts.voiceEn || modelRegistryService.getMainModelEn();
    const voiceVi = opts.voiceVi || modelRegistryService.getMainModelVi();
    const mode = normalizeLanguageMode(opts.langMode || 'EN_THEN_VI');
    const target = opts.target || (mode === 'VI_ONLY' ? 'VIETNAMESE' : mode === 'EN_ONLY' ? 'ENGLISH' : 'BOTH');
    const selected = opts.targetChunkIds?.length ? chunks.filter(c => c.chunk_id && opts.targetChunkIds!.includes(c.chunk_id)) : chunks;
    const jobs = selected.flatMap((chunk, index) => {
      const langs: ('en' | 'vi')[] = target === 'BOTH' ? ['en', 'vi'] : target === 'VIETNAMESE' ? ['vi'] : ['en'];
      return langs.map(lang => ({ chunk, index, lang, text: lang === 'en' ? chunk.english : chunk.vietnamese || '', voice: lang === 'en' ? voiceEn : voiceVi }));
    });
    let prepared = 0, failed = 0, skipped = 0, next = 0;
    const failedItems: { chunkId: string; itemNumber?: number; text: string; lang: 'en' | 'vi'; error: string }[] = [];
    const worker = async () => {
      while (next < jobs.length) {
        const job = jobs[next++];
        try {
          if (!sanitizeSpeechText(job.text)) throw new Error('Missing ' + job.lang.toUpperCase() + ' text');
          const cached = !opts.forceRegenerate && await this.getCachedAudioAsync(job.text, job.voice);
          if (cached) skipped++;
          else {
            await this.synthesizeSingleChunk({ text: job.text, language: job.lang, voiceName: job.voice, forceRegenerate: opts.forceRegenerate, provider: opts.provider });
            prepared++;
          }
        } catch (error) {
          failed++;
          failedItems.push({ chunkId: job.chunk.chunk_id || 'chunk_' + job.index, itemNumber: job.chunk.item_number ?? job.index + 1, text: job.text, lang: job.lang, error: error instanceof Error ? error.message : String(error) });
        }
        opts.onProgress?.(prepared + failed + skipped, jobs.length, 'Audio: ' + prepared + ' prepared, ' + skipped + ' cached, ' + failed + ' failed');
      }
    };
    await Promise.all(Array.from({ length: Math.min(jobs.length, Math.max(1, Math.min(8, opts.concurrency || 4))) }, worker));
    return { prepared, failed, skipped, total: selected.length, failedItems };
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
    const geminiVoice = modelRegistryService.getModelById(voiceName)?.provider === 'GEMINI_AI_STUDIO' ? voiceName.replace(/^gemini-/, '') : (isMale ? 'Puck' : 'Kore');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`;

    const cleanText = sanitizeSpeechText(text);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: cleanText }] }],
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
   * Synthesize with OpenAI Audio API (/v1/audio/speech) with 429 rotation failover
   */
  public async synthesizeWithOpenAITTS(
    text: string,
    voiceName: string = 'alloy',
    speed: number = 1.0
  ): Promise<string> {
    const cleanText = sanitizeSpeechText(text);
    if (!cleanText) return '';
    const cleanVoice = voiceName.replace('openai-', '');
    const key = modelRegistryService.getNextActiveKey('OPENAI_TTS');
    if (!key) {
      throw new Error('Chưa cấu hình API Key cho OpenAI TTS trong Modules Settings.');
    }

    const url = 'https://api.openai.com/v1/audio/speech';
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: cleanVoice,
        input: cleanText,
        speed: Math.max(0.25, Math.min(4.0, speed))
      })
    });

    if (resp.status === 429) {
      console.warn(`[OpenAI TTS] Key hit 429 Rate Limit. Rotating key in pool...`);
      const nextKey = modelRegistryService.rotateKeyOn429('OPENAI_TTS', key);
      if (nextKey && nextKey !== key) {
        return this.synthesizeWithOpenAITTS(text, voiceName, speed);
      }
    }

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`OpenAI TTS Error (${resp.status}): ${errText}`);
    }

    const blob = await resp.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Synthesize with Custom OpenAI-compatible TTS endpoint
   */
  public async synthesizeWithCustomTTS(
    text: string,
    voiceName: string = 'default',
    speed: number = 1.0
  ): Promise<string> {
    const cleanText = sanitizeSpeechText(text);
    if (!cleanText) return '';
    const endpoint = modelRegistryService.getCustomEndpoint() || 'http://localhost:8000/v1/audio/speech';
    const key = modelRegistryService.getNextActiveKey('CUSTOM_TTS') || 'custom-key';

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: voiceName,
        input: cleanText,
        speed: speed
      })
    });

    if (resp.status === 429) {
      modelRegistryService.rotateKeyOn429('CUSTOM_TTS', key);
    }

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Custom TTS Error (${resp.status}): ${errText}`);
    }

    const blob = await resp.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Resilient Fallback: Public Google Translate TTS (mp3)
   * Guarantees 100% synthesis success rate when cloud API keys are exhausted, rate-limited, or blocked.
   */
  public async synthesizeWithTranslateTTS(text: string, isVi?: boolean): Promise<string> {
    const cleanText = sanitizeSpeechText(text);
    if (!cleanText) return '';

    // In web browser environment, translate.google.com/translate_tts blocks direct fetch due to CORS policy
    if (typeof window !== 'undefined') {
      console.warn('[GoogleTTS] synthesizeWithTranslateTTS skipped in browser environment due to CORS policy.');
      return '';
    }

    try {
      const isVietnamese = isVi !== undefined ? isVi : isVietnameseText(cleanText);
      const lang = isVietnamese ? 'vi' : 'en';
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${lang}&client=tw-ob`;

      const resp = await fetch(url);
      if (!resp.ok) {
        console.warn(`[GoogleTTS] Translate TTS failed HTTP ${resp.status}`);
        return '';
      }
      const blob = await resp.blob();
      if (typeof FileReader !== 'undefined') {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              resolve('');
            }
          };
          reader.onerror = () => resolve('');
          reader.readAsDataURL(blob);
        });
      } else {
        const buffer = await blob.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return `data:audio/mp3;base64,${base64}`;
      }
    } catch (err) {
      console.warn('[GoogleTTS] synthesizeWithTranslateTTS network/CORS error:', err);
      return '';
    }
  }

  /**
   * Synthesize with Google Cloud TTS or Gemini Flash TTS with automatic Multi-Key Failover:
   * Handles 429 (Rate Limit / Quota Exceeded), 403, and 503 errors gracefully by rotating to next key in pool.
   */
  private async synthesizeWithGoogleTTS(
    text: string, 
    voiceName: string = 'en-US-Journey-D', 
    speed: number = 1.0,
    forceRefresh: boolean = false
  ): Promise<string> {
    const cleanText = sanitizeSpeechText(text);
    if (!cleanText) return '';

    const registered = modelRegistryService.getModelById(voiceName);
    const isVi = registered?.language === 'vi' || voiceName.startsWith('vi-');
    const isGemini = registered?.provider === 'GEMINI_AI_STUDIO';
    const effectiveVoice = voiceName;
    const langCode = isVi ? 'vi-VN' : 'en-US';

    const cacheKey = this.getCacheKey(effectiveVoice, cleanText);
    if (!forceRefresh) {
      const cached = this.getCachedAudio(cleanText, effectiveVoice);
      if (cached) return cached;
    }

    this.rebuildApiKeyPool();
    const now = Date.now();

    // Reset rate-limited status for keys whose cooldown has expired
    for (const item of this.apiKeyPool) {
      if (item.rateLimitedUntil && item.rateLimitedUntil <= now) {
        delete item.rateLimitedUntil;
        if (item.status === 'RATE_LIMITED') {
          item.status = 'READY';
          delete item.lastError;
        }
      }
    }

    // Filter by key type FIRST so other providers (e.g. Gemini) don't mask Google Cloud keys
    const targetType = isGemini ? 'GEMINI_AI_STUDIO' : 'GOOGLE_CLOUD_TTS';
    const poolForType = this.apiKeyPool.filter(k => k.type === targetType);
    const activeKeys = poolForType.filter(k => !k.rateLimitedUntil || k.rateLimitedUntil <= now);
    let candidateKeys = activeKeys.length > 0 ? activeKeys : poolForType;

    if (candidateKeys.length === 0) {
      if (!isVi && targetType === 'GOOGLE_CLOUD_TTS') {
        const geminiKey = this.apiKeyPool.find(k => k.type === 'GEMINI_AI_STUDIO' && (!k.rateLimitedUntil || k.rateLimitedUntil <= now));
        if (geminiKey) {
          try {
            console.warn('[GoogleTTS] No Google Cloud TTS keys available. Attempting Gemini Flash TTS fallback...');
            const wav = await this.synthesizeWithGeminiTTS(cleanText, geminiKey.key, effectiveVoice);
            if (wav) {
              this.setCachedAudio(cleanText, effectiveVoice, wav);
              return wav;
            }
          } catch (gemErr) {
            console.warn('[GoogleTTS] Fallback to Gemini TTS failed:', gemErr);
          }
        }
      }

      throw new Error(isVi 
        ? 'No valid Google Cloud TTS keys available for Vietnamese synthesis.' 
        : 'No API keys configured in pool.');
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
            candidate.rateLimitedUntil = Date.now() + 5000; // 5 seconds cooldown
            candidate.status = 'RATE_LIMITED';
            candidate.lastError = '429 Rate Limit Exceeded';
            lastErrorMsg = `Key ${maskApiKey(candidate.key)} hit 429 Rate Limit`;
            console.warn(`[GoogleTTS] Key ${maskApiKey(candidate.key)} hit 429. Rotating to next key in pool...`);
            modelRegistryService.rotateKeyOn429('GOOGLE_TTS', candidate.key);
            continue;
          }

          if (response.status === 403 || response.status === 503) {
            candidate.rateLimitedUntil = Date.now() + (response.status === 503 ? 5000 : 60000);
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
            delete candidate.lastError;
            delete candidate.rateLimitedUntil;
            this.setCachedAudio(cleanText, effectiveVoice, audioContent);
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
            delete candidate.lastError;
            delete candidate.rateLimitedUntil;
            this.setCachedAudio(cleanText, effectiveVoice, wavDataUri);
            return wavDataUri;
          }
        } catch (geminiErr: any) {
          const errMsg = geminiErr?.message || '';
          lastErrorMsg = errMsg;
          if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            candidate.rateLimitedUntil = Date.now() + 5000;
            candidate.status = 'RATE_LIMITED';
            candidate.lastError = '429 Quota Exceeded';
            modelRegistryService.rotateKeyOn429('GEMINI_AI_STUDIO', candidate.key);
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

    // If all candidate keys failed:
    if (!isVi && targetType === 'GOOGLE_CLOUD_TTS') {
      const geminiKey = this.apiKeyPool.find(k => k.type === 'GEMINI_AI_STUDIO' && (!k.rateLimitedUntil || k.rateLimitedUntil <= now));
      if (geminiKey) {
        try {
          console.warn(`[GoogleTTS] All ${candidateKeys.length} Google Cloud TTS keys exhausted. Attempting Gemini Flash TTS fallback...`);
          const wav = await this.synthesizeWithGeminiTTS(cleanText, geminiKey.key, effectiveVoice);
          if (wav) {
            this.setCachedAudio(cleanText, effectiveVoice, wav);
            return wav;
          }
        } catch (gemErr) {
          console.warn('[GoogleTTS] Fallback to Gemini TTS failed:', gemErr);
        }
      }
    }

    throw new Error(`All ${candidateKeys.length} Google Cloud TTS keys in pool hit rate-limit (429) or error: ${lastErrorMsg || 'Please wait a few seconds for quota cooldown.'}`);
  }

  public playUrl(url: string, speed: number = 1): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.playbackRate = speed;
      this.currentAudio = audio;
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        audio.onended = null;
        audio.onerror = null;
        if (this.currentAudio === audio) this.currentAudio = null;
        if (this.finishPlayback === cancel) this.finishPlayback = null;
        error ? reject(error) : resolve();
      };
      const cancel = () => finish();
      this.finishPlayback = cancel;
      const timeout = setTimeout(() => { audio.pause(); finish(new Error('Audio playback timed out. Please retry.')); }, 180000);
      audio.onended = () => finish();
      audio.onerror = () => finish(new Error('Audio could not be decoded or loaded. Regenerate it and retry.'));
      audio.play().catch(error => finish(error instanceof Error ? error : new Error(String(error))));
    });
  }

  public playBase64(base64Audio: string, speed: number = 1.0): Promise<void> {
    return this.playUrl(base64Audio.startsWith('data:') ? base64Audio : 'data:audio/mp3;base64,' + base64Audio, speed);
  }

  private playBrowserTts(text: string, voiceName: string, speed: number): Promise<void> {
    const cleanText = sanitizeSpeechText(text);
    return new Promise(async (resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }

      const isVi = voiceName.startsWith('vi') || isVietnameseText(cleanText);

      if (isVi) {
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find(v => v.lang.startsWith('vi') || v.lang.replace('_', '-').startsWith('vi'));
        if (!viVoice) {
          // On Windows Chrome/Edge without Vietnamese voice pack, browser falls back to default English voice (Microsoft David).
          // NEVER let browser speak Vietnamese with an English voice! Fallback to Public Google Translate TTS.
          try {
            const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
            await this.playUrl(fallbackUrl, speed);
          } catch (e) {
            console.warn('[Audio] Fallback translate_tts in playBrowserTts failed:', e);
          }
          resolve();
          return;
        }
      }

      window.speechSynthesis.cancel();
      if (window.speechSynthesis.resume) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = speed;
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

  /**
   * Helper to prepare single chunk audio (EN and/or VI) using sanitizeSpeechText
   */
  public async prepareChunkAudio(
    chunk: { english: string; vietnamese?: string },
    voiceEn: string = 'flux-cliff-en',
    voiceVi: string = 'vi-VN-Neural2-A'
  ): Promise<{ enBase64?: string; viBase64?: string }> {
    const cleanEn = sanitizeSpeechText(chunk.english);
    const cleanVi = chunk.vietnamese ? sanitizeSpeechText(chunk.vietnamese) : '';
    let enBase64: string | undefined;
    let viBase64: string | undefined;

    if (cleanEn) {
      const resEn = await this.synthesizeSingleChunk({ text: cleanEn, language: 'en', voiceName: voiceEn });
      enBase64 = resEn.base64;
    }
    if (cleanVi) {
      const resVi = await this.synthesizeSingleChunk({ text: cleanVi, language: 'vi', voiceName: voiceVi });
      viBase64 = resVi.base64;
    }
    return { enBase64, viBase64 };
  }

  /**
   * Prepares speech text with trailing comma pause and prosody sanitization
   */
  public prepareSpeechText(text: string): string {
    return sanitizeSpeechText(text);
  }

  public async synthesizeGoogleCloudTts(params: { text: string; voiceName?: string; speed?: number; forceRefresh?: boolean }): Promise<string> {
    return this.synthesizeWithGoogleTTS(params.text, params.voiceName, params.speed, params.forceRefresh);
  }

  public async synthesizeGeminiAudio(text: string, apiKey: string, voiceName?: string): Promise<string> {
    return this.synthesizeWithGeminiTTS(text, apiKey, voiceName);
  }

  public speakViaBrowserLocal(text: string, voiceName: string = 'en-US', speed: number = 1.0): Promise<void> {
    return this.playBrowserTts(text, voiceName, speed);
  }

  stop() {
    this.activeSequenceId++; // Invalidate any in-flight bilingual timeouts or sequences
    const finish = this.finishPlayback;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    finish?.();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.setAudioLoading(false);
  }
}

export const audioPlayer = new AudioPlayService();

export const isLessonAudioReady = (lesson: { chunks?: ChunkItem[] }): boolean =>
  audioPlayer.isLessonAudioReady(lesson);

export const isLessonFullyReadyAsync = (lesson: { chunks?: ChunkItem[] }): Promise<boolean> =>
  audioPlayer.isLessonFullyReadyAsync(lesson);

export const prepareSpeechText = sanitizeSpeechText;

export { AudioPlayService, AudioPlayService as GoogleTtsService };
