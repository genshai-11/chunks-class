import { 
  audioPlayer, 
  PrepareAudioOptions, 
  sanitizeSpeechText, 
  AudioProvider, 
  normalizeLanguageMode 
} from './googleTtsService';
import { 
  ImprovItem, 
  ImprovHint,
  ImprovSession,
  ImprovPackage, 
  LanguageMode 
} from '../types';

// --------------------------------------------------------------------------
// 1. Web Audio Helpers & WAV Encoder
// --------------------------------------------------------------------------

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioContext) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioContext = new AudioCtx();
    }
  }
  if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const clean = base64.replace(/^data:audio\/[^;]+;base64,/, '');
  const binaryString = atob(clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function decodeAudioBase64(audioContext: AudioContext, base64: string): Promise<AudioBuffer> {
  const arrayBuffer = base64ToArrayBuffer(base64);
  return new Promise((resolve, reject) => {
    audioContext.decodeAudioData(
      arrayBuffer.slice(0),
      (decoded) => resolve(decoded),
      (err) => reject(err)
    );
  });
}

function concatenateAudioBuffers(
  audioContext: AudioContext,
  buffers: AudioBuffer[],
  silenceDurationSec: number = 1.0
): AudioBuffer {
  if (buffers.length === 0) {
    return audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
  }
  if (buffers.length === 1) {
    return buffers[0];
  }

  const sampleRate = buffers[0].sampleRate;
  const numberOfChannels = Math.max(...buffers.map(b => b.numberOfChannels));
  const silenceSamples = Math.floor(sampleRate * silenceDurationSec);

  let totalSamples = 0;
  for (let i = 0; i < buffers.length; i++) {
    totalSamples += buffers[i].length;
    if (i < buffers.length - 1) {
      totalSamples += silenceSamples;
    }
  }

  const outputBuffer = audioContext.createBuffer(numberOfChannels, totalSamples, sampleRate);

  for (let ch = 0; ch < numberOfChannels; ch++) {
    const channelData = outputBuffer.getChannelData(ch);
    let offset = 0;

    for (let i = 0; i < buffers.length; i++) {
      const b = buffers[i];
      const sourceData = ch < b.numberOfChannels ? b.getChannelData(ch) : b.getChannelData(0);
      channelData.set(sourceData, offset);
      offset += b.length;

      if (i < buffers.length - 1) {
        // Gap is initialized to 0.0 (natural silence)
        offset += silenceSamples;
      }
    }
  }

  return outputBuffer;
}

function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const numOfChan = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChan * 2 + 44;
  const outBuffer = new ArrayBuffer(length);
  const view = new DataView(outBuffer);
  let pos = 0;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF Chunk Descriptor
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // File size - 8
  setUint32(0x45564157); // "WAVE"

  // "fmt " Sub-chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16);         // Subchunk1Size (16 for PCM)
  setUint16(1);          // AudioFormat (1 for PCM)
  setUint16(numOfChan);  // NumChannels
  setUint32(audioBuffer.sampleRate);
  setUint32(audioBuffer.sampleRate * 2 * numOfChan); // ByteRate
  setUint16(numOfChan * 2);                          // BlockAlign
  setUint16(16);                                     // BitsPerSample (16-bit)

  // "data" Sub-chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4); // Data chunk length

  // Interleave channels & write 16-bit PCM samples
  const channels: Float32Array[] = [];
  for (let i = 0; i < numOfChan; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  for (let sampleIdx = 0; sampleIdx < audioBuffer.length; sampleIdx++) {
    for (let ch = 0; ch < numOfChan; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][sampleIdx]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(pos, intSample, true);
      pos += 2;
    }
  }

  return new Blob([outBuffer], { type: 'audio/wav' });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// --------------------------------------------------------------------------
// 2. Improv TTS Engine Implementation
// --------------------------------------------------------------------------

/**
 * Helper to determine English vs Vietnamese text for a given hint.
 */
export function getHintTextByLanguage(hint: ImprovHint, lang: 'en' | 'vi'): string {
  const isTextVi = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(hint.text);
  if (lang === 'vi') {
    if (isTextVi) return hint.text;
    if (hint.translation && hint.translation.trim()) return hint.translation;
    return hint.text;
  } else {
    if (!isTextVi) return hint.text;
    if (hint.translation && hint.translation.trim()) return hint.translation;
    return hint.text;
  }
}

class ImprovTtsEngine {
  private currentAudio: HTMLAudioElement | null = null;
  private activeSequenceId: number = 0;

  /**
   * Synthesize or fetch from cache a single hint's audio (EN or VI).
   * Caches in IndexedDB with key `improv_hint_${hint.id}_${effectiveVoice}_${lang}`.
   */
  async synthesizeSingleHintAudio(
    hint: ImprovHint,
    lang: 'en' | 'vi',
    voice?: string,
    forceRegenerate: boolean = false
  ): Promise<string> {
    const isVi = lang === 'vi';
    const effectiveVoice = voice || (isVi ? 'vi-VN-Neural2-A' : 'aura-asteria-en');
    const cacheKey = `improv_hint_${hint.id}_${effectiveVoice}_${lang}`;

    if (!forceRegenerate) {
      const cached = await audioPlayer.getCachedAudioAsync(cacheKey);
      if (cached) return cached;
    }

    const textToSpeak = sanitizeSpeechText(getHintTextByLanguage(hint, lang));
    if (!textToSpeak) {
      throw new Error(`Hint ${hint.id} has no text for language ${lang}`);
    }

    const res = await audioPlayer.synthesizeSingleChunk({
      text: textToSpeak,
      language: lang,
      voiceName: effectiveVoice,
      forceRegenerate
    });

    if (!res.base64) {
      throw new Error(`Failed to synthesize hint ${hint.id} audio`);
    }

    audioPlayer.setCache(cacheKey, res.base64);
    return res.base64;
  }

  /**
   * Plays a single hint's audio (EN or VI) using the specified voice and speed.
   * Caches each hint in IndexedDB (`improv_hint_${hint.id}_${voice}_${lang}`)
   * so any played hint is stored in the audio bucket and 100% reusable instantly.
   */
  async playSingleHintAudio(
    hint: ImprovHint,
    lang: 'en' | 'vi',
    voice?: string,
    speed: number = 1.0,
    onEnded?: () => void
  ): Promise<void> {
    this.stop();
    const seqId = ++this.activeSequenceId;

    try {
      const streamUrl = lang === 'en'
        ? (hint.audioUrl && hint.audioUrl.startsWith('http') ? hint.audioUrl : null)
        : (hint.audioUrlVi && hint.audioUrlVi.startsWith('http') ? hint.audioUrlVi : null);

      if (streamUrl) {
        if (this.activeSequenceId !== seqId) return;

        const audio = new Audio(streamUrl);
        audio.playbackRate = speed;
        this.currentAudio = audio;

        audio.onended = () => {
          if (this.activeSequenceId === seqId) {
            this.currentAudio = null;
            onEnded?.();
          }
        };

        audio.onerror = (e) => {
          console.warn(`[Improv TTS] Streaming hint audio playback error (Hint: ${hint.id}):`, e);
          if (this.activeSequenceId === seqId) {
            this.currentAudio = null;
            onEnded?.();
          }
        };

        await audio.play();
        return;
      }

      const effectiveVoice = voice || (lang === 'vi' ? 'vi-VN-Neural2-A' : 'aura-asteria-en');
      const base64Audio = await this.synthesizeSingleHintAudio(hint, lang, effectiveVoice, false);

      if (this.activeSequenceId !== seqId) return;

      const dataUri = base64Audio.startsWith('data:') ? base64Audio : `data:audio/mp3;base64,${base64Audio}`;
      const audio = new Audio(dataUri);
      audio.playbackRate = speed;
      this.currentAudio = audio;

      audio.onended = () => {
        if (this.activeSequenceId === seqId) {
          this.currentAudio = null;
          onEnded?.();
        }
      };

      audio.onerror = (e) => {
        console.warn(`[Improv TTS] Hint audio playback error (Hint: ${hint.id}):`, e);
        if (this.activeSequenceId === seqId) {
          this.currentAudio = null;
          onEnded?.();
        }
      };

      await audio.play();
    } catch (err) {
      console.warn(`[Improv TTS] Single hint playback failed (Hint: ${hint.id}):`, err);
      onEnded?.();
    }
  }

  /**
   * Generates a single continuous combined audio stream for an ImprovItem.
   * All hints are synthesized (and cached individually in IndexedDB) and stitched with ~1.0 second silence.
   * The combined audio is saved to IndexedDB (`improv_item_${item.id}_${effectiveVoiceEn}_${effectiveVoiceVi}_${normalizedMode}`).
   */
  async synthesizeItemCombinedAudio(
    item: ImprovItem,
    voiceEn: string = 'aura-asteria-en',
    voiceVi: string = 'vi-VN-Neural2-A',
    langMode: LanguageMode = 'EN_ONLY',
    forceRegenerate: boolean = false
  ): Promise<string> {
    const hints = [...(item.hints || [])].sort((a, b) => a.itemIndex - b.itemIndex);
    if (hints.length === 0) {
      throw new Error(`Improv item #${item.itemNumber} (Session ${item.sessionNumber}) contains no hints.`);
    }

    const effectiveVoiceEn = voiceEn || 'aura-asteria-en';
    const effectiveVoiceVi = voiceVi || 'vi-VN-Neural2-A';
    const normalizedMode = normalizeLanguageMode(langMode);
    const cacheKey = `improv_item_${item.id}_${effectiveVoiceEn}_${effectiveVoiceVi}_${normalizedMode}`;

    // 1. Check persistent & memory cache
    if (!forceRegenerate) {
      const cached = await audioPlayer.getCachedAudioAsync(cacheKey);
      if (cached) return cached;
    }

    // 2. Synthesize each hint audio (persisted individually) and decode to AudioBuffer
    const audioContext = getAudioContext();
    const hintBuffers: AudioBuffer[] = [];

    for (let i = 0; i < hints.length; i++) {
      const hint = hints[i];
      const enText = sanitizeSpeechText(getHintTextByLanguage(hint, 'en'));
      const viText = sanitizeSpeechText(getHintTextByLanguage(hint, 'vi'));

      if (normalizedMode === 'EN_ONLY') {
        if (enText) {
          const base64 = await this.synthesizeSingleHintAudio(hint, 'en', effectiveVoiceEn, forceRegenerate);
          if (base64 && audioContext) {
            const buf = await decodeAudioBase64(audioContext, base64);
            hintBuffers.push(buf);
          }
        }
      } else if (normalizedMode === 'VI_ONLY') {
        if (viText) {
          const base64 = await this.synthesizeSingleHintAudio(hint, 'vi', effectiveVoiceVi, forceRegenerate);
          if (base64 && audioContext) {
            const buf = await decodeAudioBase64(audioContext, base64);
            hintBuffers.push(buf);
          }
        }
      } else if (normalizedMode === 'EN_THEN_VI') {
        if (enText) {
          const base64En = await this.synthesizeSingleHintAudio(hint, 'en', effectiveVoiceEn, forceRegenerate);
          if (base64En && audioContext) {
            const bufEn = await decodeAudioBase64(audioContext, base64En);
            hintBuffers.push(bufEn);
          }
        }
        if (viText) {
          const base64Vi = await this.synthesizeSingleHintAudio(hint, 'vi', effectiveVoiceVi, forceRegenerate);
          if (base64Vi && audioContext) {
            const bufVi = await decodeAudioBase64(audioContext, base64Vi);
            hintBuffers.push(bufVi);
          }
        }
      } else if (normalizedMode === 'VI_THEN_EN') {
        if (viText) {
          const base64Vi = await this.synthesizeSingleHintAudio(hint, 'vi', effectiveVoiceVi, forceRegenerate);
          if (base64Vi && audioContext) {
            const bufVi = await decodeAudioBase64(audioContext, base64Vi);
            hintBuffers.push(bufVi);
          }
        }
        if (enText) {
          const base64En = await this.synthesizeSingleHintAudio(hint, 'en', effectiveVoiceEn, forceRegenerate);
          if (base64En && audioContext) {
            const bufEn = await decodeAudioBase64(audioContext, base64En);
            hintBuffers.push(bufEn);
          }
        }
      }
    }

    if (hintBuffers.length === 0 || !audioContext) {
      throw new Error(`Failed to synthesize audio buffers for Improv item ${item.id}`);
    }

    // 3. Concatenate all hint buffers with 1.0 second silence
    const combinedBuffer = concatenateAudioBuffers(audioContext, hintBuffers, 1.0);

    // 4. Encode to standard WAV Blob & Base64 Data URI
    const wavBlob = audioBufferToWavBlob(combinedBuffer);
    const base64DataUri = await blobToBase64(wavBlob);

    // 5. Store in persistent audio cache
    audioPlayer.setCache(cacheKey, base64DataUri);

    return base64DataUri;
  }

  /**
   * Pre-generates and stores both full item continuous audio and individual hint audio in IndexedDB.
   * Dynamically honors voiceEn and voiceVi from options without overriding with hardcoded values.
   */
  async preparePackageAudio(
    pkg: ImprovPackage,
    options?: PrepareAudioOptions,
    onProgress?: (current: number, total: number, statusText: string) => void
  ): Promise<{ prepared: number; failed: number; total: number; skipped: number }> {
    const voiceEn = options?.voiceEn || 'aura-asteria-en';
    const voiceVi = options?.voiceVi || 'vi-VN-Neural2-A';
    const forceRegenerate = options?.forceRegenerate || false;
    const concurrency = Math.max(1, Math.min(6, options?.concurrency || 3));
    const langMode = options?.langMode ? normalizeLanguageMode(options.langMode) : 'EN_ONLY';

    // Flatten all items
    const allItems: { item: ImprovItem; sessionNum: number }[] = [];
    pkg.sessions.forEach(s => {
      s.items.forEach(it => {
        allItems.push({ item: it, sessionNum: s.sessionNumber });
      });
    });

    const total = allItems.length;
    if (total === 0) return { prepared: 0, failed: 0, total: 0, skipped: 0 };

    let prepared = 0;
    let failed = 0;
    let skipped = 0;
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < total) {
        const idx = currentIndex++;
        const { item, sessionNum } = allItems[idx];
        const itemCacheKey = `improv_item_${item.id}_${voiceEn}_${voiceVi}_${langMode}`;

        const isItemCached = !forceRegenerate && Boolean(await audioPlayer.getCachedAudioAsync(itemCacheKey));

        // Check if individual hints are also already cached
        let allHintsCached = true;
        for (const h of (item.hints || [])) {
          if (langMode === 'EN_ONLY' || langMode === 'EN_THEN_VI' || langMode === 'VI_THEN_EN') {
            const hKeyEn = `improv_hint_${h.id}_${voiceEn}_en`;
            if (!(await audioPlayer.getCachedAudioAsync(hKeyEn))) {
              allHintsCached = false;
              break;
            }
          }
          if (langMode === 'VI_ONLY' || langMode === 'EN_THEN_VI' || langMode === 'VI_THEN_EN') {
            const hKeyVi = `improv_hint_${h.id}_${voiceVi}_vi`;
            if (!(await audioPlayer.getCachedAudioAsync(hKeyVi))) {
              allHintsCached = false;
              break;
            }
          }
        }

        if (isItemCached && allHintsCached) {
          skipped++;
        } else {
          try {
            // synthesizeItemCombinedAudio automatically synthesizes & caches both
            // the individual hints (via synthesizeSingleHintAudio) and the full continuous audio in IndexedDB.
            await this.synthesizeItemCombinedAudio(item, voiceEn, voiceVi, langMode, forceRegenerate);
            prepared++;
          } catch (err) {
            console.warn(`[Improv TTS] Batch synthesis failed for item #${item.itemNumber} (Session ${sessionNum}):`, err);
            failed++;
          }
        }

        const done = prepared + failed + skipped;
        onProgress?.(
          done, 
          total, 
          `Session ${sessionNum} - Item #${item.itemNumber} (${done}/${total})...`
        );
      }
    };

    const pool = Array.from({ length: Math.min(concurrency, total) }, () => worker());
    await Promise.all(pool);

    onProgress?.(
      total, 
      total, 
      `Hoàn tất chuẩn bị audio Improv (${prepared} tạo mới, ${skipped} đã có sẵn, ${failed} lỗi)!`
    );

    return { prepared, failed, total, skipped };
  }

  /**
   * Plays the combined continuous hint audio for an ImprovItem.
   * Dynamically honors voiceEn and voiceVi without overriding with hardcoded defaults.
   */
  async playItemAudio(
    item: ImprovItem,
    speed: number = 1.0,
    onEnded?: () => void,
    voiceEn: string = 'aura-asteria-en',
    voiceVi: string = 'vi-VN-Neural2-A',
    langMode: LanguageMode = 'EN_ONLY'
  ): Promise<void> {
    this.stop();
    const seqId = ++this.activeSequenceId;

    try {
      const normalizedMode = normalizeLanguageMode(langMode);
      let streamUrl: string | null = null;
      if (normalizedMode === 'EN_ONLY' && item.audioUrl && item.audioUrl.startsWith('http')) {
        streamUrl = item.audioUrl;
      } else if (normalizedMode === 'VI_ONLY' && item.audioUrlVi && item.audioUrlVi.startsWith('http')) {
        streamUrl = item.audioUrlVi;
      }

      if (streamUrl) {
        if (this.activeSequenceId !== seqId) return;

        const audio = new Audio(streamUrl);
        audio.playbackRate = speed;
        this.currentAudio = audio;

        audio.onended = () => {
          if (this.activeSequenceId === seqId) {
            this.currentAudio = null;
            onEnded?.();
          }
        };

        audio.onerror = (e) => {
          console.warn(`[Improv TTS] Streaming item audio playback error (Item: ${item.id}):`, e);
          if (this.activeSequenceId === seqId) {
            this.currentAudio = null;
            onEnded?.();
          }
        };

        await audio.play();
        return;
      }

      const audioDataUri = await this.synthesizeItemCombinedAudio(
        item,
        voiceEn,
        voiceVi,
        langMode,
        false
      );

      if (this.activeSequenceId !== seqId) return;

      const audio = new Audio(audioDataUri);
      audio.playbackRate = speed;
      this.currentAudio = audio;

      audio.onended = () => {
        if (this.activeSequenceId === seqId) {
          this.currentAudio = null;
          onEnded?.();
        }
      };

      audio.onerror = (e) => {
        console.warn('[Improv TTS] Audio playback error:', e);
        if (this.activeSequenceId === seqId) {
          this.currentAudio = null;
          onEnded?.();
        }
      };

      await audio.play();
    } catch (err) {
      console.warn(`[Improv TTS] Playback failed for item ${item.id}:`, err);
      onEnded?.();
    }
  }

  /**
   * Checks if all items in an ImprovSession have their combined continuous audio cached or streamed
   */
  async isSessionAudioReady(
    session: ImprovSession, 
    voiceEn: string = 'aura-asteria-en', 
    voiceVi: string = 'vi-VN-Neural2-A', 
    langMode: LanguageMode = 'EN_ONLY'
  ): Promise<boolean> {
    if (!session.items || session.items.length === 0) return false;
    const normalizedMode = normalizeLanguageMode(langMode);
    for (const item of session.items) {
      if (normalizedMode === 'EN_ONLY' && item.audioUrl && item.audioUrl.startsWith('http')) {
        continue;
      }
      if (normalizedMode === 'VI_ONLY' && item.audioUrlVi && item.audioUrlVi.startsWith('http')) {
        continue;
      }
      const itemCacheKey = `improv_item_${item.id}_${voiceEn}_${voiceVi}_${normalizedMode}`;
      const cached = await audioPlayer.getCachedAudioAsync(itemCacheKey);
      if (!cached) return false;
    }
    return true;
  }

  /**
   * Checks if all sessions in an ImprovPackage have their audio cached
   */
  async isPackageAudioReady(
    pkg: ImprovPackage, 
    voiceEn: string = 'aura-asteria-en', 
    voiceVi: string = 'vi-VN-Neural2-A', 
    langMode: LanguageMode = 'EN_ONLY'
  ): Promise<boolean> {
    if (!pkg.sessions || pkg.sessions.length === 0) return false;
    for (const s of pkg.sessions) {
      const ready = await this.isSessionAudioReady(s, voiceEn, voiceVi, langMode);
      if (!ready) return false;
    }
    return true;
  }

  /**
   * Immediately stops any ongoing audio playback.
   */
  stop(): void {
    this.activeSequenceId++;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }
}

