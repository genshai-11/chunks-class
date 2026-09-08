import { modelRegistryService } from './modelRegistryService';

export interface DeepgramVoiceOption {
  id: string;
  name: string;
  gender: 'FEMALE' | 'MALE';
  accent: 'US' | 'UK';
  description: string;
}

export const DEEPGRAM_AURA_VOICES: DeepgramVoiceOption[] = [
  {
    id: 'flux-cliff-en',
    name: 'Flux Cliff (Default - Male Natural & Conversational)',
    gender: 'MALE',
    accent: 'US',
    description: 'Deepgram Flux Cliff: Next-generation conversational English male voice with superior prosody and natural pauses.'
  },
  {
    id: 'aura-asteria-en',
    name: 'Aura Asteria (Female - Conversational & Natural)',
    gender: 'FEMALE',
    accent: 'US',
    description: 'Crisp, natural, and expressive American English conversational voice.'
  },
  {
    id: 'aura-luna-en',
    name: 'Aura Luna (Female - Warm & Friendly)',
    gender: 'FEMALE',
    accent: 'US',
    description: 'Warm, approachable, and engaging tone for daily conversation practice.'
  },
  {
    id: 'aura-stella-en',
    name: 'Aura Stella (Female - Polished & Clear)',
    gender: 'FEMALE',
    accent: 'US',
    description: 'Clear, articulate, and professional female voice for pronunciation drills.'
  },
  {
    id: 'aura-athena-en',
    name: 'Aura Athena (Female - Calm & Academic)',
    gender: 'FEMALE',
    accent: 'UK',
    description: 'Gentle, structured British female voice.'
  },
  {
    id: 'aura-orion-en',
    name: 'Aura Orion (Male - Clear & Authoritative)',
    gender: 'MALE',
    accent: 'US',
    description: 'Deep, resonant, and natural American male voice for business dialogues.'
  },
  {
    id: 'aura-arcas-en',
    name: 'Aura Arcas (Male - Dynamic & Natural)',
    gender: 'MALE',
    accent: 'US',
    description: 'Friendly, energetic, and engaging American male voice.'
  },
  {
    id: 'aura-perseus-en',
    name: 'Aura Perseus (Male - Warm & Conversational)',
    gender: 'MALE',
    accent: 'US',
    description: 'Smooth, casual American male voice.'
  },
  {
    id: 'aura-helios-en',
    name: 'Aura Helios (Male - British Accent)',
    gender: 'MALE',
    accent: 'UK',
    description: 'Polished British male voice for international English drills.'
  },
  {
    id: 'aura-angus-en',
    name: 'Aura Angus (Male - Casual & Friendly)',
    gender: 'MALE',
    accent: 'US',
    description: 'Warm, casual, and friendly tone for everyday chat.'
  },
  {
    id: 'aura-hera-en',
    name: 'Aura Hera (Female - Confident & Articulate)',
    gender: 'FEMALE',
    accent: 'US',
    description: 'Mature, authoritative, and expressive professional tone.'
  },
  {
    id: 'aura-orpheus-en',
    name: 'Aura Orpheus (Male - Smooth & Clear)',
    gender: 'MALE',
    accent: 'US',
    description: 'Smooth, polished male voice for fluent storytelling.'
  },
  {
    id: 'aura-zeus-en',
    name: 'Aura Zeus (Male - Deep & Resonant)',
    gender: 'MALE',
    accent: 'US',
    description: 'Commanding, deep male articulation for presentations.'
  },
  {
    id: 'aura-athena-en',
    name: 'Aura Athena (Female - Calm & Clear)',
    gender: 'FEMALE',
    accent: 'US',
    description: 'Calm, clear, and confident conversational female voice.'
  }
];

export const DEEPGRAM_VOICES = DEEPGRAM_AURA_VOICES;

/**
 * Natural Prosody & Speech Text Sanitizer:
 * 1. Synonym Slashes (/): When English text contains multiple synonyms/options separated by '/', speaks ONLY the first option.
 * 2. Sentence Pauses & Prosody (//, |): Converts beat markers and semicolons into natural respiratory pauses.
 * 3. Normalization: Normalizes multiple commas and whitespace while preserving visual text integrity.
 * 4. Trailing Pause Comma (", "): Appends a soft trailing comma pause to prevent speech engines from abruptly clipping trailing consonants/vowels.
 */
