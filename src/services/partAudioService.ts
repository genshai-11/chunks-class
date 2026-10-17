import { audioPlayer } from './googleTtsService';
import { modelRegistryService } from './modelRegistryService';

export interface PartAnnouncementDef {
  key: string;             // e.g. "part_slangs", "part_vocab", etc.
  partNumber?: number;     // 1, 2, 3...
  titleEn: string;         // e.g. "Part 1: Vietnamese slangs"
  titleVi: string;         // e.g. "Phần 1: Tiếng lóng Việt Nam"
  speechText: string;      // e.g. "Part 1. Vietnamese slangs."
}

import { LessonDoc } from '../types';

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
 * Vietnamese translation mappings for common part titles across curriculum levels
 */
function getVietnameseTitleForPart(titleEn: string): string {
  const lower = titleEn.toLowerCase();
  if (lower.includes('orientation vocab')) return 'Từ vựng định hướng (Orientation Vocab)';
  if (lower.includes('orientation phrase')) return 'Cụm từ định hướng (Orientation Phrases)';
  if (lower.includes('vocabulary check')) return 'Kiểm tra Từ vựng (Vocabulary Check)';
  if (lower.includes('phrase check')) return 'Kiểm tra Cụm từ (Phrase Check)';
  if (lower.includes('teamwork')) return 'Luyện tập nhóm (Teamwork)';
  if (lower.includes('work in pairs') || lower.includes('listening')) return 'Luyện đôi & Nghe (Pair work)';
  if (lower.includes('linguistic problems')) return '4 Vấn đề ngôn ngữ (4 Linguistic Problems)';
  if (lower.includes('final test phrases')) return 'Cụm từ kiểm tra cuối khóa (Final Test Phrases)';
  if (lower.includes('final test review')) return 'Ôn tập kiểm tra cuối khóa (Final Test Review)';
  if (lower.includes('scene introduction')) return 'Giới thiệu phân cảnh (Scene Introduction)';
  if (lower.includes('movie shadowing')) return 'Luyện nói nhại phim (Movie Shadowing)';
  if (lower.includes('rapid review')) return 'Ôn tập nhanh phản xạ (Rapid Review)';
  if (lower.includes('slang') || lower.includes('lóng')) return 'Tiếng lóng Việt Nam (Vietnamese Slangs)';
  if (lower.includes('vocab')) return 'Từ vựng (Vocabulary)';
  if (lower.includes('phrase') || lower.includes('cụm')) return 'Cụm từ (Phrases)';
  if (lower.includes('sentence') || lower.includes('câu')) return 'Câu & Cấu trúc (Sentences)';
  if (lower.includes('monologue') || lower.includes('độc thoại')) return 'Độc thoại (Monologue)';
  if (lower.includes('dialogue') || lower.includes('hội thoại')) return 'Hội thoại (Dialogue)';
  if (lower.includes('review') || lower.includes('ôn tập')) return 'Ôn tập phản xạ (Review)';
  return titleEn;
}

/**
 * Resolves speech text for a part transition announcement.
 * Uses the actual part title when present so each level (e.g. Level A vs Level B)
 * announces its own authentic title instead of forcing Level B's "Vietnamese slangs".
 */
