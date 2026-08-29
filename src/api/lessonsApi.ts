import { LessonDoc, ChunkItem, CourseLevel } from '../types';
import { getLessonById as getFirestoreLessonById } from '../services/firestoreService';
import { CURRICULUM_CATALOG_LEVEL_A } from '../data/levelAData';
import { CURRICULUM_CATALOG_LEVEL_B } from '../data/curriculumData';

export const lessonsApi = {
  /**
   * Get all lessons for a curriculum level
   */
  getLessonsByLevel(level: CourseLevel): LessonDoc[] {
    return level === 'LEVEL_A' ? CURRICULUM_CATALOG_LEVEL_A : CURRICULUM_CATALOG_LEVEL_B;
  },

  /**
   * Get a single lesson by ID with Firestore live fetch and fallback
   */
  async getLesson(lessonId: string): Promise<LessonDoc | null> {
    try {
      const live = await getFirestoreLessonById(lessonId);
      if (live && live.chunks && live.chunks.length > 0) return live;
    } catch {}

    const all = [...CURRICULUM_CATALOG_LEVEL_A, ...CURRICULUM_CATALOG_LEVEL_B];
    return all.find(l => l.id === lessonId) || null;
  },

  /**
   * Search chunks across curriculum
   */
  searchChunks(query: string, level?: CourseLevel): { chunk: ChunkItem; lesson: LessonDoc }[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const lessons = level 
      ? this.getLessonsByLevel(level) 
      : [...CURRICULUM_CATALOG_LEVEL_A, ...CURRICULUM_CATALOG_LEVEL_B];

    const results: { chunk: ChunkItem; lesson: LessonDoc }[] = [];

    for (const lesson of lessons) {
      for (const chunk of lesson.chunks) {
        if (
          chunk.english.toLowerCase().includes(q) ||
          chunk.vietnamese.toLowerCase().includes(q) ||
          (chunk.speaker && chunk.speaker.toLowerCase().includes(q))
        ) {
          results.push({ chunk, lesson });
          if (results.length >= 100) return results;
        }
      }
    }

    return results;
  }
};
