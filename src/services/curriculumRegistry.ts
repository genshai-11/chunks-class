import { Course, LessonDoc, CourseLevel, LessonGrammar } from '../types';
import { CURRICULUM_CATALOG_LEVEL_A } from '../data/levelAData';
import { CURRICULUM_CATALOG_LEVEL_B_EREL } from '../data/levelBErelData';
import { CURRICULUM_CATALOG_LEVEL_B_ERES } from '../data/levelBEresData';
import { CURRICULUM_CATALOG_LEVEL_B_ERE } from '../data/levelBEreData';
import { LEVEL_B_ERE_GRAMMAR_CATALOG, getGrammarForLesson } from '../data/levelBGrammarData';

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
    // 1. Seed Level B - Canonical 30 Topics ERE Curriculum
    // Attach grammar data to each lesson doc in Level B ERE
    CURRICULUM_CATALOG_LEVEL_B_ERE.forEach(l => {
      const g = getGrammarForLesson(l.id);
      if (g) {
        l.grammar = {
          verb_forms: g.verb_forms,
          sentence_structures: g.sentence_structures,
          tense: g.tense,
          notes: g.notes
        };
      }
    });

    const courseLevelB: Course = {
      id: "course_level_b",
      level_code: "LEVEL_B",
      title: "Level B - ERE (English Reflexes Enhancement - 30 Topics)",
      description: "30 Days of Spoken Reflexes & Workplace English with 3,150 conversational, vocabulary, and workplace chunks.",
      total_days: 30,
      total_chunks: CURRICULUM_CATALOG_LEVEL_B_ERE.reduce((sum, l) => sum + (l.total_chunks || l.chunks.length), 0),
      default_sessions_count: 30,
      source: "Genshai ERE 30-Topic Curriculum",
      is_active: true
    };
    this.registerCourse(courseLevelB, CURRICULUM_CATALOG_LEVEL_B_ERE);

    // Register aliases for Level B ERE
    this.coursesMap.set("course_level_b_ere", courseLevelB);
    this.coursesMap.set("LEVEL_B_ERE", courseLevelB);
    this.lessonsMap.set("course_level_b_ere", CURRICULUM_CATALOG_LEVEL_B_ERE);
    this.lessonsMap.set("LEVEL_B_ERE", CURRICULUM_CATALOG_LEVEL_B_ERE);
    CURRICULUM_CATALOG_LEVEL_B_ERE.forEach(l => {
      this.individualLessonsMap.set(l.id, l);
      if (l.id.startsWith('level_b_day_')) {
        this.individualLessonsMap.set(l.id.replace('level_b_day_', 'level_b_ere_day_'), l);
      } else if (l.id.startsWith('level_b_ere_day_')) {
        this.individualLessonsMap.set(l.id.replace('level_b_ere_day_', 'level_b_day_'), l);
      }
    });

    // 2. Seed Level A - Foundation (16 Lessons)
    const courseA: Course = {
      id: "course_level_a",
      level_code: "LEVEL_A",
      title: "Level A - Foundation English Chunks",
      description: "16 Lessons (Word List + Days 1..15) with 4,480 essential conversational and survival chunks.",
      total_days: 16,
      total_chunks: 4480,
      default_sessions_count: 16,
      source: "Genshai Foundation Curriculum (ERES Design)",
      is_active: true
    };
    this.registerCourse(courseA, CURRICULUM_CATALOG_LEVEL_A);

    // 3. Seed Level B - EREL (Secondary / Listening)
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

    // 4. Seed Level B - ERES (Secondary / Speaking)
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

    if (courseIdOrLevel === 'LEVEL_B' || courseIdOrLevel === 'course_level_b' || courseIdOrLevel === 'LEVEL_B_ERE' || courseIdOrLevel === 'course_level_b_ere') {
      return this.coursesMap.get('course_level_b') || this.coursesMap.get('LEVEL_B') || null;
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

    if (courseIdOrLevel === 'LEVEL_B' || courseIdOrLevel === 'course_level_b' || courseIdOrLevel === 'LEVEL_B_ERE' || courseIdOrLevel === 'course_level_b_ere') {
      return this.lessonsMap.get('course_level_b') || this.lessonsMap.get('LEVEL_B') || CURRICULUM_CATALOG_LEVEL_B_ERE;
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
    const cleanId = lessonId.trim();
    const direct = this.individualLessonsMap.get(cleanId);
    if (direct) return direct;

    // Direct alias between level_b_day_X and level_b_ere_day_X (30 Topics)
    if (cleanId.startsWith('level_b_day_')) {
      const ereId = cleanId.replace('level_b_day_', 'level_b_ere_day_');
      const ereDoc = this.individualLessonsMap.get(ereId);
      if (ereDoc) return ereDoc;
    }
    if (cleanId.startsWith('level_b_ere_day_')) {
      const bId = cleanId.replace('level_b_ere_day_', 'level_b_day_');
      const bDoc = this.individualLessonsMap.get(bId);
      if (bDoc) return bDoc;
    }

    // Alias for Level A Day 0 / Word list
    if (cleanId === 'level_a_day_0' || cleanId === 'level_a_0' || cleanId === 'level_a_wordlist') {
      const wordListDoc = this.individualLessonsMap.get('level_a_word_list');
      if (wordListDoc) return wordListDoc;
    }

    // Case-insensitive lookup fallback
    const lower = cleanId.toLowerCase();
    for (const [key, doc] of this.individualLessonsMap.entries()) {
      if (key.toLowerCase() === lower) return doc;
    }

    return null;
  }

  /**
   * Fast lookup for grammar structures and verb forms by lesson ID
   */
  public getGrammarByLessonId(lessonId: string): LessonGrammar | null {
    if (!lessonId) return null;
    const lesson = this.getLessonById(lessonId);
    if (lesson?.grammar) {
      return lesson.grammar;
    }
    const gDoc = getGrammarForLesson(lessonId);
    if (gDoc) {
      return {
        verb_forms: gDoc.verb_forms,
        sentence_structures: gDoc.sentence_structures,
        tense: gDoc.tense,
        notes: gDoc.notes
      };
    }
    return null;
  }

  public updateLesson(lesson: LessonDoc): void {
    if (!lesson || !lesson.id) return;
    this.individualLessonsMap.set(lesson.id, lesson);

    // Also handle aliases for individual lookup
    if (lesson.id.startsWith('level_b_day_')) {
      const aliasId = lesson.id.replace('level_b_day_', 'level_b_ere_day_');
      this.individualLessonsMap.set(aliasId, lesson);
    } else if (lesson.id.startsWith('level_b_ere_day_')) {
      const aliasId = lesson.id.replace('level_b_ere_day_', 'level_b_day_');
      this.individualLessonsMap.set(aliasId, lesson);
    }
    if (lesson.id === 'level_a_word_list') {
      this.individualLessonsMap.set('level_a_day_0', lesson);
      this.individualLessonsMap.set('level_a_0', lesson);
    }

    let foundInAnyList = false;
    this.lessonsMap.forEach((list) => {
      const idx = list.findIndex(l => 
        l.id === lesson.id ||
        (lesson.id.startsWith('level_b_day_') && l.id === lesson.id.replace('level_b_day_', 'level_b_ere_day_')) ||
        (lesson.id.startsWith('level_b_ere_day_') && l.id === lesson.id.replace('level_b_ere_day_', 'level_b_day_')) ||
        (lesson.id === 'level_a_word_list' && (l.id === 'level_a_day_0' || l.id === 'level_a_0'))
      );
      if (idx >= 0) {
        list[idx] = lesson;
        foundInAnyList = true;
      }
    });

    if (!foundInAnyList) {
      const targetKeys = [lesson.course_id, lesson.level_code, lesson.level_code?.toUpperCase()].filter(Boolean);
      targetKeys.forEach(k => {
        const list = this.lessonsMap.get(k as string);
        if (list) {
          list.push(lesson);
          list.sort((a, b) => a.day_number - b.day_number);
        }
      });
    }
  }

  public getAllLessons(): LessonDoc[] {
    const unique = new Map<string, LessonDoc>();
    this.individualLessonsMap.forEach(l => unique.set(l.id, l));
    return Array.from(unique.values());
  }

  public getGroupedCoursesWithLessons(): { course: Course; lessons: LessonDoc[] }[] {
    const courses = [
      this.getCourse('course_level_b'),
      this.getCourse('course_level_a'),
      this.getCourse('course_level_b_erel'),
      this.getCourse('course_level_b_eres')
    ].filter((c): c is Course => Boolean(c));

    // Also include any custom registered courses
    const standardIds = new Set([
      'course_level_b',
      'course_level_b_ere',
      'course_level_b_eres',
      'course_level_b_erel',
      'course_level_a',
      'LEVEL_B',
      'LEVEL_B_ERE',
      'LEVEL_B_ERES',
      'LEVEL_B_EREL',
      'LEVEL_A'
    ]);
    const allCourses = this.getAllCourses();
    const customCourses = allCourses.filter(c => !standardIds.has(c.id));

    return [...courses, ...customCourses].map(course => ({
      course,
      lessons: this.getLessons(course.id)
    }));
  }
}

export const curriculumRegistry = new CurriculumRegistryService();
