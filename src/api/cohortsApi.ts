import { Cohort, CourseLevel } from '../types';
import { getFirestoreCohorts, saveFirestoreCohort, deleteFirestoreCohort } from '../services/firestoreService';
import { calculate15Sessions, createDefaultCohort } from '../utils/scheduler';

export const cohortsApi = {
  /**
   * List all cohorts from Firestore with local fallback
   */
  async listCohorts(): Promise<Cohort[]> {
    return await getFirestoreCohorts();
  },

  /**
   * Save or update a cohort
   */
  async saveCohort(cohort: Cohort): Promise<void> {
    await saveFirestoreCohort(cohort);
  },

  /**
   * Delete a cohort
   */
  async deleteCohort(cohortId: string): Promise<void> {
    await deleteFirestoreCohort(cohortId);
  },

  /**
   * Create new 15-session cohort with dynamic start date
   */
  createNewCohort(
    title: string,
    levelCode: CourseLevel,
    startDate: string,
    daysOfWeek: string[] = ['Mon', 'Wed', 'Fri'],
    startTime: string = '19:30',
    endTime: string = '21:00'
  ): Cohort {
    const sessions = calculate15Sessions(levelCode, startDate, daysOfWeek, startTime, endTime);
    return {
      id: `cohort_${Date.now()}`,
      title,
      level_code: levelCode,
      course_id: levelCode === 'LEVEL_A' ? 'course_level_a' : 'course_level_b',
      teacher_id: 'teacher_genshai',
      start_date: startDate,
      total_sessions: 15,
      schedule_pattern: {
        days_of_week: daysOfWeek,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: 90
      },
      audio_settings: {
        voice_profile_en: 'aura-asteria-en',
        voice_profile_vi: 'vi-VN-Neural2-A',
        default_speed: 1.0,
        repeat_count: 1,
        language_mode: 'EN_THEN_VI',
        auto_advance_delay_sec: 0
      },
      sessions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};
