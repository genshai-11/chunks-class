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
   * Generates a single continuous combined audio stream for an ImprovItem.
   * All hints are synthesized and stitched with ~1.0 second silence in between.
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

    const normalizedMode = normalizeLanguageMode(langMode);
    const cacheKey = `improv_item_${item.id}_${voiceEn}_${voiceVi}_${normalizedMode}`;

    // 1. Check persistent & memory cache
    if (!forceRegenerate) {
      const cached = audioPlayer.getCachedAudio(cacheKey, voiceEn);
      if (cached) return cached;
    }

    // 2. Synthesize each hint audio
    const audioContext = getAudioContext();
    const hintBuffers: AudioBuffer[] = [];

    for (let i = 0; i < hints.length; i++) {
      const hint = hints[i];
      const enText = sanitizeSpeechText(getHintTextByLanguage(hint, 'en'));
      const viText = sanitizeSpeechText(getHintTextByLanguage(hint, 'vi'));

      if (normalizedMode === 'EN_ONLY') {
        if (enText) {
          const res = await audioPlayer.synthesizeSingleChunk({
            text: enText,
            language: 'en',
            voiceName: voiceEn,
            forceRegenerate
          });
          if (res.base64 && audioContext) {
            const buf = await decodeAudioBase64(audioContext, res.base64);
            hintBuffers.push(buf);
          }
        }
      } else if (normalizedMode === 'VI_ONLY') {
        if (viText) {
          const res = await audioPlayer.synthesizeSingleChunk({
            text: viText,
            language: 'vi',
            voiceName: voiceVi,
            forceRegenerate
          });
          if (res.base64 && audioContext) {
            const buf = await decodeAudioBase64(audioContext, res.base64);
            hintBuffers.push(buf);
          }
        }
      } else if (normalizedMode === 'EN_THEN_VI') {
        // Synthesize EN then VI for each hint
        if (enText) {
          const resEn = await audioPlayer.synthesizeSingleChunk({
            text: enText,
            language: 'en',
            voiceName: voiceEn,
            forceRegenerate
          });
          if (resEn.base64 && audioContext) {
            const bufEn = await decodeAudioBase64(audioContext, resEn.base64);
            hintBuffers.push(bufEn);
          }
        }
        if (viText) {
          const resVi = await audioPlayer.synthesizeSingleChunk({
            text: viText,
            language: 'vi',
            voiceName: voiceVi,
            forceRegenerate
          });
          if (resVi.base64 && audioContext) {
            const bufVi = await decodeAudioBase64(audioContext, resVi.base64);
            hintBuffers.push(bufVi);
          }
        }
      } else if (normalizedMode === 'VI_THEN_EN') {
        // Synthesize VI then EN for each hint
        if (viText) {
          const resVi = await audioPlayer.synthesizeSingleChunk({
            text: viText,
            language: 'vi',
            voiceName: voiceVi,
            forceRegenerate
          });
          if (resVi.base64 && audioContext) {
            const bufVi = await decodeAudioBase64(audioContext, resVi.base64);
            hintBuffers.push(bufVi);
          }
        }
        if (enText) {
          const resEn = await audioPlayer.synthesizeSingleChunk({
            text: enText,
            language: 'en',
            voiceName: voiceEn,
            forceRegenerate
          });
          if (resEn.base64 && audioContext) {
            const bufEn = await decodeAudioBase64(audioContext, resEn.base64);
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
   * Pre-generates and caches audio for all items across all sessions in an ImprovPackage.
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
        const cacheKey = `improv_item_${item.id}_${voiceEn}_${voiceVi}_EN_ONLY`;

        if (!forceRegenerate && audioPlayer.getCachedAudio(cacheKey, voiceEn)) {
          skipped++;
        } else {
          try {
            await this.synthesizeItemCombinedAudio(item, voiceEn, voiceVi, 'EN_ONLY', forceRegenerate);
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
  onEnded?: () => void
) => improvTts.playItemAudio(item, speed, onEnded);

export const stopImprovAudio = () => improvTts.stop();
