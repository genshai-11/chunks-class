export type CourseLevel = 'LEVEL_A' | 'LEVEL_B';

export interface Course {
  id: string;
  level_code: CourseLevel;
  title: string;
  description: string;
  total_days: number;
  total_chunks: number;
  source: string;
  is_active: boolean;
}

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
  | string;

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
  id: string;
  level_code: CourseLevel | string;
  day_number: number;
  course_title?: string;
  lesson_title: string;
  lesson_type: string;
  total_chunks: number;
  categories: string[];
  chunks: ChunkItem[];
  source_files?: string[];
  created_at: string;
  [key: string]: any;
}

export interface ClassSession {
  session_number: number; // 1 to 15
  scheduled_date: string; // YYYY-MM-DD
  day_of_week: string; // Mon, Tue, Wed, etc.
  start_time: string; // 19:30
  end_time: string; // 21:00
  day_number: number;
  lesson_id: string;
  lesson_title: string;
  lesson_type: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export type LanguageMode = 'EN_ONLY' | 'VI_ONLY' | 'EN_THEN_VI' | 'VI_THEN_EN';

export interface CohortAudioSettings {
  voice_profile_en: string;
  voice_profile_vi: string;
  language_mode: LanguageMode;
  auto_advance_delay_sec: number;
  default_speed: number;
  repeat_count: number;
}

export interface Cohort {
  id: string;
  title: string;
  level_code: CourseLevel;
  course_id: string;
  teacher_id: string;
  start_date: string;
  schedule_pattern: {
    days_of_week: string[]; // ["Mon", "Wed", "Fri"]
    start_time: string;
    end_time: string;
    duration_minutes?: number;
  };
  total_sessions: number; // 15
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
