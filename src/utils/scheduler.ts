import { ClassSession, Cohort, CourseLevel } from '../types';
import { CURRICULUM_CATALOG_LEVEL_B } from '../data/curriculumData';
import { CURRICULUM_CATALOG_LEVEL_A } from '../data/levelAData';

const WEEKDAY_MAP: Record<string, number> = {
  "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 0
};

const INT_TO_DAY: Record<number, string> = {
  1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 0: "Sun"
};

export const VIETNAMESE_WEEKDAY_MAP: Record<string, string> = {
  "Mon": "Mon",
  "Tue": "Tue",
  "Wed": "Wed",
  "Thu": "Thu",
  "Fri": "Fri",
  "Sat": "Sat",
  "Sun": "Sun"
};

/**
 * Robust, timezone-safe calculation of 15 class sessions.
 * Maps Days 1-15 1-to-1 to Sessions 1-15.
 */
export function calculate15Sessions(
  levelCode: CourseLevel = "LEVEL_B",
  startDateStr: string = "",
  daysOfWeek: string[] = ["Mon", "Wed", "Fri"],
  startTime: string = "19:30",
  endTime: string = "21:00",
  holidays: string[] = []
): ClassSession[] {
  if (!daysOfWeek || daysOfWeek.length === 0) {
    daysOfWeek = ["Mon", "Wed", "Fri"];
  }

  let year: number, month: number, day: number;
  if (!startDateStr) {
    const today = new Date();
    year = today.getFullYear();
    month = today.getMonth() + 1;
    day = today.getDate();
  } else {
    const parts = startDateStr.split('-').map(Number);
    year = parts[0];
    month = parts[1];
    day = parts[2];
  }

  // Create date at local noon (12:00:00) to be completely immune to DST / UTC midnight shifts
  let current = new Date(year, month - 1, day, 12, 0, 0);
  const targetDays = new Set(daysOfWeek.map(d => WEEKDAY_MAP[d]));
  const sessions: ClassSession[] = [];
  let count = 1;
  let safetyLoop = 0;
  const maxSafetyLoop = 365;

  // Retrieve standard 15 classroom lessons (Excluding Level A Day 0 Word List)
  const catalog = levelCode === 'LEVEL_A'
    ? CURRICULUM_CATALOG_LEVEL_A.filter(l => l.day_number > 0)
    : CURRICULUM_CATALOG_LEVEL_B;

  while (count <= 15 && safetyLoop < maxSafetyLoop) {
    safetyLoop++;
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const isoDate = `${y}-${m}-${d}`;
    const dayOfWeek = current.getDay();

    if (targetDays.has(dayOfWeek) && !holidays.includes(isoDate)) {
      const meta = catalog[count - 1] || {
        day_number: count,
        id: `${levelCode.toLowerCase()}_day_${count}`,
        lesson_title: `Day ${count} - Standard Chunk Drill Session`,
        lesson_type: "Standard Lesson"
      };

      sessions.push({
        session_number: count,
        scheduled_date: isoDate,
        day_of_week: INT_TO_DAY[dayOfWeek],
        start_time: startTime,
        end_time: endTime,
        day_number: meta.day_number,
        lesson_id: meta.id,
        lesson_title: meta.lesson_title,
        lesson_type: meta.lesson_type,
        status: count === 1 ? 'in_progress' : 'scheduled'
      });
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return sessions;
}

export function createDefaultCohort(
  title: string = "Level B - Spoken Masterclass K24",
  levelCode: CourseLevel = "LEVEL_B"
): Cohort {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const startDate = `${y}-${m}-${d}`;
  const sessions = calculate15Sessions(levelCode, startDate, ["Mon", "Wed", "Fri"], "19:30", "21:00");

  return {
    id: "cohort_" + Date.now(),
    title,
    level_code: levelCode,
    course_id: levelCode === 'LEVEL_A' ? 'course_level_a' : 'course_level_b',
    teacher_id: "teacher_genshai",
    start_date: startDate,
    schedule_pattern: {
      days_of_week: ["Mon", "Wed", "Fri"],
      start_time: "19:30",
      end_time: "21:00",
      duration_minutes: 90
    },
    total_sessions: 15,
    sessions,
    audio_settings: {
      voice_profile_en: "aura-asteria-en",
      voice_profile_vi: "vi-VN-Neural2-A",
      language_mode: "EN_THEN_VI",
      auto_advance_delay_sec: 0,
      default_speed: 1.0,
      repeat_count: 1
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export function exportScheduleAsICS(cohort: Cohort): string {
  let icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CHUNKS Teacher Studio//Classroom Schedule//EN",
    `X-WR-CALNAME:${cohort.title}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH"
  ];

  cohort.sessions.forEach((s) => {
    const cleanDate = s.scheduled_date.replace(/-/g, "");
    const cleanStart = s.start_time.replace(/:/g, "") + "00";
    const cleanEnd = s.end_time.replace(/:/g, "") + "00";

    icsContent.push(
      "BEGIN:VEVENT",
      `SUMMARY:[CHUNKS Session ${s.session_number}/15] ${s.lesson_title}`,
      `DESCRIPTION:Cohort: ${cohort.title}\\nLesson: ${s.lesson_title}\\nType: ${s.lesson_type}`,
      `DTSTART:${cleanDate}T${cleanStart}`,
      `DTEND:${cleanDate}T${cleanEnd}`,
      `UID:chunks-${cohort.id}-s${s.session_number}@chunksteacher.app`,
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  });

  icsContent.push("END:VCALENDAR");
  return icsContent.join("\r\n");
}