export const improvTts = new ImprovTtsEngine();

// Standalone function exports matching specifications
export const synthesizeSingleHintAudio = (
  hint: ImprovHint,
  lang: 'en' | 'vi',
  voice?: string,
  forceRegenerate?: boolean
) => improvTts.synthesizeSingleHintAudio(hint, lang, voice, forceRegenerate);

export const playSingleHintAudio = (
  hint: ImprovHint,
  lang: 'en' | 'vi',
  voice?: string,
  speed?: number,
  onEnded?: () => void
) => improvTts.playSingleHintAudio(hint, lang, voice, speed, onEnded);

export const synthesizeItemCombinedAudio = (
  item: ImprovItem,
  voiceEn?: string,
  voiceVi?: string,
  langMode?: LanguageMode,
  forceRegenerate?: boolean
) => improvTts.synthesizeItemCombinedAudio(item, voiceEn, voiceVi, langMode, forceRegenerate);

export const preparePackageAudio = (
  pkg: ImprovPackage,
  options?: PrepareAudioOptions,
  onProgress?: (current: number, total: number, statusText: string) => void
) => improvTts.preparePackageAudio(pkg, options, onProgress);

export const playItemAudio = (
  item: ImprovItem,
  speed?: number,
  onEnded?: () => void,
  voiceEn?: string,
  voiceVi?: string,
  langMode?: LanguageMode
) => improvTts.playItemAudio(item, speed, onEnded, voiceEn, voiceVi, langMode);

export const isSessionAudioReady = (
  session: ImprovSession,
  voiceEn?: string,
  voiceVi?: string,
  langMode?: LanguageMode
) => improvTts.isSessionAudioReady(session, voiceEn, voiceVi, langMode);

export const isPackageAudioReady = (
  pkg: ImprovPackage,
  voiceEn?: string,
  voiceVi?: string,
  langMode?: LanguageMode
) => improvTts.isPackageAudioReady(pkg, voiceEn, voiceVi, langMode);

export const stopImprovAudio = () => improvTts.stop();
