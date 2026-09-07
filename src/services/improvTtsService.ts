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

export interface ImprovBatchError {
  itemId: string;
  sessionNum: number;
  itemNumber: number;
  lang: 'en' | 'vi' | 'both';
  error: string;
  timestamp: number;
}

export interface ImprovBatchProgress {
  current: number;
  total: number;
  prepared: number;
  skipped: number;
  failed: number;
  statusText: string;
  errors?: ImprovBatchError[];
}

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

// Strict regex detecting all standard Vietnamese accented vowels and consonants
export const VI_DIACRITICS_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\u00C0-\u1EF9\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01A0\u01A1\u01AF\u01B0]/i;

// Regex detecting English characters, morphology, consonant/vowel clusters, and common vocabulary
export const EN_PATTERN_REGEX = new RegExp(
  [
    // 1. Letters that do not exist in the Vietnamese alphabet
    '[fFIjJwWzZ]',
    // 2. Double consonants/vowels not found in native Vietnamese (e.g. dinner, luggage, staff, see, loose)
    '(?:bb|cc|dd|ff|gg|ll|mm|nn|pp|rr|ss|tt|zz)',
    // 3. English consonant digraphs and trigraphs
    '(?:ck|sh|wh|tch|ght)',
    // 4. Vowel digraphs characteristic of English (not native in Vietnamese)
    '(?:ee|ea|oo|ou)',
    // 5. Common English suffixes
    '\\b\\w*(?:tion|sion|ment|ness|ity|ship|able|ible|less|ful|ous|ing|ed)\\b',
    // 6. Common English stop words & domain vocabulary
    '\\b(?:the|a|an|in|on|at|to|for|of|with|by|from|about|into|through|after|over|between|out|against|during|without|before|under|around|among|and|or|but|if|while|as|that|this|these|those|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|shall|should|may|might|must|can|could|not|no|so|too|very|just|more|also|then|now|here|there|when|where|why|how|all|any|both|each|few|most|other|some|such|than|you|your|we|our|they|their|he|his|she|her|it|its|my|me|i|suitcase|luggage|bag|cart|car|carsick|clink|clinking|sound|dinner|cook|cooking|bring|along|lose|lost|loose|change|pocket|front|customs|officer|hotel|flight|delayed|heavy|warm|check|arrive|depart|ticket|passport|gate|seat|bus|train|taxi|driver|passenger|room|desk|staff|manager|bill|cash|card|pay|price|buy|sell|cost|shop|store|order|delivery|product|item|service|company|work|job|boss|colleague|meeting|office|computer|phone|call|email|message|talk|say|tell|ask|listen|hear|see|look|watch|find|search|go|come|leave|stay|wait|take|give|help|start|stop|open|close|make|get|set|use|try|need|want|like|love|good|bad|new|old|big|small|long|short|fast|slow|easy|hard|late|early|right|wrong|true|false)\\b'
  ].join('|'),
  'i'
);

/**
 * Helper to determine English vs Vietnamese text for a given hint.
 * Rigorously inspects both hint.text and hint.translation for Vietnamese diacritics
 * and English morphological/lexical patterns to guarantee zero language inversion.
 */
