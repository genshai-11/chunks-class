import { deepgramTts, DEEPGRAM_AURA_VOICES, DeepgramVoiceOption } from './deepgramTtsService';

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
    id: 'vi-VN-Neural2-A',
    name: 'vi-VN-Neural2-A (Vietnamese Neural2 Standard)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Neural2 Vietnamese standard pronunciation voice.',
    provider: 'GOOGLE'
  },
  {
    id: 'vi-VN-Standard-A',
    name: 'vi-VN-Standard-A (Vietnamese Standard Northern)',
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

class AudioPlayService {
  private currentAudio: HTMLAudioElement | null = null;
  private audioCache = new Map<string, string>(); // key -> audio url/dataUri
  private gcsAvailabilityCache = new Map<string, boolean>();
  private lastSource: AudioSourceType = 'DEEPGRAM_AURA';
  private activeProvider: AudioProvider = 'DEEPGRAM_AURA';
  private sourceListeners: ((source: AudioSourceType) => void)[] = [];
  private loadingListeners: ((isLoading: boolean) => void)[] = [];
  private customApiKey: string = '';

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
    }
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
   * Play Chunk Audio with clean Engine Prioritization:
   * 1. Check in-memory preparation cache (Instant 0ms).
   * 2. If provider is DEEPGRAM_AURA or voice is aura-*:
   *    Synthesize and play via Deepgram Aura API.
   * 3. If provider is GOOGLE_TTS:
   *    If permanent GCS URL is provided & available, stream directly.
   *    Else synthesize via Google Cloud Text-to-Speech API.
   * 4. Fallback to Browser Speech if network/API fails.
   */
  async playChunk(
    text: string,
    permanentAudioUrl?: string | null,
    voiceName: string = 'en-US-Journey-F',
    speed: number = 1.0,
    forceCloudTts: boolean = false
  ): Promise<void> {
    this.stop();
    if (!text || !text.trim()) return;

    this.setAudioLoading(true);
    try {
      const isVietnamese = voiceName.startsWith('vi') || /[\u00C0-\u1EF9]/.test(text);
      const isDeepgram = !isVietnamese && (this.activeProvider === 'DEEPGRAM_AURA' || voiceName.startsWith('aura-'));

      // Check Cache First
      const cacheKey = `${voiceName}_${speed}_${text.trim()}`;
      if (this.audioCache.has(cacheKey)) {
        const cached = this.audioCache.get(cacheKey)!;
        this.setLastSource(isDeepgram ? 'DEEPGRAM_AURA' : 'GOOGLE_CLOUD_AI');
        await this.playBase64(cached, speed);
        return;
      }

      // 1. DEEPGRAM AURA ENGINE (If selected by teacher)
      if (isDeepgram) {
        try {
          const dgModel = voiceName.startsWith('aura-') ? voiceName : 'aura-asteria-en';
          const base64 = await deepgramTts.synthesizeText(text, dgModel);
          if (base64) {
            this.audioCache.set(cacheKey, base64);
            this.setLastSource('DEEPGRAM_AURA');
            await this.playBase64(base64, speed);
            return;
          }
        } catch (dgErr: any) {
          console.warn(`[Audio] Deepgram Aura synthesis failed (${dgErr?.message}), trying Google TTS...`, dgErr);
        }
      }

      // 2. GCS PERMANENT AUDIO (If not forced to dynamic TTS and not using Deepgram)
      if (!forceCloudTts && !isDeepgram && permanentAudioUrl && permanentAudioUrl.startsWith('http')) {
        try {
          this.setLastSource('GCS_MASTER');
          await this.playUrl(permanentAudioUrl, speed);
          return;
        } catch (err) {
          console.warn(`[Audio] GCS master audio unreachable (${permanentAudioUrl}), synthesizing via Google TTS...`);
        }
      }

      // 3. GOOGLE CLOUD TEXT-TO-SPEECH
      try {
        const googleVoice = isVietnamese ? (voiceName.startsWith('vi') ? voiceName : 'vi-VN-Neural2-A') : voiceName;
        const base64Audio = await this.synthesizeWithGoogleTTS(text, googleVoice, speed);
        if (base64Audio) {
          this.audioCache.set(cacheKey, base64Audio);
          this.setLastSource('GOOGLE_CLOUD_AI');
          await this.playBase64(base64Audio, speed);
          return;
        }
      } catch (err: any) {
        console.warn(`[Audio] Google Cloud TTS unavailable (${err?.message}), falling back to local Browser Model...`);
      }

      // 4. BROWSER LOCAL SPEECH SYNTHESIS FALLBACK
      this.setLastSource('BROWSER_LOCAL');
      await this.playBrowserTts(text, voiceName, speed);
    } finally {
      this.setAudioLoading(false);
    }
  }

  /**
   * Play sequential bilingual drill: EN_ONLY, VI_ONLY, EN_THEN_VI, VI_THEN_EN
   */
  async playBilingualSequence(
    englishText: string,
    vietnameseText: string,
    mode: 'EN_ONLY' | 'VI_ONLY' | 'EN_THEN_VI' | 'VI_THEN_EN' = 'EN_THEN_VI',
    englishAudioUrl?: string | null,
    voiceEn: string = 'en-US-Journey-F',
    voiceVi: string = 'vi-VN-Neural2-A',
    speed: number = 1.0,
    repeatCount: number = 1,
    onStepChange?: (step: 'en' | 'vi' | 'idle') => void
  ): Promise<void> {
    this.stop();

    // Determine effective voice
    const isDeepgram = this.activeProvider === 'DEEPGRAM_AURA' || voiceEn.startsWith('aura-');
    const effectiveVoiceEn = isDeepgram && !voiceEn.startsWith('aura-') ? 'aura-asteria-en' : voiceEn;

    for (let r = 0; r < repeatCount; r++) {
      if (mode === 'EN_ONLY') {
        onStepChange?.('en');
        await this.playChunk(englishText, isDeepgram ? null : englishAudioUrl, effectiveVoiceEn, speed);
      } else if (mode === 'VI_ONLY') {
        onStepChange?.('vi');
        await this.playChunk(vietnameseText, null, voiceVi, speed);
      } else if (mode === 'EN_THEN_VI') {
        onStepChange?.('en');
        await this.playChunk(englishText, isDeepgram ? null : englishAudioUrl, effectiveVoiceEn, speed);
        await new Promise(res => setTimeout(res, 250));
        onStepChange?.('vi');
        await this.playChunk(vietnameseText, null, voiceVi, speed);
      } else if (mode === 'VI_THEN_EN') {
        onStepChange?.('vi');
        await this.playChunk(vietnameseText, null, voiceVi, speed);
        await new Promise(res => setTimeout(res, 350));
        onStepChange?.('en');
        await this.playChunk(englishText, isDeepgram ? null : englishAudioUrl, effectiveVoiceEn, speed);
      }

      if (r < repeatCount - 1) {
        await new Promise(res => setTimeout(res, 400));
      }
    }

    onStepChange?.('idle');
  }

  /**
   * Batch Pre-generate / Prepare All Audio for a list of Chunks
   */
  async prepareChunksAudio(
    chunks: { english: string; audio_url?: string | null }[],
    voiceEn: string = 'en-US-Journey-F',
    provider: AudioProvider = 'GOOGLE_TTS',
    onProgress?: (current: number, total: number, statusText: string) => void
  ): Promise<{ prepared: number; failed: number }> {
    let prepared = 0;
    let failed = 0;
    const total = chunks.length;

    const isDeepgram = provider === 'DEEPGRAM_AURA' || voiceEn.startsWith('aura-');
    const model = isDeepgram ? (voiceEn.startsWith('aura-') ? voiceEn : 'aura-asteria-en') : voiceEn;

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      onProgress?.(i + 1, total, `Synthesizing chunk #${i + 1}: "${c.english.slice(0, 30)}..."`);

      try {
        const cacheKey = `${model}_1_${c.english.trim()}`;
        if (isDeepgram) {
          const base64 = await deepgramTts.synthesizeText(c.english, model);
          if (base64) {
            this.audioCache.set(cacheKey, base64);
            prepared++;
          }
        } else {
          const base64 = await this.synthesizeWithGoogleTTS(c.english, model, 1.0);
          if (base64) {
            this.audioCache.set(cacheKey, base64);
            prepared++;
          }
        }
      } catch (err) {
        console.warn(`[Batch Audio] Failed chunk #${i + 1}:`, err);
        failed++;
      }
    }

    onProgress?.(total, total, `Completed! ${prepared} synthesized, ${failed} failed.`);
    return { prepared, failed };
  }

  private async synthesizeWithGoogleTTS(text: string, voiceName: string, speed: number): Promise<string> {
    const cacheKey = `${voiceName}_${speed}_${text.trim()}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    const apiKey = this.customApiKey || import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBrH0sAU__R4k1IBrSYIF73fFdASeSpdE4";
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const langCode = voiceName.startsWith('vi') ? 'vi-VN' : 'en-US';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: langCode, name: voiceName },
        audioConfig: { audioEncoding: 'MP3', speakingRate: speed }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Cloud TTS API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const audioContent = data.audioContent;
    this.audioCache.set(cacheKey, audioContent);
    return audioContent;
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
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speed;

      const isVi = voiceName.startsWith('vi') || /[\u00C0-\u1EF9]/.test(text);
      utterance.lang = isVi ? 'vi-VN' : 'en-US';

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioPlayer = new AudioPlayService();
