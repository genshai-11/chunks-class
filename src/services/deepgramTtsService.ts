export interface DeepgramVoiceOption {
  id: string;
  name: string;
  gender: 'FEMALE' | 'MALE';
  accent: 'US' | 'UK';
  description: string;
}

export const DEEPGRAM_AURA_VOICES: DeepgramVoiceOption[] = [
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
  }
];

/**
 * Natural Prosody & Speech Text Sanitizer:
 * 1. Synonym Slashes (/): When English text contains multiple synonyms/options separated by '/', speaks ONLY the first option.
 * 2. Sentence Pauses & Prosody (//, |): Converts beat markers and semicolons into natural respiratory pauses.
 * 3. Normalization: Normalizes multiple commas and whitespace while preserving visual text integrity.
 */
export function sanitizeSpeechText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let sanitized = text.trim();

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
    .replace(/,\s*$/g, '')           // Trim trailing comma
    .trim();

  return sanitized;
}

class DeepgramTtsService {
  private cache = new Map<string, string>(); // text+model -> base64 mp3
  private defaultApiKey: string = import.meta.env.VITE_DEEPGRAM_API_KEY || '51d7d8b230bf742178e681e7836a3dc1571b1c11';

  getApiKey(): string {
    return localStorage.getItem('chunks_deepgram_api_key') || this.defaultApiKey;
  }

  setApiKey(key: string): void {
    if (key && key.trim()) {
      localStorage.setItem('chunks_deepgram_api_key', key.trim());
    } else {
      localStorage.removeItem('chunks_deepgram_api_key');
    }
  }

  /**
   * Synthesize English text into MP3 audio via Deepgram Speak REST API
   * Endpoint: https://api.deepgram.com/v1/speak?model={model}&encoding=mp3
   */
  async synthesizeText(
    text: string,
    modelName: string = 'aura-asteria-en'
  ): Promise<string> {
    const cleanText = sanitizeSpeechText(text);
    if (!cleanText) throw new Error('Text to synthesize is empty');

    const cacheKey = `dg_${modelName}_${cleanText}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Deepgram API Key is missing. Please configure VITE_DEEPGRAM_API_KEY.');
    }

    const url = `https://api.deepgram.com/v1/speak?model=${modelName}&encoding=mp3`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: cleanText })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Deepgram Aura API Error (${response.status}): ${errText}`);
    }

    const blob = await response.blob();
    const base64 = await this.blobToBase64(blob);
    this.cache.set(cacheKey, base64);
    return base64;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip data:audio/mp3;base64, prefix if present, return full data URI
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const deepgramTts = new DeepgramTtsService();
