export interface VoiceOption {
  id: string;
  name: string;
  languageCode: string;
  gender: 'FEMALE' | 'MALE';
  description: string;
}

export type AudioSourceType = 'GCS_MASTER' | 'GOOGLE_CLOUD_AI' | 'BROWSER_LOCAL';

export interface AudioConnectionStatus {
  cloudTtsStatus: 'CONNECTED' | 'BLOCKED' | 'ERROR' | 'UNTESTED';
  cloudTtsStatusCode?: number;
  cloudTtsError?: string | null;
  gcsStatus: 'CONNECTED' | 'UNTESTED' | 'ERROR';
  activeSource: AudioSourceType;
  lastTestedAt: string | null;
  usingCustomApiKey: boolean;
  browserVoicesCount: number;
}

export const GOOGLE_TTS_VOICES: VoiceOption[] = [
  {
    id: 'en-US-Journey-F',
    name: 'en-US-Journey-F (Natural Dialogue - Female)',
    languageCode: 'en-US',
    gender: 'FEMALE',
    description: 'Ultra-realistic American English conversational voice.'
  },
  {
    id: 'en-US-Journey-M',
    name: 'en-US-Journey-M (Natural Dialogue - Male)',
    languageCode: 'en-US',
    gender: 'MALE',
    description: 'Ultra-realistic American English conversational voice (Male).'
  },
  {
    id: 'en-US-Studio-O',
    name: 'en-US-Studio-O (Studio Master - Female)',
    languageCode: 'en-US',
    gender: 'FEMALE',
    description: 'High-clarity studio master for phonetic pronunciation drills.'
  },
  {
    id: 'en-US-Neural2-F',
    name: 'en-US-Neural2-F (Studio Clarity - Female)',
    languageCode: 'en-US',
    gender: 'FEMALE',
    description: 'Broadcast-grade studio voice with balanced intonation.'
  },
  {
    id: 'en-US-Neural2-D',
    name: 'en-US-Neural2-D (Studio Deep - Male)',
    languageCode: 'en-US',
    gender: 'MALE',
    description: 'Deep, crisp male studio articulation.'
  },
  {
    id: 'vi-VN-Neural2-A',
    name: 'vi-VN-Neural2-A (Vietnamese Standard - Female)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Neural2 Vietnamese standard pronunciation voice.'
  },
  {
    id: 'vi-VN-Standard-A',
    name: 'vi-VN-Standard-A (Vietnamese Standard Northern)',
    languageCode: 'vi-VN',
    gender: 'FEMALE',
    description: 'Standard Northern Vietnamese pronunciation.'
  }
];

