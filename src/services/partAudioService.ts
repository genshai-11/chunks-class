import { audioPlayer } from './googleTtsService';
import { modelRegistryService } from './modelRegistryService';
import { LessonDoc } from '../types';
import { db } from './firestoreService';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface PartAnnouncementDef {
  key: string;             // e.g. "part_slangs", "part_vocab", etc.
  partNumber?: number;     // 1, 2, 3...
  titleEn: string;         // e.g. "Part 1: Vietnamese slangs"
  titleVi: string;         // e.g. "Phần 1: Tiếng lóng Việt Nam"
  speechText: string;      // e.g. "Part 1. Vietnamese slangs."
  categoryGroup?: 'STANDARD' | 'FREE_TALK' | 'SPECIAL' | 'TOPIC';
  lessonScope?: string;    // e.g. "Bài chuẩn (10 bài)", "Day 6 (Free Talk 1)", "Toàn khóa"
}

export interface PartOverride {
  key?: string;
  partNumber?: number;
  titleEn?: string;
  titleVi?: string;
  speechText?: string;
}

const PART_OVERRIDES_STORAGE_KEY_PREFIX = 'chunks_part_overrides_';
const memoryPartOverrides: Record<string, Record<string, PartOverride>> = {};

export function normalizeCourseLevel(level?: string): string {
  if (!level) return 'LEVEL_B';
  const clean = level.toLowerCase().replace(/^course_/, '').toUpperCase();
  return clean;
}

export function getPartOverrides(courseLevel?: string): Record<string, PartOverride> {
  const norm = normalizeCourseLevel(courseLevel);
  if (memoryPartOverrides[norm]) {
    return memoryPartOverrides[norm];
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${PART_OVERRIDES_STORAGE_KEY_PREFIX}${norm}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryPartOverrides[norm] = parsed;
        return parsed;
      }
    } catch {}
  }
  return {};
}

