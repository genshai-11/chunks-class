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

export function calculate15Sessions(
  levelCode: CourseLevel = "LEVEL_B",
  startDateStr: string = "",
  daysOfWeek: string[] = ["Mon", "Wed", "Fri"],
  startTime: string = "19:30",
  endTime: string = "21:00",
  holidays: string[] = []
): ClassSession[] {
  if (!startDateStr) {
    const today = new Date();
    startDateStr = today.toISOString().split('T')[0];
  }
  
  const targetDays = new Set(daysOfWeek.map(d => WEEKDAY_MAP[d]));
  let current = new Date(startDateStr);
  const sessions: ClassSession[] = [];
  let count = 1;
  let safetyLoop = 0;

  const catalog = levelCode === 'LEVEL_A' ? CURRICULUM_CATALOG_LEVEL_A : CURRICULUM_CATALOG_LEVEL_B;

  while (count <= 15 && safetyLoop < 120) {
    safetyLoop++;
    const isoDate = current.toISOString().split('T')[0];
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
  const startDate = today.toISOString().split('T')[0];
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
      voice_profile_en: "en-US-Journey-F",
      voice_profile_vi: "vi-VN-Standard-A",
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