class AudioPlayService {
  private currentAudio: HTMLAudioElement | null = null;
  private audioCache = new Map<string, string>(); // text -> base64 audio
  private gcsAvailabilityCache = new Map<string, boolean>();
  private lastSource: AudioSourceType = 'BROWSER_LOCAL';
  private sourceListeners: ((source: AudioSourceType) => void)[] = [];
  private loadingListeners: ((isLoading: boolean) => void)[] = [];
  private customApiKey: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('chunks_custom_tts_api_key');
        if (saved) this.customApiKey = saved.trim();
      } catch {}
    }
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
    this.audioCache.clear();
  }

  public getCustomApiKey(): string {
    return this.customApiKey;
  }

  public getLastSource(): AudioSourceType {
    return this.lastSource;
  }

  public onSourceChange(listener: (source: AudioSourceType) => void) {
    this.sourceListeners.push(listener);
    return () => {
      this.sourceListeners = this.sourceListeners.filter(l => l !== listener);
    };
  }

  public onLoadingChange(listener: (isLoading: boolean) => void) {
    this.loadingListeners.push(listener);
    return () => {
      this.loadingListeners = this.loadingListeners.filter(l => l !== listener);
    };
  }

  private setAudioLoading(loading: boolean) {
    this.loadingListeners.forEach(fn => {
      try { fn(loading); } catch {}
    });
  }

  private setLastSource(source: AudioSourceType) {
    this.lastSource = source;
    this.sourceListeners.forEach(fn => {
      try { fn(source); } catch {}
    });
  }

  /**
   * Check GCS audio resource availability
   */
  public async checkGcsResource(url?: string | null): Promise<boolean> {
    if (!url || !url.startsWith('http')) return false;
    if (this.gcsAvailabilityCache.has(url)) {
      return this.gcsAvailabilityCache.get(url)!;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeoutId);
      const ok = res.ok;
      this.gcsAvailabilityCache.set(url, ok);
      return ok;
    } catch {
      return new Promise((resolve) => {
        const testAudio = new Audio();
        let resolved = false;
        const timer = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            this.gcsAvailabilityCache.set(url, false);
            resolve(false);
          }
        }, 2500);
        testAudio.oncanplaythrough = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            this.gcsAvailabilityCache.set(url, true);
            resolve(true);
          }
        };
        testAudio.onerror = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            this.gcsAvailabilityCache.set(url, false);
            resolve(false);
          }
        };
        testAudio.src = url;
      });
    }
  }

  /**
   * Test Cloud TTS Connection and diagnose permissions
   */
  async testCloudTtsConnection(keyOverride?: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    isBlocked: boolean;
  }> {
    const key = keyOverride || this.customApiKey || import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBrH0sAU__R4k1IBrSYIF73fFdASeSpdE4";
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-User-Project': import.meta.env.VITE_FIREBASE_PROJECT_ID || 'chunks-voicecloning-genshai'
        },
        body: JSON.stringify({
          input: { text: "Connection test." },
          voice: { languageCode: "en-US", name: "en-US-Journey-F" },
          audioConfig: { audioEncoding: "MP3" }
        })
      });

      if (res.ok) {
        return {
          success: true,
          statusCode: res.status,
          message: "Google Cloud TTS API is fully CONNECTED and ACTIVE (Journey AI Voices ready).",
          isBlocked: false
        };
      }

      const errJson = await res.json().catch(() => ({}));
      const reason = errJson?.error?.details?.[0]?.reason || errJson?.error?.status || '';
      const errMsg = errJson?.error?.message || `HTTP ${res.status}`;

      const isBlocked = res.status === 403 || reason === 'API_KEY_SERVICE_BLOCKED';

      return {
        success: false,
        statusCode: res.status,
        message: isBlocked
          ? `API_KEY_SERVICE_BLOCKED (403): Dịch vụ Google Cloud Text-to-Speech đang bị khoá/chưa được bật trên API Key này trong Google Cloud Console. Ứng dụng sẽ tự động chuyển sang Model Máy (Browser Synthesis).`
          : `Lỗi kết nối TTS (${res.status}): ${errMsg}`,
        isBlocked
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 0,
        message: `Network Error: Không thể kết nối tới texttospeech.googleapis.com (${err?.message || String(err)})`,
        isBlocked: false
      };
    }
  }

  /**
   * Get list of local browser voices installed on current OS/device
   */
  getBrowserVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices();
  }

  /**
   * Play Chunk Audio:
   * 1. If permanent GCS URL is provided (e.g. from chunks-mirror-audio), stream directly.
   * 2. Fallback to Google Cloud Text-to-Speech API (Journey / Studio / Neural2 models).
   * 3. Fallback to Web Speech Synthesis if network API key is missing or blocked.
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
      // 1. If permanent GCS URL is provided and not forced to dynamic TTS, stream directly
      if (!forceCloudTts && permanentAudioUrl && permanentAudioUrl.startsWith('http')) {
        try {
          console.log(`[Audio] Streaming permanent GCS master audio: ${permanentAudioUrl}`);
          this.setLastSource('GCS_MASTER');
          await this.playUrl(permanentAudioUrl, speed);
          return;
        } catch (err) {
          console.warn(`[Audio] Permanent GCS audio not reachable (${permanentAudioUrl}), synthesizing with Google Cloud TTS API...`, err);
        }
      }

      // 2. Synthesize via Google Cloud Text-to-Speech API
      try {
        const base64Audio = await this.synthesizeWithGoogleTTS(text, voiceName, speed);
        if (base64Audio) {
          this.setLastSource('GOOGLE_CLOUD_AI');
          await this.playBase64(base64Audio);
          return;
        }
      } catch (err: any) {
        console.warn(`[Audio] Google Cloud TTS API unavailable (${err?.message}). Falling back to local Browser Speech ("Model Máy")...`);
      }

      // 3. Fallback to browser Web Speech Synthesis if Google Cloud API is blocked or offline
      this.setLastSource('BROWSER_LOCAL');
      await this.playBrowserTts(text, voiceName, speed);
    } finally {
      this.setAudioLoading(false);
    }
  }

  /**
   * Play sequential bilingual drill (English chunk, then Vietnamese translation or vice-versa)
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

    for (let r = 0; r < repeatCount; r++) {
      if (mode === 'EN_ONLY') {
        onStepChange?.('en');
        await this.playChunk(englishText, englishAudioUrl, voiceEn, speed);
      } else if (mode === 'VI_ONLY') {
        onStepChange?.('vi');
        await this.playChunk(vietnameseText, null, voiceVi, speed);
      } else if (mode === 'EN_THEN_VI') {
        onStepChange?.('en');
        await this.playChunk(englishText, englishAudioUrl, voiceEn, speed);
        await new Promise(res => setTimeout(res, 250));
        onStepChange?.('vi');
        await this.playChunk(vietnameseText, null, voiceVi, speed);
      } else if (mode === 'VI_THEN_EN') {
        onStepChange?.('vi');
        await this.playChunk(vietnameseText, null, voiceVi, speed);
        await new Promise(res => setTimeout(res, 350));
        onStepChange?.('en');
        await this.playChunk(englishText, englishAudioUrl, voiceEn, speed);
      }

      if (r < repeatCount - 1) {
        await new Promise(res => setTimeout(res, 400));
      }
    }

    onStepChange?.('idle');
  }

  private async synthesizeWithGoogleTTS(text: string, voiceName: string, speed: number): Promise<string> {
    const cacheKey = `${voiceName}_${speed}_${text}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    const apiKey = this.customApiKey || import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBrH0sAU__R4k1IBrSYIF73fFdASeSpdE4";
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

    const langCode = voiceName.startsWith('vi') ? 'vi-VN' : 'en-US';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-User-Project': import.meta.env.VITE_FIREBASE_PROJECT_ID || 'chunks-voicecloning-genshai'
      },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: langCode, name: voiceName },
        audioConfig: { audioEncoding: 'MP3', speakingRate: speed }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google TTS API Failed (${response.status}): ${errText}`);
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

  private playBase64(base64Audio: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      this.currentAudio = audio;
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.play().catch(reject);
    });
  }

  private playBrowserTts(text: string, voiceNameHint: string, rate: number): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const isVi = voiceNameHint.startsWith('vi');
      utterance.lang = isVi ? 'vi-VN' : 'en-US';
      utterance.rate = rate;

      // Adjust pitch based on chosen profile gender so different voice profiles produce distinct tones even on Model Máy
      const isMale = voiceNameHint.includes('-M') || voiceNameHint.includes('-D');
      utterance.pitch = isMale ? 0.85 : 1.05;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const langPrefix = isVi ? 'vi' : 'en';
        const matchingLang = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
        
        if (matchingLang.length > 0) {
          // If user picked male, try to find a male voice or alternate voice
          if (isMale) {
            const maleMatch = matchingLang.find(v => 
              v.name.toLowerCase().includes('male') || 
              v.name.toLowerCase().includes('david') || 
              v.name.toLowerCase().includes('alex') ||
              v.name.toLowerCase().includes('george')
            );
            if (maleMatch) utterance.voice = maleMatch;
            else utterance.voice = matchingLang[0];
          } else {
            const femaleMatch = matchingLang.find(v => 
              v.name.toLowerCase().includes('female') || 
              v.name.toLowerCase().includes('samantha') || 
              v.name.toLowerCase().includes('zira') ||
              v.name.toLowerCase().includes('victoria') ||
              v.name.toLowerCase().includes('karen')
            );
            if (femaleMatch) utterance.voice = femaleMatch;
            else utterance.voice = matchingLang[0];
          }
        }
      }

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

