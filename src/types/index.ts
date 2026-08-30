// --------------------------------------------------------------------------
// 1. Dynamic Course Level & Course Entity
// --------------------------------------------------------------------------
export type KnownCourseLevel = 'LEVEL_A' | 'LEVEL_B' | 'LEVEL_B_EREL' | 'LEVEL_B_ERES' | 'LEVEL_C' | 'IELTS_DRILL' | 'BUSINESS_CHUNK_PRO';
export type CourseLevel = KnownCourseLevel | (string & {});

export interface Course {
  id: string;                      // Unique ID (e.g., "course_level_a", "course_level_b", "course_ielts_drill")
  level_code: CourseLevel;         // Open level code (e.g., "LEVEL_A", "IELTS_DRILL")
  title: string;
  description: string;
  total_days: number;              // Total distinct days in curriculum
  total_chunks: number;            // Total chunk items
  default_sessions_count?: number; // Default cohort session count (e.g. 15, 20, 30)
  source?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

// --------------------------------------------------------------------------
// 2. Dynamic Chunk & Lesson Entities
// --------------------------------------------------------------------------
export type ChunkCategory = 
  | 'vocab' 
  | 'phrase' 
  | 'sentence' 
  | 'dialogue' 
  | 'monologue' 
  | 'review' 
  | 'slang' 
  | 'idiom' 
  | 'word_family' 
  | 'grammar' 
  | 'verb'
  | (string & {});

export interface ChunkItem {
  chunk_id: string;
  item_number: number;
  category: ChunkCategory;
  english: string;
  vietnamese: string;
  speaker: string | null;
  audio_url?: string | null;
  audio_url_vi?: string | null;
  beat_prosody?: string | null;
  ipa?: string | null;
  source_file?: string;
  source_page?: number;
  source_sheet?: string;
  source_row?: number;
  notes?: string;
  [key: string]: any;
}

export interface LessonDoc {
  id: string;                      // e.g. "level_a_day_1", "level_b_day_2", "ielts_day_1"
  course_id?: string;              // Foreign key to courses.id
  level_code: CourseLevel;         // e.g. "LEVEL_A", "LEVEL_B", "IELTS"
  day_number: number;              // 0, 1, 2, ... N
  course_title?: string;
  lesson_title: string;
  lesson_type: string;
  total_chunks: number;
  categories: string[];
  chunks: ChunkItem[];
  source_files?: string[];
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// --------------------------------------------------------------------------
// 3. Class Session & Dynamic Cohort
// --------------------------------------------------------------------------
export interface ClassSession {
  session_number: number;          // 1 to N (Dynamic)
  scheduled_date: string;          // YYYY-MM-DD
  day_of_week: string;             // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  start_time: string;              // HH:mm
  end_time: string;                // HH:mm
  day_number: number;              // Maps to LessonDoc.day_number
  lesson_id: string;               // Foreign key to LessonDoc.id
  lesson_title: string;
  lesson_type: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export type LanguageMode = 
  | 'PRIMARY_ONLY' 
  | 'SECONDARY_ONLY' 
  | 'PRIMARY_THEN_SECONDARY' 
  | 'SECONDARY_THEN_PRIMARY'
  | 'EN_ONLY' 
  | 'VI_ONLY' 
  | 'EN_THEN_VI' 
  | 'VI_THEN_EN'
  | (string & {});

export interface CohortAudioSettings {
  voice_profile_primary?: string;  // e.g. 'aura-asteria-en'
  voice_profile_secondary?: string;// e.g. 'vi-VN-Neural2-A'
  voice_profile_en?: string;       // Backward compatibility alias
  voice_profile_vi?: string;       // Backward compatibility alias
  language_mode: LanguageMode;
  auto_advance_delay_sec: number;
  default_speed: number;
  repeat_count: number;
  provider_primary?: string;       // 'DEEPGRAM_AURA' | 'GOOGLE_TTS'
  provider_secondary?: string;
}

export interface Cohort {
  id: string;
  title: string;
  level_code: CourseLevel;
  course_id: string;               // Dynamic ID referencing Course.id
  teacher_id: string;
  start_date: string;              // YYYY-MM-DD
  schedule_pattern: {
    days_of_week: string[];        // ["Mon", "Wed", "Fri"]
    start_time: string;
    end_time: string;
    duration_minutes?: number;
  };
  total_sessions: number;          // Dynamic N sessions
  sessions: ClassSession[];
  audio_settings?: CohortAudioSettings;
  created_at?: string;
  updated_at?: string;
}

export interface LessonPart {
  part_index: number;
  category: string;
  title: string;
  start_index: number;
  end_index: number;
  chunk_count: number;
}

export type NavTab = 'schedule' | 'projector' | 'curriculum' | 'audio-hub' | 'settings';