export function getPartSpeechText(
  partTitleOrCategory: string,
  partNumber?: number,
  courseLevel?: string
): string {
  const rawInput = (partTitleOrCategory || '').trim();

  // Extract explicit or implicit part number
  let effectivePartNum = partNumber;
  if (!effectivePartNum && rawInput) {
    const match = rawInput.match(/Part\s*(\d+)/i);
    if (match) {
      effectivePartNum = parseInt(match[1], 10);
    }
  }

  // Normalize 14-part two-topic lessons where parts 8..14 map to topics 1..7 (if not Level A)
  const isLevelA = courseLevel === 'LEVEL_A' || rawInput.toLowerCase().includes('orientation') || rawInput.toLowerCase().includes('teamwork');
  if (!isLevelA && effectivePartNum && effectivePartNum > 7 && effectivePartNum <= 14) {
    effectivePartNum = effectivePartNum - 7;
  }

  // Check if partTitleOrCategory contains an actual descriptive title
  // (i.e. more than just a bare part number like "Part 1" or generic category keyword)
  const cleanTitleAfterPart = rawInput.replace(/^Part\s*\d+\s*[-:.]\s*/i, '').trim();
  const hasSpecificTitle = cleanTitleAfterPart.length > 0 && !/^part\s*\d+$/i.test(cleanTitleAfterPart);

  if (hasSpecificTitle) {
    const titleLower = cleanTitleAfterPart.toLowerCase();

    // Specific recognized titles with clear pronunciation prosody
    if (titleLower.includes('orientation vocab')) {
      return effectivePartNum ? `Part ${effectivePartNum}. Orientation Vocabulary.` : 'Orientation Vocabulary.';
    }
    if (titleLower.includes('orientation phrase')) {
      return effectivePartNum ? `Part ${effectivePartNum}. Orientation Phrases.` : 'Orientation Phrases.';
    }
    if (titleLower.includes('vocab check')) {
      return effectivePartNum ? `Part ${effectivePartNum}. Vocabulary.` : 'Vocabulary.';
    }
    if (titleLower.includes('vocabulary check')) {
      return effectivePartNum ? `Part ${effectivePartNum}. Vocabulary Check.` : 'Vocabulary Check.';
    }
    if (titleLower.includes('phrase check')) {
      return effectivePartNum ? `Part ${effectivePartNum}. Phrase Check.` : 'Phrase Check.';
    }
    if (titleLower.includes('teamwork')) {
      return effectivePartNum ? `Part ${effectivePartNum}. Teamwork.` : 'Teamwork.';
    }
    if (titleLower.includes('work in pairs') || titleLower.includes('listening')) {
      return effectivePartNum ? `Part ${effectivePartNum}. Work in pairs, listening.` : 'Work in pairs, listening.';
    }
    if (titleLower.includes('4 linguistic problems') || titleLower.includes('linguistic problems')) {
      return effectivePartNum ? `Part ${effectivePartNum}. Four Linguistic Problems.` : 'Four Linguistic Problems.';
    }
    if (titleLower.includes('final test phrases')) {
      return effectivePartNum ? `Part ${effectivePartNum}. Final Test Phrases.` : 'Final Test Phrases.';
    }
    if (titleLower.includes('final test review')) {
      return effectivePartNum ? `Part ${effectivePartNum}. Final Test Review.` : 'Final Test Review.';
    }
    if (titleLower.includes('scene introduction')) {
      return effectivePartNum ? `Part ${effectivePartNum}. Scene Introduction.` : 'Scene Introduction.';
    }
    if (titleLower.includes('movie shadowing')) {
      return effectivePartNum ? `Part ${effectivePartNum}. Movie Shadowing.` : 'Movie Shadowing.';
    }
    if (titleLower.includes('rapid review')) {
      return effectivePartNum ? `Part ${effectivePartNum}. Rapid Review.` : 'Rapid Review.';
    }
    if (titleLower.includes('vietnamese slang') || titleLower.includes('slang')) {
      return effectivePartNum ? `Part ${effectivePartNum}. Vietnamese slangs.` : 'Vietnamese slangs.';
    }
    if (titleLower.includes('sentence check') || titleLower === 'sentence' || titleLower === 'sentences') {
      return effectivePartNum ? `Part ${effectivePartNum}. Sentences.` : 'Sentences.';
    }
    if (titleLower === 'monologue') {
      return effectivePartNum ? `Part ${effectivePartNum}. Monologue.` : 'Monologue.';
    }
    if (titleLower === 'dialogue') {
      return effectivePartNum ? `Part ${effectivePartNum}. Dialogue.` : 'Dialogue.';
    }
    if (titleLower.includes('review') || titleLower.includes('5s')) {
      return effectivePartNum ? `Part ${effectivePartNum}. Review.` : 'Review.';
    }
    if (titleLower === 'vocab' || titleLower === 'vocabulary') {
      return effectivePartNum ? `Part ${effectivePartNum}. Vocabulary.` : 'Vocabulary.';
    }
    if (titleLower === 'phrase' || titleLower === 'phrases') {
      return effectivePartNum ? `Part ${effectivePartNum}. Phrases.` : 'Phrases.';
    }

    // Clean formatted speech text fallback from specific title
    const formattedCleanTitle = cleanTitleAfterPart.replace(/[-_]/g, ' ').trim();
    const prefix = effectivePartNum ? `Part ${effectivePartNum}. ` : '';
    const suffix = formattedCleanTitle.endsWith('.') ? '' : '.';
    return `${prefix}${formattedCleanTitle}${suffix}`;
  }

  // Level B canonical parts fallback when strictly given a canonical part number (1..7) or generic category
  if (effectivePartNum && effectivePartNum >= 1 && effectivePartNum <= 7 && !isLevelA) {
    const canonical = CANONICAL_PARTS.find(p => p.partNumber === effectivePartNum);
    if (canonical) return canonical.speechText;
  }

  const rawLower = rawInput.toLowerCase();
  if (rawLower.includes('slang') || rawLower.includes('lóng')) {
    return effectivePartNum ? `Part ${effectivePartNum}. Vietnamese slangs.` : 'Part 1. Vietnamese slangs.';
  }
  if (rawLower.includes('vocab') || rawLower.includes('từ vựng')) {
    return effectivePartNum ? `Part ${effectivePartNum}. Vocabulary.` : 'Part 2. Vocabulary.';
  }
  if (rawLower.includes('phrase') || rawLower.includes('cụm')) {
    return effectivePartNum ? `Part ${effectivePartNum}. Phrases.` : 'Part 3. Phrases.';
  }
  if (rawLower.includes('sentence') || rawLower.includes('câu')) {
    return effectivePartNum ? `Part ${effectivePartNum}. Sentences.` : 'Part 4. Sentences.';
  }
  if (rawLower.includes('monologue') || rawLower.includes('độc thoại')) {
    return effectivePartNum ? `Part ${effectivePartNum}. Monologue.` : 'Part 5. Monologue.';
  }
  if (rawLower.includes('dialogue') || rawLower.includes('hội thoại')) {
    return effectivePartNum ? `Part ${effectivePartNum}. Dialogue.` : 'Part 6. Dialogue.';
  }
  if (rawLower.includes('review') || rawLower.includes('5s') || rawLower.includes('drill') || rawLower.includes('ôn tập') || rawLower.includes('phản xạ')) {
    return effectivePartNum ? `Part ${effectivePartNum}. Review.` : 'Part 7. Review.';
  }

  if (effectivePartNum) {
    return `Part ${effectivePartNum}.`;
  }

  return 'Part Transition';
}