export async function savePartOverrides(
  courseLevel: string,
  overrides: Record<string, PartOverride>
): Promise<void> {
  const norm = normalizeCourseLevel(courseLevel);
  memoryPartOverrides[norm] = { ...overrides };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${PART_OVERRIDES_STORAGE_KEY_PREFIX}${norm}`, JSON.stringify(overrides));
    } catch {}
  }

  // Persist to Firestore settings collection
  try {
    const docRef = doc(db, 'settings', `part_overrides_${norm.toLowerCase()}`);
    await setDoc(docRef, {
      course_level: norm,
      overrides,
      updated_at: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[PartAudioService] Failed to persist part overrides to Firestore settings:', err);
  }

  // Also persist to /courses/{courseId} if matching course exists
  try {
    const courseId = `course_${norm.toLowerCase()}`;
    const courseDocRef = doc(db, 'courses', courseId);
    await setDoc(courseDocRef, {
      part_overrides: overrides,
      updated_at: new Date().toISOString()
    }, { merge: true });
  } catch {}

  // Dispatch custom event for real-time reactivity
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('chunks:part-overrides-updated', {
        detail: { courseLevel: norm, overrides }
      }));
    } catch (e) {
      console.warn('[PartAudioService] Failed to dispatch chunks:part-overrides-updated:', e);
    }
  }
}

export async function loadPartOverridesFromFirestore(courseLevel?: string): Promise<Record<string, PartOverride>> {
  const norm = normalizeCourseLevel(courseLevel);
  try {
    const docRef = doc(db, 'settings', `part_overrides_${norm.toLowerCase()}`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.overrides) {
        memoryPartOverrides[norm] = data.overrides;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`${PART_OVERRIDES_STORAGE_KEY_PREFIX}${norm}`, JSON.stringify(data.overrides));
          } catch {}
          window.dispatchEvent(new CustomEvent('chunks:part-overrides-updated', {
            detail: { courseLevel: norm, overrides: data.overrides }
          }));
        }
        return data.overrides;
      }
    }
  } catch (err) {
    console.warn('[PartAudioService] loadPartOverridesFromFirestore notice:', err);
  }
  return getPartOverrides(norm);
}

/**
 * Derives a canonical, collision-free key for a part announcement.
 * e.g. "Part 1 - Vocabulary Check" -> "part_vocab_check"
 * e.g. "Vocabulary Check" -> "part_vocabulary_check"
 */
export function deriveCanonicalPartKey(partTitleOrCategory?: string, partNumber?: number): string {
  const raw = (partTitleOrCategory || '').trim();
  if (raw) {
    // If already in key format (e.g. "part_slangs"), preserve it
    if (/^part_[a-z0-9_]+$/i.test(raw)) {
      return raw.toLowerCase();
    }
    // Remove "Part X -" or "Part X:" prefix if present to normalize semantic title
    const stripped = raw.replace(/^Part\s*\d+\s*[-:.]\s*/i, '').trim();
    const target = stripped || raw;
    const slug = target.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (slug) {
      return `part_${slug}`;
    }
  }
  if (partNumber !== undefined && partNumber !== null) {
    return `part_${partNumber}`;
  }
  return 'part_unknown';
}

export function findPartOverride(
  overrides: Record<string, PartOverride>,
  partTitleOrCategory?: string,
  partNumber?: number
): PartOverride | undefined {
  if (!overrides || typeof overrides !== 'object') return undefined;

  const raw = (partTitleOrCategory || '').trim();

  // 1. Direct key match: e.g. overrides['part_slangs']
  if (raw && overrides[raw]) {
    return overrides[raw];
  }

  // 2. Canonical key match via deriveCanonicalPartKey
  const canonicalKey = deriveCanonicalPartKey(raw, partNumber);
  if (canonicalKey && overrides[canonicalKey]) {
    return overrides[canonicalKey];
  }

  // 3. Normalized slug key match (raw string as slug)
  if (raw) {
    const derivedKey = `part_${raw.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;
    if (overrides[derivedKey]) return overrides[derivedKey];
  }

  // 4. Exact title matching against override records
  const values = Object.values(overrides);
  if (raw) {
    const rawLower = raw.toLowerCase();
    const cleanRaw = raw.replace(/^Part\s*\d+\s*[-:.]\s*/i, '').trim().toLowerCase();

    // 4a. Match by override.key
    const keyMatch = values.find(o => o.key && o.key.toLowerCase() === rawLower);
    if (keyMatch) return keyMatch;

    // 4b. Match by override.titleEn exactly
    const titleExactMatch = values.find(o => o.titleEn && o.titleEn.toLowerCase() === rawLower);
    if (titleExactMatch) return titleExactMatch;

    // 4c. Match by stripped titleEn (without "Part X -")
    if (cleanRaw) {
      const strippedMatch = values.find(o => {
        if (!o.titleEn) return false;
        const cleanOverride = o.titleEn.replace(/^Part\s*\d+\s*[-:.]\s*/i, '').trim().toLowerCase();
        return cleanOverride === cleanRaw;
      });
      if (strippedMatch) return strippedMatch;
    }
  }

  // 5. Fallback to partNumber ONLY if title is purely generic (e.g. empty, "Part 1", or no specific non-part name)
  // This prevents Part 1 in Level A (Vocab Check) from colliding with Part 1 in Level B (Slangs)
  const isGenericPartTitle = !raw || /^part\s*\d*$/i.test(raw);
  if (isGenericPartTitle) {
    let effectiveNum = partNumber;
    if (effectiveNum === undefined && raw) {
      const m = raw.match(/Part\s*(\d+)/i);
      if (m) effectiveNum = parseInt(m[1], 10);
    }
    if (effectiveNum !== undefined) {
      if (overrides[`part_${effectiveNum}`]) return overrides[`part_${effectiveNum}`];
      if (overrides[String(effectiveNum)]) return overrides[String(effectiveNum)];
      const numMatch = values.find(o => o.partNumber !== undefined && o.partNumber === effectiveNum);
      if (numMatch) return numMatch;
    }
  }

  return undefined;
}
export const CANONICAL_PARTS: PartAnnouncementDef[] = [
  {
    key: 'part_slangs',
    partNumber: 1,
    titleEn: 'Part 1 - Vietnamese Slangs',
    titleVi: 'Phần 1: Tiếng lóng Việt Nam',
    speechText: 'Part 1. Vietnamese slangs.',
    categoryGroup: 'STANDARD',
    lessonScope: 'Toàn khóa (Bài chuẩn)'
  },
  {
    key: 'part_vocab',
    partNumber: 2,
    titleEn: 'Part 2 - Vocab Check',
    titleVi: 'Phần 2: Từ vựng (Vocabulary)',
    speechText: 'Part 2. Vocabulary.',
    categoryGroup: 'STANDARD',
    lessonScope: 'Toàn khóa (Bài chuẩn)'
  },
  {
    key: 'part_phrases',
    partNumber: 3,
    titleEn: 'Part 3 - Phrase Check',
    titleVi: 'Phần 3: Cụm từ (Phrases)',
    speechText: 'Part 3. Phrases.',
    categoryGroup: 'STANDARD',
    lessonScope: 'Toàn khóa (Bài chuẩn)'
  },
  {
    key: 'part_sentences',
    partNumber: 4,
    titleEn: 'Part 4 - Sentence Check',
    titleVi: 'Phần 4: Câu & Cấu trúc (Sentences)',
    speechText: 'Part 4. Sentences.',
    categoryGroup: 'STANDARD',
    lessonScope: 'Toàn khóa (Bài chuẩn)'
  },
  {
    key: 'part_monologue',
    partNumber: 5,
    titleEn: 'Part 5 - Monologue',
    titleVi: 'Phần 5: Độc thoại (Monologue)',
    speechText: 'Part 5. Monologue.',
    categoryGroup: 'STANDARD',
    lessonScope: 'Toàn khóa (Bài chuẩn)'
  },
  {
    key: 'part_dialogue',
    partNumber: 6,
    titleEn: 'Part 6 - Dialogue',
    titleVi: 'Phần 6: Hội thoại (Dialogue)',
    speechText: 'Part 6. Dialogue.',
    categoryGroup: 'STANDARD',
    lessonScope: 'Toàn khóa (Bài chuẩn)'
  },
  {
    key: 'part_review',
    partNumber: 7,
    titleEn: 'Part 7 - 5s Review',
    titleVi: 'Phần 7: Ôn tập phản xạ (Review)',
    speechText: 'Part 7. Review.',
    categoryGroup: 'STANDARD',
    lessonScope: 'Toàn khóa (Bài chuẩn)'
  }
];