export function sanitizeSpeechText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let sanitized = text.trim();
  if (!sanitized) return '';

  // 0. Speech-filter regex: Strip pedagogical clutter prompts and dialogue speaker prefixes
  sanitized = sanitized.replace(/^A\.\s*Teamwork\s*B\.\s*Emotion\s*assessment\s*EMOTION\s*/i, '');
  sanitized = sanitized.replace(/^REFLEXES\s*A\.\s*Context\s*mp3\s*B\.\s*Back\s*&\s*Forth\s*/i, '');
  sanitized = sanitized.replace(/^(?:Speaker\s*)?[AB]\s*[-–—:]\s*/i, '');

  sanitized = sanitized.trim();
  if (!sanitized) return '';

  // 1. If beat markers (//, |) follow sentence-ending punctuation (. ! ?), preserve sentence pause
  sanitized = sanitized.replace(/([.!?])\s*(?:\/{2,}|\|+)\s*/g, '$1 ');

  // 2. Replace remaining beat markers (//, ///) and pipe markers (|) with comma pause
  sanitized = sanitized.replace(/\s*(?:\/{2,}|\|+)\s*/g, ', ');

  // 3. If text contains single synonym slashes (/), take ONLY the first option (e.g. "A / B / C" -> "A")
  if (sanitized.includes('/')) {
    sanitized = sanitized.split('/')[0].trim();
  }

  // 4. Normalize semicolons to comma pauses
  sanitized = sanitized.replace(/\s*;\s*/g, ', ');

  // 5. Clean up duplicate or misplaced commas and whitespace
  sanitized = sanitized
    .replace(/\s+,/g, ',')           // No space before comma
    .replace(/,\s*,+/g, ', ')        // No consecutive double commas
    .replace(/\s+/g, ' ')            // Normalize multiple spaces
    .trim();

  if (!sanitized) return '';

  // 6. Trailing Pause Comma enhancement:
  // - If input ends with ? or !, preserve the question/exclamation mark and append ", " (e.g. "Sounds familiar?, " or "Why not!, ")
  // - If input ends with ., replace with ", " (e.g. "I didn't do anything." -> "I didn't do anything, ")
  // - Strip any trailing whitespace, periods, colons, duplicate commas, and append a clean trailing comma pause: ", "
  const questionOrExclamationMatch = sanitized.match(/([?!]+)[.,:;\s]*$/);
  if (questionOrExclamationMatch) {
    const punct = questionOrExclamationMatch[1];
    const prefix = sanitized.slice(0, questionOrExclamationMatch.index).replace(/[,.:;\s]+$/, '');
    sanitized = prefix ? `${prefix}${punct}, ` : `${punct}, `;
  } else {
    const stripped = sanitized.replace(/[,.:;\s]+$/, '');
    if (!stripped) return '';
    sanitized = `${stripped}, `;
  }

  // Final normalization: avoid any consecutive duplicate commas or leading commas
  sanitized = sanitized
    .replace(/\s+,/g, ',')
    .replace(/,\s*,+/g, ', ')
    .replace(/^\s*,+\s*/, '');

  return sanitized;
}

class DeepgramTtsService {
  private cache = new Map<string, string>(); // text+model -> base64 mp3
  private defaultApiKey: string = import.meta.env.VITE_DEEPGRAM_API_KEY || '92def6215618aeda77c43f4446ba84ef7152091c';

  getApiKey(): string {
    const registryKey = modelRegistryService.getNextActiveKey('DEEPGRAM');
    if (registryKey && registryKey.trim()) {
      return registryKey.trim();
    }
    const key = localStorage.getItem('chunks_deepgram_api_key');
    if (!key || key.trim() === '' || key === '51d7d8b230bf742178e681e7836a3dc1571b1c11') {
      return this.defaultApiKey;
    }
    return key;
  }

  setApiKey(key: string): void {
    if (key && key.trim()) {
      localStorage.setItem('chunks_deepgram_api_key', key.trim());
      modelRegistryService.addKey('DEEPGRAM', key.trim(), 'Deepgram Aura Custom');
    } else {
      localStorage.removeItem('chunks_deepgram_api_key');
    }
  }

  /**
   * Synthesize English text into MP3 audio via Deepgram Speak REST API
   * Endpoints:
   * - Flux: https://api.deepgram.com/v2/speak?model={model}&speed=1&expressivity=0
   * - Aura: https://api.deepgram.com/v1/speak?model={model}&encoding=mp3
   */
  async synthesizeText(
    text: string,
    modelName: string = 'flux-cliff-en'
  ): Promise<string> {
    const cleanText = sanitizeSpeechText(text);
    if (!cleanText) throw new Error('Text to synthesize is empty');

    let effectiveModel = (!modelName || modelName === 'aura-theia-en') ? 'flux-cliff-en' : modelName;
    const validModelIds = DEEPGRAM_VOICES.map(v => v.id);
    if (!validModelIds.includes(effectiveModel)) {
      effectiveModel = 'flux-cliff-en';
    }

    const cacheKey = `dg_${effectiveModel}_${cleanText}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Deepgram API Key is missing. Please configure VITE_DEEPGRAM_API_KEY.');
    }

    const isFlux = effectiveModel.startsWith('flux-');
    const url = isFlux
      ? `https://api.deepgram.com/v2/speak?model=${effectiveModel}&speed=1&expressivity=0`
      : `https://api.deepgram.com/v1/speak?model=${effectiveModel}&encoding=mp3`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: cleanText })
    });

    if (response.status === 429) {
      console.warn(`[Deepgram] Hit 429 Rate Limit on key. Rotating key in pool...`);
      const nextKey = modelRegistryService.rotateKeyOn429('DEEPGRAM', apiKey);
      if (nextKey && nextKey !== apiKey) {
        return this.synthesizeText(text, modelName);
      }
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Deepgram ${isFlux ? 'Flux' : 'Aura'} API Error (${response.status}): ${errText}`);
    }

    const blob = await response.blob();
    const base64 = await this.blobToBase64(blob);
    this.cache.set(cacheKey, base64);
    return base64;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (!result) {
          reject(new Error('[Deepgram] FileReader returned empty result'));
        } else {
          resolve(result);
        }
      };
      reader.onerror = () => reject(reader.error || new Error('[Deepgram] FileReader error'));
      reader.readAsDataURL(blob);
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const deepgramTts = new DeepgramTtsService();