/**
 * Dynamically extracts all distinct part announcement definitions from a course's lessons.
 * Falls back to canonical parts if no explicit parts are defined.
 */
export function getCoursePartsFromLessons(lessons: LessonDoc[], courseLevel?: string): PartAnnouncementDef[] {
  const seenParts = new Set<string>();
  const partsList: PartAnnouncementDef[] = [];

  if (lessons && lessons.length > 0) {
    for (const lesson of lessons) {
      const chunks = lesson.chunks || [];
      for (const chunk of chunks) {
        const partStr = chunk.part?.trim();
        if (partStr && !seenParts.has(partStr)) {
          seenParts.add(partStr);

          const match = partStr.match(/Part\s*(\d+)/i);
          const partNum = match ? parseInt(match[1], 10) : undefined;
          const cleanTitle = partStr.replace(/^Part\s*\d+\s*[-:.]\s*/i, '').trim();
          const key = `part_${partStr.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
          const speechText = getPartSpeechText(partStr, partNum, courseLevel || lesson.level_code);
          const titleVi = getVietnameseTitleForPart(cleanTitle || partStr);

          partsList.push({
            key,
            partNumber: partNum,
            titleEn: partStr,
            titleVi: partNum ? `Phần ${partNum}: ${titleVi}` : titleVi,
            speechText
          });
        }
      }
    }
  }

  // If course has explicit parts extracted, sort them naturally by partNumber or order of occurrence
  if (partsList.length > 0) {
    return partsList.sort((a, b) => {
      if (a.partNumber && b.partNumber) return a.partNumber - b.partNumber;
      if (a.partNumber) return -1;
      if (b.partNumber) return 1;
      return a.titleEn.localeCompare(b.titleEn);
    });
  }

  // Fallback if course lessons lack chunk.part (e.g. Level B ERES which uses category-based canonical parts)
  return CANONICAL_PARTS;
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

/**
 * Pre-synthesizes and caches audio for dynamic course parts in IndexedDB (`chunks_audio_db`)
 */
export async function prepareCoursePartAudios(
  parts: PartAnnouncementDef[],
  voice?: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const voiceEn = voice || modelRegistryService.getMainModelEn();
  const total = parts.length;

  for (let i = 0; i < total; i++) {
    const part = parts[i];
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

