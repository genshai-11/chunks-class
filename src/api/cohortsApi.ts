import { Cohort, CourseLevel, CohortAudioSettings } from '../types';
import { getFirestoreCohorts, saveFirestoreCohort, deleteFirestoreCohort } from '../services/firestoreService';
import { calculateSessions } from '../utils/scheduler';

export const cohortsApi = {
  /**
   * List all cohorts or filter by course/level identifier
   */
  async listCohorts(filterIdentifier?: string): Promise<Cohort[]> {
    return await getFirestoreCohorts(filterIdentifier);
  },

  /**
   * Save / Update a cohort document
   */
  async saveCohort(cohort: Cohort): Promise<void> {
    await saveFirestoreCohort(cohort);
  },

  /**
   * Delete a cohort by ID
   */
  async deleteCohort(cohortId: string): Promise<void> {
    await deleteFirestoreCohort(cohortId);
  },

  /**
   * Create a new cohort with fully dynamic course_id, level_code, session count, and timing
   */
  async createNewCohort(params: {
    title: string;
    courseId: string;
    levelCode: CourseLevel;
    startDate: string;
    daysOfWeek?: string[];
    startTime?: string;
    endTime?: string;
    totalSessions?: number;
    audioSettings?: Partial<CohortAudioSettings>;
  }): Promise<Cohort> {
    const {
      title,
      courseId,
      levelCode,
      startDate,
      daysOfWeek = ['Mon', 'Wed', 'Fri'],
      startTime = '19:30',
      endTime = '21:00',
      totalSessions,
      audioSettings
    } = params;

    const sessions = await calculateSessions({
      courseIdOrLevel: courseId || levelCode,
      startDateStr: startDate,
      daysOfWeek,
      startTime,
      endTime,
      totalSessions
    });

    const defaultAudio: CohortAudioSettings = {
      voice_profile_primary: 'aura-asteria-en',
      voice_profile_secondary: 'vi-VN-Neural2-A',
      voice_profile_en: 'aura-asteria-en',
      voice_profile_vi: 'vi-VN-Neural2-A',
      default_speed: 1.0,
      repeat_count: 1,
      language_mode: 'EN_THEN_VI',
      auto_advance_delay_sec: 0,
      ...audioSettings
    };

    return {
      id: `cohort_${Date.now()}`,
      title,
      level_code: levelCode,
      course_id: courseId,
      teacher_id: 'teacher_genshai',
      start_date: startDate,
      total_sessions: sessions.length,
      schedule_pattern: {
        days_of_week: daysOfWeek,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: 90
      },
      audio_settings: defaultAudio,
      sessions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};