export function getHintTextByLanguage(hint: ImprovHint, lang: 'en' | 'vi'): string {
  if (!hint) return '';
  const text = (hint.text || '').trim();
  const translation = (hint.translation || '').trim();

  const isTextVi = VI_DIACRITICS_REGEX.test(text);
  const isTransVi = VI_DIACRITICS_REGEX.test(translation);
  const isTextEn = EN_PATTERN_REGEX.test(text);
  const isTransEn = EN_PATTERN_REGEX.test(translation);

  if (lang === 'vi') {
    // 1. Prioritize whichever field has Vietnamese diacritics
    if (isTextVi) return text;
    if (isTransVi) return translation;
    // 2. If translation is English and text is not, text is definitely Vietnamese
    if (isTransEn && !isTextEn) return text;
    // 3. If text is English and translation is not, translation is Vietnamese
    if (isTextEn && !isTransEn) return translation;
    // 4. Standard fallback for Improv dataset: text is the Vietnamese hint
    return text || translation;
  } else {
    // English
    // 1. If translation matches English patterns -> translation
    if (isTransEn) return translation;
    // 2. If text has Vietnamese diacritics and translation exists -> translation is English
    if (isTextVi && translation) return translation;
    // 3. If text matches English and translation does not -> text
    if (isTextEn && !isTransEn) return text;
    // 4. Standard fallback for English: translation || text
    return translation || text;
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
    const effectiveVoice = voice || (isVi ? 'vi-VN-Neural2-A' : 'flux-cliff-en');
    const cacheKey = `improv_hint_${hint.id}_${effectiveVoice}_${lang}`;

    if (!forceRegenerate) {
      const cached = await audioPlayer.getCachedAudioAsync(cacheKey, effectiveVoice);
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

      const effectiveVoice = voice || (lang === 'vi' ? 'vi-VN-Neural2-A' : 'flux-cliff-en');
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
    voiceEn: string = 'flux-cliff-en',
    voiceVi: string = 'vi-VN-Neural2-A',
    langMode: LanguageMode = 'EN_ONLY',
    forceRegenerate: boolean = false
  ): Promise<string> {
    const hints = [...(item.hints || [])].sort((a, b) => a.itemIndex - b.itemIndex);
    if (hints.length === 0) {
      throw new Error(`Improv item #${item.itemNumber} (Session ${item.sessionNumber}) contains no hints.`);
    }

    const effectiveVoiceEn = voiceEn || 'flux-cliff-en';
    const effectiveVoiceVi = voiceVi || 'vi-VN-Neural2-A';
    const normalizedMode = normalizeLanguageMode(langMode);
    const cacheKey = `improv_item_${item.id}_${effectiveVoiceEn}_${effectiveVoiceVi}_${normalizedMode}`;

    // 1. Check persistent & memory cache
    if (!forceRegenerate) {
      const cached = await audioPlayer.getCachedAudioAsync(cacheKey, normalizedMode === 'VI_ONLY' ? effectiveVoiceVi : effectiveVoiceEn);
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
   * Internal helper: processes items batch with worker pool, tracking errors and live progress.
   */
  private async prepareItemsAudio(
    allItems: { item: ImprovItem; sessionNum: number }[],
    options?: PrepareAudioOptions,
    onProgress?: (progress: ImprovBatchProgress) => void
  ): Promise<{ prepared: number; failed: number; total: number; skipped: number; errors: ImprovBatchError[] }> {
    const voiceEn = options?.voiceEn || 'flux-cliff-en';
    const voiceVi = options?.voiceVi || 'vi-VN-Neural2-A';
    const forceRegenerate = options?.forceRegenerate || false;
    const concurrency = Math.max(1, Math.min(6, options?.concurrency || 3));

    const isBoth = options?.target === 'BOTH' || 
                   options?.langMode === 'EN_THEN_VI' || 
                   options?.langMode === 'VI_THEN_EN';
    const isViOnly = !isBoth && (options?.target === 'VIETNAMESE' || options?.langMode === 'VI_ONLY');
    const isEnOnly = !isBoth && !isViOnly;

    const total = allItems.length;
    if (total === 0) return { prepared: 0, failed: 0, total: 0, skipped: 0, errors: [] };

    let prepared = 0;
    let failed = 0;
    let skipped = 0;
    let currentIndex = 0;
    const errors: ImprovBatchError[] = [];

    const reportProgress = (done: number, statusText: string) => {
      if (onProgress) {
        // Pass typed ImprovBatchProgress object (and secondary args for backwards compatibility)
        (onProgress as any)({
          current: done,
          total,
          prepared,
          skipped,
          failed,
          statusText,
          errors: [...errors]
        }, total, statusText);
      }
    };

    const worker = async () => {
      while (currentIndex < total) {
        const idx = currentIndex++;
        const { item, sessionNum } = allItems[idx];

        try {
          if (isBoth) {
            // Check both EN and VI readiness
            const itemKeyEn = `improv_item_${item.id}_${voiceEn}_${voiceVi}_EN_ONLY`;
            const itemKeyVi = `improv_item_${item.id}_${voiceEn}_${voiceVi}_VI_ONLY`;
            const isItemCachedEn = !forceRegenerate && Boolean(await audioPlayer.getCachedAudioAsync(itemKeyEn, voiceEn));
            const isItemCachedVi = !forceRegenerate && Boolean(await audioPlayer.getCachedAudioAsync(itemKeyVi, voiceVi));

            let allHintsCached = true;
            for (const h of (item.hints || [])) {
              const hKeyEn = `improv_hint_${h.id}_${voiceEn}_en`;
              const hKeyVi = `improv_hint_${h.id}_${voiceVi}_vi`;
              if (!(await audioPlayer.getCachedAudioAsync(hKeyEn, voiceEn)) || 
                  !(await audioPlayer.getCachedAudioAsync(hKeyVi, voiceVi))) {
                allHintsCached = false;
                break;
              }
            }

            if (isItemCachedEn && isItemCachedVi && allHintsCached) {
              skipped++;
            } else {
              // Synthesize BOTH EN_ONLY and VI_ONLY combined items and all hints!
              await this.synthesizeItemCombinedAudio(item, voiceEn, voiceVi, 'EN_ONLY', forceRegenerate);
              await this.synthesizeItemCombinedAudio(item, voiceEn, voiceVi, 'VI_ONLY', forceRegenerate);
              // Also synthesize EN_THEN_VI for bilingual continuous playback
              try {
                await this.synthesizeItemCombinedAudio(item, voiceEn, voiceVi, 'EN_THEN_VI', forceRegenerate);
              } catch (bilingualErr) {
                console.warn(`[Improv TTS] Bilingual combined audio optional synthesis warning for item #${item.itemNumber}:`, bilingualErr);
              }
              prepared++;
            }
          } else if (isViOnly) {
            const itemKeyVi = `improv_item_${item.id}_${voiceEn}_${voiceVi}_VI_ONLY`;
            const isItemCachedVi = !forceRegenerate && Boolean(await audioPlayer.getCachedAudioAsync(itemKeyVi, voiceVi));

            let allHintsCached = true;
            for (const h of (item.hints || [])) {
              const hKeyVi = `improv_hint_${h.id}_${voiceVi}_vi`;
              if (!(await audioPlayer.getCachedAudioAsync(hKeyVi, voiceVi))) {
                allHintsCached = false;
                break;
              }
            }

            if (isItemCachedVi && allHintsCached) {
              skipped++;
            } else {
              await this.synthesizeItemCombinedAudio(item, voiceEn, voiceVi, 'VI_ONLY', forceRegenerate);
              prepared++;
            }
          } else {
            // EN_ONLY
            const itemKeyEn = `improv_item_${item.id}_${voiceEn}_${voiceVi}_EN_ONLY`;
            const isItemCachedEn = !forceRegenerate && Boolean(await audioPlayer.getCachedAudioAsync(itemKeyEn, voiceEn));

            let allHintsCached = true;
            for (const h of (item.hints || [])) {
              const hKeyEn = `improv_hint_${h.id}_${voiceEn}_en`;
              if (!(await audioPlayer.getCachedAudioAsync(hKeyEn, voiceEn))) {
                allHintsCached = false;
                break;
              }
            }

            if (isItemCachedEn && allHintsCached) {
              skipped++;
            } else {
              await this.synthesizeItemCombinedAudio(item, voiceEn, voiceVi, 'EN_ONLY', forceRegenerate);
              prepared++;
            }
          }
        } catch (err: any) {
          console.warn(`[Improv TTS] Batch synthesis failed for item #${item.itemNumber} (Session ${sessionNum}):`, err);
          errors.push({
            itemId: item.id,
            sessionNum,
            itemNumber: item.itemNumber,
            lang: isBoth ? 'both' : (isViOnly ? 'vi' : 'en'),
            error: err?.message || String(err),
            timestamp: Date.now()
          });
          failed++;
        }

        const done = prepared + failed + skipped;
        reportProgress(done, `Session ${sessionNum} - Item #${item.itemNumber} (${done}/${total})...`);
      }
    };

    const pool = Array.from({ length: Math.min(concurrency, total) }, () => worker());
    await Promise.all(pool);

    reportProgress(
      total, 
      `Hoàn tất chuẩn bị audio Improv (${prepared} tạo mới, ${skipped} đã có sẵn, ${failed} lỗi)!`
    );

    return { prepared, failed, total, skipped, errors };
  }

  /**
   * Pre-generates and stores both full item continuous audio and individual hint audio for a single ImprovSession.
   */
  async prepareSessionAudio(
    session: ImprovSession,
    options?: PrepareAudioOptions,
    onProgress?: (progress: ImprovBatchProgress) => void
  ): Promise<{ prepared: number; failed: number; total: number; skipped: number; errors: ImprovBatchError[] }> {
    const allItems = (session.items || []).map(it => ({ item: it, sessionNum: session.sessionNumber }));
    return this.prepareItemsAudio(allItems, options, onProgress);
  }

  /**
   * Pre-generates and stores both full item continuous audio and individual hint audio in IndexedDB for an entire ImprovPackage.
   */
  async preparePackageAudio(
    pkg: ImprovPackage,
    options?: PrepareAudioOptions,
    onProgress?: (progress: ImprovBatchProgress) => void
  ): Promise<{ prepared: number; failed: number; total: number; skipped: number; errors: ImprovBatchError[] }> {
    const allItems: { item: ImprovItem; sessionNum: number }[] = [];
    pkg.sessions.forEach(s => {
      s.items.forEach(it => {
        allItems.push({ item: it, sessionNum: s.sessionNumber });
      });
    });
    return this.prepareItemsAudio(allItems, options, onProgress);
  }

  /**
   * Plays the combined continuous hint audio for an ImprovItem.
   * Dynamically honors voiceEn and voiceVi without overriding with hardcoded defaults.
   */
  async playItemAudio(
    item: ImprovItem,
    speed: number = 1.0,
    onEnded?: () => void,
    voiceEn: string = 'flux-cliff-en',
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
   * Checks if all items in an ImprovSession have their audio ready
   * (either via streaming URL, combined cached audio, or individual hints cached).
   */
  async isSessionAudioReady(
    session: ImprovSession, 
    voiceEn: string = 'flux-cliff-en', 
    voiceVi: string = 'vi-VN-Neural2-A', 
    langMode: LanguageMode = 'EN_ONLY'
  ): Promise<boolean> {
    if (!session.items || session.items.length === 0) return false;
    const normalizedMode = normalizeLanguageMode(langMode);
    const isVi = normalizedMode === 'VI_ONLY';
    const effVoice = isVi ? voiceVi : voiceEn;
    const lang: 'en' | 'vi' = isVi ? 'vi' : 'en';

    for (const item of session.items) {
      // 1. Streaming URL check (http or data:)
      const streamUrl = isVi ? item.audioUrlVi : item.audioUrl;
      if (streamUrl && streamUrl !== 'cached' && (streamUrl.startsWith('http://') || streamUrl.startsWith('https://') || streamUrl.startsWith('data:'))) {
        continue;
      }

      // 2. Combined item audio check
      const itemCacheKey = `improv_item_${item.id}_${voiceEn}_${voiceVi}_${normalizedMode}`;
      const cached = await audioPlayer.getCachedAudioAsync(itemCacheKey, effVoice);
      if (cached) {
        continue;
      }

      // 3. All hints in item.hints check
      if (item.hints && item.hints.length > 0) {
        let allHintsCached = true;
        for (const hint of item.hints) {
          const hintStream = isVi ? hint.audioUrlVi : hint.audioUrl;
          if (hintStream && hintStream !== 'cached' && (hintStream.startsWith('http://') || hintStream.startsWith('https://') || hintStream.startsWith('data:'))) {
            continue;
          }
          const hintKey = `improv_hint_${hint.id}_${effVoice}_${lang}`;
          const hCached = await audioPlayer.getCachedAudioAsync(hintKey, effVoice);
          if (hCached) {
            continue;
          }
          const text = sanitizeSpeechText(getHintTextByLanguage(hint, lang));
          if (text) {
            const textCached = await audioPlayer.getCachedAudioAsync(text, effVoice);
            if (textCached) {
              continue;
            }
          }
          allHintsCached = false;
          break;
        }
        if (allHintsCached) {
          continue;
        }
      }

      return false;
    }
    return true;
  }

  /**
   * Checks if all sessions in an ImprovPackage have their audio cached
   */
  async isPackageAudioReady(
    pkg: ImprovPackage, 
    voiceEn: string = 'flux-cliff-en', 
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
  onProgress?: (progress: ImprovBatchProgress) => void
) => improvTts.preparePackageAudio(pkg, options, onProgress);

export const prepareSessionAudio = (
  session: ImprovSession,
  options?: PrepareAudioOptions,
  onProgress?: (progress: ImprovBatchProgress) => void
) => improvTts.prepareSessionAudio(session, options, onProgress);

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