/**
 * Vietnamese translation mappings for common part titles across curriculum levels
 */
function getVietnameseTitleForPart(titleEn: string): string {
  const lower = titleEn.toLowerCase();
  const lessonMatch = lower.match(/lesson\s*(\d+)\s*(?:phrase\s*check)?/i);
  if (lessonMatch) {
    const num = lessonMatch[1];
    return `Ôn tập Cụm từ Bài ${num} (Lesson ${num} Phrase Check)`;
  }
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

  // Normalize course level
  const normCourseLevel = courseLevel ? normalizeCourseLevel(courseLevel) : 'LEVEL_B';
  const overrides = getPartOverrides(normCourseLevel);
  const override = findPartOverride(overrides, rawInput, effectivePartNum);
  if (override?.speechText?.trim()) {
    return override.speechText.trim();
  }

  const effectiveRawInput = override?.titleEn?.trim() || rawInput;

  // Normalize 14-part two-topic lessons where parts 8..14 map to topics 1..7 (if not Level A)
  const isLevelA = normCourseLevel === 'LEVEL_A' || effectiveRawInput.toLowerCase().includes('orientation') || effectiveRawInput.toLowerCase().includes('teamwork');
  if (!isLevelA && effectivePartNum && effectivePartNum > 7 && effectivePartNum <= 14) {
    effectivePartNum = effectivePartNum - 7;
  }
  // Check if effectiveRawInput contains an actual descriptive title
  // (i.e. more than just a bare part number like "Part 1" or generic category keyword)
  const cleanTitleAfterPart = effectiveRawInput.replace(/^Part\s*\d+\s*[-:.]\s*/i, '').trim();
  const hasSpecificTitle = cleanTitleAfterPart.length > 0 && !/^part\s*\d+$/i.test(cleanTitleAfterPart);

  if (hasSpecificTitle) {
    const titleLower = cleanTitleAfterPart.toLowerCase();

    // Priority: Lesson X Phrase Check (e.g. "Lesson 1 Phrase Check")
    const lessonCheckMatch = titleLower.match(/lesson\s*(\d+)\s*(?:phrase\s*check)?/i);
    if (lessonCheckMatch) {
      const num = lessonCheckMatch[1];
      return effectivePartNum ? `Part ${effectivePartNum}. Lesson ${num} Phrase Check.` : `Lesson ${num} Phrase Check.`;
    }

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
  const rawPartsList: {
    partStr: string;
    partNum?: number;
    cleanTitle: string;
    key: string;
    lessonTitles: Set<string>;
    firstOccurrenceIndex: number;
  }[] = [];
  const overrides = getPartOverrides(courseLevel);

  if (lessons && lessons.length > 0) {
    let occurrenceCounter = 0;
    for (const lesson of lessons) {
      const lessonTitle = lesson.lesson_title || `Day ${lesson.day_number ?? 0}`;
      const chunks = lesson.chunks || [];
      for (const chunk of chunks) {
        const partStr = chunk.part?.trim();
        if (!partStr) continue;

        if (!seenParts.has(partStr)) {
          seenParts.add(partStr);
          const match = partStr.match(/Part\s*(\d+)/i);
          const partNum = match ? parseInt(match[1], 10) : undefined;
          const cleanTitle = partStr.replace(/^Part\s*\d+\s*[-:.]\s*/i, '').trim();
          const key = deriveCanonicalPartKey(partStr, partNum);
          
          rawPartsList.push({
            partStr,
            partNum,
            cleanTitle,
            key,
            lessonTitles: new Set([lessonTitle]),
            firstOccurrenceIndex: occurrenceCounter++
          });
        } else {
          const existing = rawPartsList.find(p => p.partStr === partStr);
          if (existing) {
            existing.lessonTitles.add(lessonTitle);
          }
        }
      }
    }
  }

  if (rawPartsList.length > 0) {
    const totalLessons = lessons?.length || 0;

    const partsList: PartAnnouncementDef[] = rawPartsList.map((item) => {
      const override = findPartOverride(overrides, item.key, item.partNum) || findPartOverride(overrides, item.partStr, item.partNum);

      const titleEn = override?.titleEn?.trim() || item.partStr;
      const speechText = override?.speechText?.trim() || getPartSpeechText(item.partStr, item.partNum, courseLevel);
      const titleVi = override?.titleVi?.trim() || (item.partNum ? `Phần ${item.partNum}: ${getVietnameseTitleForPart(item.cleanTitle || item.partStr)}` : getVietnameseTitleForPart(item.cleanTitle || item.partStr));

      // Determine categoryGroup and lessonScope
      const lower = item.partStr.toLowerCase();
      let categoryGroup: 'STANDARD' | 'FREE_TALK' | 'SPECIAL' | 'TOPIC' = 'STANDARD';
      let lessonScope = 'Toàn khóa';

      if (lower.includes('orientation')) {
        categoryGroup = 'SPECIAL';
        lessonScope = 'Day 1 (Orientation)';
      } else if (lower.includes('linguistic problems') || lower.includes('4 linguistic problems')) {
        categoryGroup = 'SPECIAL';
        lessonScope = 'Day 8 (Grammar)';
      } else if (lower.includes('final test')) {
        categoryGroup = 'SPECIAL';
        lessonScope = 'Day 15 (Final Test)';
      } else if (lower.includes('lesson') && lower.includes('phrase check')) {
        categoryGroup = 'FREE_TALK';
        const match = lower.match(/lesson\s*(\d+)/i);
        const num = match ? parseInt(match[1], 10) : 0;
        if (num >= 1 && num <= 4) {
          lessonScope = 'Day 6 (Free Talk 1)';
        } else if (num >= 5 && num <= 8) {
          lessonScope = 'Day 12 (Free Talk 2)';
        } else {
          lessonScope = 'Free Talk Review';
        }
      } else if (item.partNum && item.partNum >= 8) {
        categoryGroup = 'TOPIC';
        lessonScope = 'Topic 2 (Nửa sau)';
      } else {
        const count = item.lessonTitles.size;
        if (count >= 5 && totalLessons > 0) {
          lessonScope = `Bài chuẩn (${count} bài)`;
        } else if (count > 1) {
          lessonScope = `${count} bài học`;
        } else if (count === 1) {
          const singleTitle = Array.from(item.lessonTitles)[0];
          const dayMatch = singleTitle.match(/^Day\s*\d+/i);
          lessonScope = dayMatch ? dayMatch[0] : singleTitle;
        } else {
          lessonScope = 'Toàn khóa';
        }
      }

      return {
        key: item.key,
        partNumber: item.partNum,
        titleEn,
        titleVi,
        speechText,
        categoryGroup,
        lessonScope
      };
    });

    // Sort by category group first, then part number
    const groupWeight: Record<'STANDARD' | 'TOPIC' | 'FREE_TALK' | 'SPECIAL', number> = {
      'STANDARD': 1,
      'TOPIC': 2,
      'FREE_TALK': 3,
      'SPECIAL': 4
    };

    return partsList.sort((a, b) => {
      const weightA = groupWeight[a.categoryGroup || 'STANDARD'] ?? 99;
      const weightB = groupWeight[b.categoryGroup || 'STANDARD'] ?? 99;
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      if (a.partNumber && b.partNumber) {
        if (a.partNumber !== b.partNumber) {
          return a.partNumber - b.partNumber;
        }
      } else if (a.partNumber) {
        return -1;
      } else if (b.partNumber) {
        return 1;
      }
      return a.titleEn.localeCompare(b.titleEn);
    });
  }

  // Fallback if course lessons lack chunk.part (e.g. Level B ERES which uses category-based canonical parts)
  return CANONICAL_PARTS.map(p => {
    const override = findPartOverride(overrides, p.key, p.partNumber);
    return {
      ...p,
      titleEn: override?.titleEn?.trim() || p.titleEn,
      titleVi: override?.titleVi?.trim() || p.titleVi,
      speechText: override?.speechText?.trim() || p.speechText,
      categoryGroup: p.categoryGroup || 'STANDARD',
      lessonScope: p.lessonScope || 'Toàn khóa'
    };
  });
}


/**
 * Checks if the audio for a part announcement is already cached in memory or IndexedDB
 */
export async function isPartAudioCached(
  partTitle: string,
  partNumberOrVoice?: number | string,
  voiceOrPartNumber?: string | number,
  courseLevel?: string
): Promise<boolean> {
  // Standardize arguments with backward compatibility:
  // Signature A: isPartAudioCached(partTitle, partNumber, voice, courseLevel)
  // Signature B (legacy): isPartAudioCached(partTitle, voice, partNumber, courseLevel)
  let effectivePartNumber: number | undefined;
  let effectiveVoice: string | undefined;
  let effectiveCourseLevel = courseLevel;

  if (typeof partNumberOrVoice === 'number') {
    effectivePartNumber = partNumberOrVoice;
    if (typeof voiceOrPartNumber === 'string') {
      effectiveVoice = voiceOrPartNumber;
    }
  } else if (typeof partNumberOrVoice === 'string') {
    // If 2nd arg is a string, check if it's a numeric string or a voice name
    if (/^\d+$/.test(partNumberOrVoice)) {
      effectivePartNumber = parseInt(partNumberOrVoice, 10);
      if (typeof voiceOrPartNumber === 'string') {
        effectiveVoice = voiceOrPartNumber;
      }
    } else {
      // Legacy: 2nd arg is voice
      effectiveVoice = partNumberOrVoice;
      if (typeof voiceOrPartNumber === 'number') {
        effectivePartNumber = voiceOrPartNumber;
      } else if (typeof voiceOrPartNumber === 'string' && /^\d+$/.test(voiceOrPartNumber)) {
        effectivePartNumber = parseInt(voiceOrPartNumber, 10);
      }
    }
  } else if (typeof voiceOrPartNumber === 'number') {
    effectivePartNumber = voiceOrPartNumber;
  }

  const speechText = getPartSpeechText(partTitle, effectivePartNumber, effectiveCourseLevel);
  const voiceEn = effectiveVoice || modelRegistryService.getMainModelEn();
  const cached = await audioPlayer.getCachedAudioAsync(speechText, voiceEn);
  return Boolean(cached);
}

/**
 * Plays part announcement audio through the central audioPlayer facade.
 * Utilizes prepared cache (memory + IndexedDB) or synthesizes on-the-fly via Deepgram / Google Cloud TTS.
 */
export async function playPartIntro(partTitle: string, partNumber?: number, voice?: string, courseLevel?: string): Promise<void> {
  const speechText = getPartSpeechText(partTitle, partNumber, courseLevel);
  const voiceEn = voice || modelRegistryService.getMainModelEn();
  await audioPlayer.playChunk(speechText, null, voiceEn, 1.0, true);
}

/**
 * Synthesizes and caches (or re-caches) audio for a single part announcement with forceRegenerate: true,
 * then auditions it immediately.
 */
export async function regeneratePartAudio(partTitle: string, partNumber?: number, voice?: string, courseLevel?: string): Promise<void> {
  const speechText = getPartSpeechText(partTitle, partNumber, courseLevel);
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

