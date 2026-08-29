import { LessonDoc, ChunkItem, CourseLevel } from '../types';
import { getLessonById as getFirestoreLessonById, getLessonsByLevel, getAllLessons } from '../services/firestoreService';

export const lessonsApi = {
  /**
   * Get all lessons for any dynamic course or level code
   */
  async getLessonsByLevel(courseIdOrLevel: CourseLevel | string): Promise<LessonDoc[]> {
    return await getLessonsByLevel(courseIdOrLevel);
  },

  /**
   * Get a single lesson by ID
   */
  async getLesson(lessonId: string): Promise<LessonDoc | null> {
    return await getFirestoreLessonById(lessonId);
  },

  /**
   * Search chunks across any or all courses dynamically
   */
  async searchChunks(queryStr: string, courseIdOrLevel?: CourseLevel | string): Promise<{ chunk: ChunkItem; lesson: LessonDoc }[]> {
    const q = queryStr.trim().toLowerCase();
    if (!q) return [];

    const lessons = courseIdOrLevel 
      ? await this.getLessonsByLevel(courseIdOrLevel) 
      : await getAllLessons();

    const results: { chunk: ChunkItem; lesson: LessonDoc }[] = [];

    for (const lesson of lessons) {
      if (!lesson.chunks) continue;
      for (const chunk of lesson.chunks) {
        if (
          chunk.english?.toLowerCase().includes(q) ||
          chunk.vietnamese?.toLowerCase().includes(q) ||
          (chunk.speaker && chunk.speaker.toLowerCase().includes(q))
        ) {
          results.push({ chunk, lesson });
          if (results.length >= 150) return results;
        }
      }
    }

    return results;
  }
};
