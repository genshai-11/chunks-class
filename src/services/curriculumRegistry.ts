import { Course, LessonDoc, CourseLevel } from '../types';
import { CURRICULUM_CATALOG_LEVEL_A } from '../data/levelAData';
import { CURRICULUM_CATALOG_LEVEL_B_EREL } from '../data/levelBErelData';
import { CURRICULUM_CATALOG_LEVEL_B_ERES } from '../data/levelBEresData';

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

    // Seed Level B - EREL
    const courseErel: Course = {
      id: "course_level_b_erel",
      level_code: "LEVEL_B_EREL",
      title: "Level B - EREL (English Reflexes Enhancement for Listening)",
      description: "15 Days of Emotional & Movie Shadowing with 1,019 deep listening dialogues and reflex chunks.",
      total_days: 15,
      total_chunks: CURRICULUM_CATALOG_LEVEL_B_EREL.reduce((sum, l) => sum + (l.total_chunks || l.chunks.length), 0),
      default_sessions_count: 15,
      source: "Genshai EREL Listening Curriculum",
      is_active: true
    };
    this.registerCourse(courseErel, CURRICULUM_CATALOG_LEVEL_B_EREL);

    // Seed Level B - ERES
    const courseEres: Course = {
      id: "course_level_b_eres",
      level_code: "LEVEL_B_ERES",
      title: "Level B - ERES (English Reflexes Enhancement for Speaking)",
      description: "15 Days of Spoken Reflexes & Business English with 3,371 conversational and workplace chunks.",
      total_days: 15,
      total_chunks: CURRICULUM_CATALOG_LEVEL_B_ERES.reduce((sum, l) => sum + (l.total_chunks || l.chunks.length), 0),
      default_sessions_count: 15,
      source: "Genshai ERES Speaking Curriculum",
      is_active: true
    };
    this.registerCourse(courseEres, CURRICULUM_CATALOG_LEVEL_B_ERES);

    // Legacy fallback mapping for LEVEL_B -> LEVEL_B_ERES
    this.coursesMap.set("LEVEL_B", courseEres);
    this.lessonsMap.set("LEVEL_B", CURRICULUM_CATALOG_LEVEL_B_ERES);
    this.coursesMap.set("course_level_b", courseEres);
    this.lessonsMap.set("course_level_b", CURRICULUM_CATALOG_LEVEL_B_ERES);
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
    const direct = this.coursesMap.get(courseIdOrLevel) || this.coursesMap.get(courseIdOrLevel.toUpperCase());
    if (direct) return direct;

    if (courseIdOrLevel === 'LEVEL_B' || courseIdOrLevel === 'course_level_b') {
      return this.coursesMap.get('course_level_b_eres') || this.coursesMap.get('LEVEL_B_ERES') || null;
    }
    return null;
  }

  public getLessons(courseIdOrLevel: string): LessonDoc[] {
    if (!courseIdOrLevel) return [];
    const direct = (
      this.lessonsMap.get(courseIdOrLevel) || 
      this.lessonsMap.get(courseIdOrLevel.toUpperCase())
    );
    if (direct && direct.length > 0) return direct;

    if (courseIdOrLevel === 'LEVEL_B' || courseIdOrLevel === 'course_level_b') {
      return this.lessonsMap.get('course_level_b_eres') || this.lessonsMap.get('LEVEL_B_ERES') || [];
    }
    if (courseIdOrLevel === 'LEVEL_A' || courseIdOrLevel === 'course_level_a') {
      return this.lessonsMap.get('course_level_a') || this.lessonsMap.get('LEVEL_A') || [];
    }
    if (courseIdOrLevel === 'LEVEL_B_EREL' || courseIdOrLevel === 'course_level_b_erel') {
      return this.lessonsMap.get('course_level_b_erel') || this.lessonsMap.get('LEVEL_B_EREL') || [];
    }
    if (courseIdOrLevel === 'LEVEL_B_ERES' || courseIdOrLevel === 'course_level_b_eres') {
      return this.lessonsMap.get('course_level_b_eres') || this.lessonsMap.get('LEVEL_B_ERES') || [];
    }

    return [];
  }

  public getLessonById(lessonId: string): LessonDoc | null {
    if (!lessonId) return null;
    const direct = this.individualLessonsMap.get(lessonId);
    if (direct) return direct;

    // Legacy alias: level_b_day_X -> level_b_eres_day_X
    if (lessonId.startsWith('level_b_day_')) {
      const eresId = lessonId.replace('level_b_day_', 'level_b_eres_day_');
      return this.individualLessonsMap.get(eresId) || null;
    }
    return null;
  }

  public getAllLessons(): LessonDoc[] {
    const unique = new Map<string, LessonDoc>();
    this.individualLessonsMap.forEach(l => unique.set(l.id, l));
    return Array.from(unique.values());
  }
}

export const curriculumRegistry = new CurriculumRegistryService();
