import { Course, LessonDoc, CourseLevel } from '../types';
import { CURRICULUM_CATALOG_LEVEL_A } from '../data/levelAData';
import { CURRICULUM_CATALOG_LEVEL_B } from '../data/curriculumData';

/**
 * Dynamic In-Memory Curriculum Registry
 * Supports runtime registration and lookup of arbitrary courses, levels, and lessons.
 */
class CurriculumRegistryService {
  private coursesMap = new Map<string, Course>();
  private lessonsMap = new Map<string, LessonDoc[]>(); // Keyed by course_id or level_code
  private individualLessonsMap = new Map<string, LessonDoc>(); // Keyed by lesson.id

  constructor() {
    this.initDefaultSeed();
  }

  private initDefaultSeed() {
    // Seed Level A
    const courseA: Course = {
      id: "course_level_a",
      level_code: "LEVEL_A",
      title: "Level A - Foundation English Chunks",
      description: "16 Lessons (Word List + Days 1..15) with 4,480 essential conversational and survival chunks.",
      total_days: 16,
      total_chunks: 4480,
      default_sessions_count: 15,
      source: "Genshai Foundation Curriculum (ERES Design)",
      is_active: true
    };
    this.registerCourse(courseA, CURRICULUM_CATALOG_LEVEL_A);

    // Seed Level B
    const courseB: Course = {
      id: "course_level_b",
      level_code: "LEVEL_B",
      title: "Level B - Spoken Chunks Masterclass",
      description: "14 Days (Days 2..15) with 3,371 high-frequency native spoken chunks.",
      total_days: 14,
      total_chunks: 3371,
      default_sessions_count: 15,
      source: "Genshai Masterclass Curriculum",
      is_active: true
    };
    this.registerCourse(courseB, CURRICULUM_CATALOG_LEVEL_B);
  }

  /**
   * Register or update a course and its lessons in the dynamic registry
   */
  public registerCourse(course: Course, lessons: LessonDoc[]): void {
    this.coursesMap.set(course.id, course);
    this.coursesMap.set(course.level_code.toUpperCase(), course);

    const sortedLessons = [...lessons].sort((a, b) => a.day_number - b.day_number);
    this.lessonsMap.set(course.id, sortedLessons);
    this.lessonsMap.set(course.level_code.toUpperCase(), sortedLessons);

    sortedLessons.forEach(l => {
      this.individualLessonsMap.set(l.id, l);
    });
  }

  public getAllCourses(): Course[] {
    const unique = new Map<string, Course>();
    this.coursesMap.forEach(c => unique.set(c.id, c));
    return Array.from(unique.values());
  }

  public getCourse(courseIdOrLevel: string): Course | null {
    if (!courseIdOrLevel) return null;
    return this.coursesMap.get(courseIdOrLevel) || this.coursesMap.get(courseIdOrLevel.toUpperCase()) || null;
  }

  public getLessons(courseIdOrLevel: string): LessonDoc[] {
    if (!courseIdOrLevel) return [];
    return (
      this.lessonsMap.get(courseIdOrLevel) || 
      this.lessonsMap.get(courseIdOrLevel.toUpperCase()) || 
      []
    );
  }

  public getLessonById(lessonId: string): LessonDoc | null {
    return this.individualLessonsMap.get(lessonId) || null;
  }

  public getAllLessons(): LessonDoc[] {
    const unique = new Map<string, LessonDoc>();
    this.individualLessonsMap.forEach(l => unique.set(l.id, l));
    return Array.from(unique.values());
  }
}

export const curriculumRegistry = new CurriculumRegistryService();
