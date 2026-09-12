import { audioPlayer } from './googleTtsService';
import { modelRegistryService } from './modelRegistryService';

export interface PartAnnouncementDef {
  key: string;             // e.g. "part_slangs", "part_vocab", etc.
  partNumber?: number;     // 1, 2, 3...
  titleEn: string;         // e.g. "Part 1: Vietnamese slangs"
  titleVi: string;         // e.g. "Phần 1: Tiếng lóng Việt Nam"
  speechText: string;      // e.g. "Part 1. Vietnamese slangs."
}

export const CANONICAL_PARTS: PartAnnouncementDef[] = [
  {
    key: 'part_slangs',
    partNumber: 1,
    titleEn: 'Part 1 - Vietnamese Slangs',
    titleVi: 'Phần 1: Tiếng lóng Việt Nam',
    speechText: 'Part 1. Vietnamese slangs.'
  },
  {
    key: 'part_vocab',
    partNumber: 2,
    titleEn: 'Part 2 - Vocab Check',
    titleVi: 'Phần 2: Từ vựng (Vocabulary)',
    speechText: 'Part 2. Vocabulary.'
  },
  {
    key: 'part_phrases',
    partNumber: 3,
    titleEn: 'Part 3 - Phrase Check',
    titleVi: 'Phần 3: Cụm từ (Phrases)',
    speechText: 'Part 3. Phrases.'
  },
  {
    key: 'part_sentences',
    partNumber: 4,
    titleEn: 'Part 4 - Sentence Check',
    titleVi: 'Phần 4: Câu & Cấu trúc (Sentences)',
    speechText: 'Part 4. Sentences.'
  },
  {
    key: 'part_monologue',
    partNumber: 5,
    titleEn: 'Part 5 - Monologue',
    titleVi: 'Phần 5: Độc thoại (Monologue)',
    speechText: 'Part 5. Monologue.'
  },
  {
    key: 'part_dialogue',
    partNumber: 6,
    titleEn: 'Part 6 - Dialogue',
    titleVi: 'Phần 6: Hội thoại (Dialogue)',
    speechText: 'Part 6. Dialogue.'
  },
  {
    key: 'part_review',
    partNumber: 7,
    titleEn: 'Part 7 - 5s Review',
    titleVi: 'Phần 7: Ôn tập phản xạ (Review)',
    speechText: 'Part 7. Review.'
  }
];

/**
 * Resolves speech text for a part transition announcement.
 * Recognizes part numbers (1..7, or >7 for multi-topic cohorts mapped to 1..7),
 * category keywords (slang, vocab, phrase, sentence, monologue, dialogue, review),
 * or exact canonical titles.
 */
export function getPartSpeechText(partTitleOrCategory: string, partNumber?: number): string {
  // 1. If explicit partNumber is provided:
  let effectivePartNum = partNumber;
  if (!effectivePartNum && partTitleOrCategory) {
    const match = partTitleOrCategory.match(/Part\s*(\d+)/i);
    if (match) {
      effectivePartNum = parseInt(match[1], 10);
    }
  }

  // Handle 14-part two-topic lessons where parts 8..14 map to topics 1..7
  if (effectivePartNum && effectivePartNum > 7 && effectivePartNum <= 14) {
    effectivePartNum = effectivePartNum - 7;
  }

  if (effectivePartNum && effectivePartNum >= 1 && effectivePartNum <= 7) {
    const canonical = CANONICAL_PARTS.find(p => p.partNumber === effectivePartNum);
    if (canonical) return canonical.speechText;
  }

  const raw = (partTitleOrCategory || '').trim().toLowerCase();

  // 2. Keyword matching on categories (matches Level B ERE 7 canonical parts)
  if (raw.includes('slang') || raw.includes('lóng')) {
    return 'Part 1. Vietnamese slangs.';
  }
  if (raw.includes('vocab') || raw.includes('từ vựng')) {
    return 'Part 2. Vocabulary.';
  }
  if (raw.includes('phrase') || raw.includes('cụm')) {
    return 'Part 3. Phrases.';
  }
  if (raw.includes('sentence') || raw.includes('câu')) {
    return 'Part 4. Sentences.';
  }
  if (raw.includes('monologue') || raw.includes('độc thoại')) {
    return 'Part 5. Monologue.';
  }
  if (raw.includes('dialogue') || raw.includes('hội thoại')) {
    return 'Part 6. Dialogue.';
  }
  if (raw.includes('review') || raw.includes('5s') || raw.includes('drill') || raw.includes('ôn tập') || raw.includes('phản xạ')) {
    return 'Part 7. Review.';
  }

  // 3. Fallback: clean up formatting
  if (partTitleOrCategory) {
    return partTitleOrCategory
      .replace(/^Part\s*(\d+)\s*[-:]\s*/i, 'Part $1. ')
      .trim();
  }

  return 'Part Transition';
}

/**
 * Checks if the audio for a part announcement is already cached in memory or IndexedDB
 */
export async function isPartAudioCached(partTitle: string, voice?: string, partNumber?: number): Promise<boolean> {
  const speechText = getPartSpeechText(partTitle, partNumber);
  const voiceEn = voice || modelRegistryService.getMainModelEn();
  const cached = await audioPlayer.getCachedAudioAsync(speechText, voiceEn);
  return Boolean(cached);
}

/**
 * Plays part announcement audio through the central audioPlayer facade.
 * Utilizes prepared cache (memory + IndexedDB) or synthesizes on-the-fly via Deepgram / Google Cloud TTS.
 */
export async function playPartIntro(partTitle: string, partNumber?: number, voice?: string): Promise<void> {
  const speechText = getPartSpeechText(partTitle, partNumber);
  const voiceEn = voice || modelRegistryService.getMainModelEn();
  await audioPlayer.playChunk(speechText, null, voiceEn, 1.0, true);
}

/**
 * Synthesizes and caches (or re-caches) audio for a single part announcement with forceRegenerate: true,
 * then auditions it immediately.
 */
export async function regeneratePartAudio(partTitle: string, partNumber?: number, voice?: string): Promise<void> {
  const speechText = getPartSpeechText(partTitle, partNumber);
  const voiceEn = voice || modelRegistryService.getMainModelEn();
  await audioPlayer.synthesizeSingleChunk({
    text: speechText,
    language: 'en',
    voiceName: voiceEn,
    forceRegenerate: true
  });
  await audioPlayer.playChunk(speechText, null, voiceEn, 1.0, true);
}

/**
 * Pre-synthesizes and caches audio for all 7 canonical parts in IndexedDB (`chunks_audio_db`)
 */
export async function prepareAllCanonicalPartAudios(
  voice?: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const voiceEn = voice || modelRegistryService.getMainModelEn();
  const total = CANONICAL_PARTS.length;

  for (let i = 0; i < total; i++) {
    const part = CANONICAL_PARTS[i];
    try {
      await audioPlayer.synthesizeSingleChunk({
        text: part.speechText,
        language: 'en',
        voiceName: voiceEn
      });
    } catch (err) {
      console.warn(`[PartAudioService] Synthesis failed for "${part.speechText}":`, err);
    }
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }
}
