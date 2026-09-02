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
    id: 'vi-VN-Chirp3-HD-Vindemiatrix',
    name: 'vi-VN-Chirp3-HD-Vindemiatrix (Google Chirp3-HD Studio Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Next-generation ultra-realistic Studio Chirp3-HD Vietnamese female voice.',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Chirp3-HD-Orus',
    name: 'vi-VN-Chirp3-HD-Orus (Google Chirp3-HD Studio Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Next-generation ultra-realistic Studio Chirp3-HD Vietnamese male voice.',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Neural2-A',
    name: 'vi-VN-Neural2-A (Vietnamese Neural2 Standard Nữ)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Neural2 Vietnamese standard female voice.',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Neural2-D',
    name: 'vi-VN-Neural2-D (Vietnamese Neural2 Standard Nam)',
    languageCode: 'vi-VN',
    gender: 'MALE',
    description: 'Neural2 Vietnamese standard male voice.',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Standard-A',
    name: 'vi-VN-Standard-A (Vietnamese Standard Nữ Bắc)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Standard Northern Vietnamese pronunciation.',
    provider: 'GOOGLE'
  }
];

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

async function saveAudioBlobToDB(key: string, base64: string): Promise<void> {
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

async function loadAllAudioBlobsFromDB(): Promise<Map<string, string>> {
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
  private customApiKey: string = '';
  private activeSequenceId: number = 0;
  private isDBLoaded: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedKey = localStorage.getItem('chunks_custom_tts_api_key');
        if (savedKey) this.customApiKey = savedKey.trim();

        const savedProvider = localStorage.getItem('chunks_active_audio_provider');
        if (savedProvider === 'DEEPGRAM_AURA' || savedProvider === 'GOOGLE_TTS') {
          this.activeProvider = savedProvider;
        } else {
          this.activeProvider = 'DEEPGRAM_AURA';
        }
      } catch {}

      // Asynchronously restore persistent audio cache from IndexedDB
      loadAllAudioBlobsFromDB().then((map) => {
        for (const [k, v] of map) {
          this.audioCache.set(k, v);
        }
        this.isDBLoaded = true;
      }).catch((e) => {
        console.warn('[AudioService] Could not load persisted audio cache from IndexedDB:', e);
      });
    }
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

  public setCustomApiKey(key: string) {
    this.customApiKey = key.trim();
    if (typeof window !== 'undefined') {
      try {
        if (this.customApiKey) {
          localStorage.setItem('chunks_custom_tts_api_key', this.customApiKey);
        } else {
          localStorage.removeItem('chunks_custom_tts_api_key');
        }
      } catch {}
    }
  }

  public getCustomApiKey(): string {
    return this.customApiKey;
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

  public isChunkCached(text: string, voiceName: string): boolean {
    const clean = sanitizeSpeechText(text);
    return this.audioCache.has(this.getCacheKey(voiceName, clean)) || this.audioCache.has(this.getCacheKey(voiceName, text));
  }

  public getCachedAudio(text: string, voiceName: string): string | null {
    const clean = sanitizeSpeechText(text);
    return this.audioCache.get(this.getCacheKey(voiceName, clean)) || this.audioCache.get(this.getCacheKey(voiceName, text)) || null;
  }

  public setCachedAudio(text: string, voiceName: string, base64: string): void {
    const clean = sanitizeSpeechText(text);
    this.audioCache.set(this.getCacheKey(voiceName, clean), base64);
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
   * Test Live Google Cloud TTS API connectivity
   */
  async testCloudTtsConnection(overrideKey?: string): Promise<{ success: boolean; statusCode: number; message: string; isBlocked: boolean }> {
    const apiKey = overrideKey || this.customApiKey || import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBrH0sAU__R4k1IBrSYIF73fFdASeSpdE4";
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

    try {
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
        return { success: true, statusCode: response.status, message: "Google Cloud TTS Connected (Journey-F Online)", isBlocked: false };
      } else {
        const text = await response.text();
        const isBlocked = response.status === 403 || text.includes('PERMISSION_DENIED') || text.includes('API_KEY_SERVICE_BLOCKED');
        return { success: false, statusCode: response.status, message: text, isBlocked };
      }
    } catch (e: any) {
      return { success: false, statusCode: 0, message: e?.message || "Network Error", isBlocked: false };
    }
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
        const rawCacheKey = this.getCacheKey(effectiveViVoice, text);
        const cached = this.audioCache.get(cacheKey) || this.audioCache.get(rawCacheKey);

        if (cached) {
          this.setLastSource('GOOGLE_CLOUD_AI');
          await this.playBase64(cached, speed);
          return;
        }

        // Tier 1: Google Cloud TTS REST API (vi-VN: Neural2-A / Standard-A)
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
      // Routes to Deepgram Aura (if selected/provider) or GCS permanent audio or Google Cloud TTS en-US
      // ======================================================================
      const isDeepgram = !forceCloudTts && (this.activeProvider === 'DEEPGRAM_AURA' || voiceName.startsWith('aura-'));
      const effectiveEnVoice = voiceName && !voiceName.startsWith('vi-') ? voiceName : 'aura-asteria-en';
      const cacheKey = this.getCacheKey(effectiveEnVoice, cleanText);
      const rawCacheKey = this.getCacheKey(effectiveEnVoice, text);
      const cached = this.audioCache.get(cacheKey) || this.audioCache.get(rawCacheKey);

      if (cached) {
        this.setLastSource(isDeepgram ? 'DEEPGRAM_AURA' : 'GOOGLE_CLOUD_AI');
        await this.playBase64(cached, speed);
        return;
      }

      // Step 1: Deepgram Aura Engine (if provider or voice is aura-*)
      if (isDeepgram) {
        try {
          const dgModel = voiceName.startsWith('aura-') ? voiceName : 'aura-asteria-en';
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

      // Step 2: GCS Master Permanent Audio (if not forced to TTS and GCS URL exists)
      if (!forceCloudTts && !isDeepgram && permanentAudioUrl && permanentAudioUrl.startsWith('http')) {
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
          this.audioCache.set(cacheKey, base64Audio);
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

      if (!forceRegenerate && this.audioCache.has(cacheKey)) {
        return { base64: this.audioCache.get(cacheKey)!, source: 'GOOGLE_CLOUD_AI', voice: voiceVi, language: 'vi' };
      }

      // 1. Google Cloud TTS (vi-VN: Neural2-A / Standard-A)
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
      const voiceEn = params.voiceName || (activeProvider === 'DEEPGRAM_AURA' ? 'aura-asteria-en' : 'en-US-Journey-F');
      const isDeepgram = activeProvider === 'DEEPGRAM_AURA' || voiceEn.startsWith('aura-');
      const cacheKey = this.getCacheKey(voiceEn, cleanText);

      if (!forceRegenerate && this.audioCache.has(cacheKey)) {
        return { base64: this.audioCache.get(cacheKey)!, source: isDeepgram ? 'DEEPGRAM_AURA' : 'GOOGLE_CLOUD_AI', voice: voiceEn, language: 'en' };
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
   * Synthesize with Google Cloud TTS REST API endpoint:
   * https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}
   * Strictly enforces:
   * - Vietnamese: voice { languageCode: 'vi-VN', name: voiceName || 'vi-VN-Neural2-A' }
   * - English: voice { languageCode: 'en-US', name: voiceName || 'en-US-Journey-F' }
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

    const apiKey = this.customApiKey || import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBrH0sAU__R4k1IBrSYIF73fFdASeSpdE4";
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

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

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Cloud TTS API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const audioContent = data.audioContent;
    if (audioContent) {
      this.setCache(cacheKey, audioContent);
    }
    return audioContent || '';
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
