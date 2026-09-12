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
    titleEn: 'Part 1: Vietnamese slangs',
    titleVi: 'Phần 1: Tiếng lóng Việt Nam',
    speechText: 'Part 1. Vietnamese slangs.'
  },
  {
    key: 'part_vocab',
    partNumber: 2,
    titleEn: 'Part 2: Vocabulary',
    titleVi: 'Phần 2: Từ vựng',
    speechText: 'Part 2. Vocabulary.'
  },
  {
    key: 'part_sentences',
    partNumber: 3,
    titleEn: 'Part 3: Sentences',
    titleVi: 'Phần 3: Câu mẫu',
    speechText: 'Part 3. Sentences.'
  },
  {
    key: 'part_monologue',
    partNumber: 4,
    titleEn: 'Part 4: Monologue',
    titleVi: 'Phần 4: Độc thoại',
    speechText: 'Part 4. Monologue.'
  },
  {
    key: 'part_dialogue',
    partNumber: 5,
    titleEn: 'Part 5: Dialogue',
    titleVi: 'Phần 5: Hội thoại',
    speechText: 'Part 5. Dialogue.'
  },
  {
    key: 'part_review',
    partNumber: 6,
    titleEn: 'Part 6: Review & Drill',
    titleVi: 'Phần 6: Ôn tập & Phản xạ',
    speechText: 'Part 6. Review.'
  },
  {
    key: 'part_wrapup',
    partNumber: 7,
    titleEn: 'Part 7: Wrap-up',
    titleVi: 'Phần 7: Tổng kết',
    speechText: 'Part 7. Wrap-up.'
  }
];

/**
 * Resolves speech text for a part transition announcement.
 * Recognizes part numbers (1..7, or >7 for multi-topic cohorts mapped to 1..7),
 * category keywords (slang, vocab, sentence, monologue, dialogue, review, wrap),
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

  // 2. Keyword matching on categories
  if (raw.includes('slang') || raw.includes('lóng')) {
    return 'Part 1. Vietnamese slangs.';
  }
  if (raw.includes('vocab') || raw.includes('từ vựng')) {
    return 'Part 2. Vocabulary.';
  }
  if (raw.includes('sentence') || raw.includes('phrase') || raw.includes('câu')) {
    return 'Part 3. Sentences.';
  }
  if (raw.includes('monologue') || raw.includes('độc thoại')) {
    return 'Part 4. Monologue.';
  }
  if (raw.includes('dialogue') || raw.includes('hội thoại')) {
    return 'Part 5. Dialogue.';
  }
  if (raw.includes('review') || raw.includes('drill') || raw.includes('ôn tập') || raw.includes('5s')) {
    return 'Part 6. Review.';
  }
  if (raw.includes('wrap') || raw.includes('tổng kết')) {
    return 'Part 7. Wrap-up.';
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
export async function isPartAudioCached(partTitle: string, voice?: string): Promise<boolean> {
  const speechText = getPartSpeechText(partTitle);
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
