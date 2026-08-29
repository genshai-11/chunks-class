import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { Course, Cohort, LessonDoc, ChunkItem, CourseLevel } from '../types';
import { CURRICULUM_CATALOG_LEVEL_B } from '../data/curriculumData';
import { CURRICULUM_CATALOG_LEVEL_A } from '../data/levelAData';
import { calculate15Sessions } from '../utils/scheduler';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBrH0sAU__R4k1IBrSYIF73fFdASeSpdE4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chunks-voicecloning-genshai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chunks-voicecloning-genshai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chunks-mirror-audio-284566312743",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "284566312743",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:284566312743:web:5684ad42-756a-4f59-89ea-08fa00d7a832"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Master Course Catalog Default Seed
export const DEFAULT_COURSES: Course[] = [
  {
    id: "course_level_a",
    level_code: "LEVEL_A",
    title: "Level A - Foundation English Chunks",
    description: "Essential spoken chunks, everyday survival navigation, social dialogues & conversational fluency.",
    total_days: 15,
    total_chunks: 150,
    source: "Genshai Foundation Curriculum",
    is_active: true
  },
  {
    id: "course_level_b",
    level_code: "LEVEL_B",
    title: "Level B - Spoken Chunks Masterclass",
    description: "7,851 editorial chunks, prosody stress notation, business smarketing, and advanced speech mastery.",
    total_days: 15,
    total_chunks: 7851,
    source: "Genshai Masterclass Level B",
    is_active: true
  }
];

// Initial default cohort seed
export const DEFAULT_COHORTS: Cohort[] = [
  {
    id: "cohort_level_a_k24",
    title: "Level A - Evening Cohort K24 (Mon-Wed-Fri)",
    level_code: "LEVEL_A",
    course_id: "course_level_a",
    teacher_id: "teacher_genshai",
    start_date: "2026-08-01",
    schedule_pattern: {
      days_of_week: ["Mon", "Wed", "Fri"],
      start_time: "19:30",
      end_time: "21:00",
      duration_minutes: 90
    },
    total_sessions: 15,
    sessions: calculate15Sessions("LEVEL_A", "2026-08-01", ["Mon", "Wed", "Fri"], "19:30", "21:00"),
    audio_settings: {
      voice_profile_en: 'en-US-Journey-F',
      voice_profile_vi: 'vi-VN-Neural2-A',
      language_mode: 'EN_THEN_VI',
      auto_advance_delay_sec: 0,
      default_speed: 1.0,
      repeat_count: 1
    },
    created_at: "2026-08-01T00:00:00Z",
    updated_at: new Date().toISOString()
  },
  {
    id: "cohort_level_b_k24",
    title: "Level B - Spoken Masterclass K24 (Tue-Thu-Sat)",
    level_code: "LEVEL_B",
    course_id: "course_level_b",
    teacher_id: "teacher_genshai",
    start_date: "2026-08-02",
    schedule_pattern: {
      days_of_week: ["Tue", "Thu", "Sat"],
      start_time: "19:30",
      end_time: "21:00",
      duration_minutes: 90
    },
    total_sessions: 15,
    sessions: calculate15Sessions("LEVEL_B", "2026-08-02", ["Tue", "Thu", "Sat"], "19:30", "21:00"),
    audio_settings: {
      voice_profile_en: 'en-US-Journey-F',
      voice_profile_vi: 'vi-VN-Neural2-A',
      language_mode: 'EN_THEN_VI',
      auto_advance_delay_sec: 0,
      default_speed: 1.0,
      repeat_count: 1
    },
    created_at: "2026-08-02T00:00:00Z",
    updated_at: new Date().toISOString()
  }
];

export interface DatabaseStatus {
  isConnected: boolean;
  isSynced: boolean;
  totalLessonsInDb: number;
  totalCohortsInDb: number;
  lastChecked: string;
  projectId?: string;
  error?: string | null;
}

// 1. Fetch All Courses from Firestore
export async function getCourses(): Promise<Course[]> {
  try {
    const snapshot = await getDocs(collection(db, 'courses'));
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    }
  } catch (err) {
    console.warn('[Firestore] getCourses fallback:', err);
  }
  return DEFAULT_COURSES;
}

// 2. Fetch Cohorts by Course Level
export async function getCohorts(levelCode?: string): Promise<Cohort[]> {
  try {
    const cohortsRef = collection(db, 'cohorts');
    const q = levelCode ? query(cohortsRef, where('level_code', '==', levelCode)) : cohortsRef;
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cohort));
    }
  } catch (err) {
    console.warn('[Firestore] getCohorts fallback:', err);
  }

  // LocalStorage cache fallback
  try {
    const saved = localStorage.getItem('chunks_firestore_synced_cohorts');
    if (saved) {
      const parsed: Cohort[] = JSON.parse(saved);
      return levelCode ? parsed.filter(c => c.level_code === levelCode) : parsed;
    }
  } catch {}

  return levelCode ? DEFAULT_COHORTS.filter(c => c.level_code === levelCode) : DEFAULT_COHORTS;
}

// 3. Fetch Lesson By ID (CRITICAL: Directly extracts single document .chunks array)
export async function getLessonById(lessonId: string): Promise<LessonDoc> {
  console.log(`[Firestore] Fetching lesson: ${lessonId}`);
  try {
    const docRef = doc(db, 'lessons', lessonId);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      const chunksArray: ChunkItem[] = Array.isArray(data.chunks) ? data.chunks : [];
      console.log(`[Firestore] Successfully loaded ${lessonId}: ${chunksArray.length} chunks.`);

      return {
        id: snapshot.id,
        level_code: data.level_code || (lessonId.startsWith('level_b') ? 'LEVEL_B' : 'LEVEL_A'),
        day_number: data.day_number || 1,
        lesson_title: data.lesson_title || snapshot.id,
        lesson_type: data.lesson_type || 'Standard Lesson',
        total_chunks: chunksArray.length,
        categories: Array.isArray(data.categories) ? data.categories : [],
        chunks: chunksArray,
        created_at: data.created_at || new Date().toISOString()
      };
    }
  } catch (err) {
    console.warn(`[Firestore] getLessonById notice for ${lessonId}:`, err);
  }

  // Fallback to local catalog if doc doesn't exist yet in Firestore
  if (lessonId.startsWith('level_a')) {
    const foundA = CURRICULUM_CATALOG_LEVEL_A.find(l => l.id === lessonId);
    if (foundA) return foundA;
  }
  const foundB = CURRICULUM_CATALOG_LEVEL_B.find(l => l.id === lessonId);
  return foundB || CURRICULUM_CATALOG_LEVEL_B[0];
}

// 4. Fetch All Lessons for a Course Level
export async function getLessonsByLevel(levelCode: 'LEVEL_A' | 'LEVEL_B'): Promise<LessonDoc[]> {
  try {
    const lessonsRef = collection(db, 'lessons');
    const q = query(lessonsRef, where('level_code', '==', levelCode));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => {
        const data = doc.data();
        const chunks = Array.isArray(data.chunks) ? data.chunks : [];
        return {
          id: doc.id,
          level_code: data.level_code || levelCode,
          day_number: data.day_number || 0,
          lesson_title: data.lesson_title || doc.id,
          lesson_type: data.lesson_type || 'Standard Lesson',
          total_chunks: chunks.length,
          categories: data.categories || [],
          chunks: chunks,
          created_at: data.created_at || new Date().toISOString()
        };
      }).sort((a, b) => a.day_number - b.day_number);
    }
  } catch (err) {
    console.warn(`[Firestore] getLessonsByLevel warning for ${levelCode}:`, err);
  }

  return levelCode === 'LEVEL_A' ? CURRICULUM_CATALOG_LEVEL_A : CURRICULUM_CATALOG_LEVEL_B;
}

/**
 * Fetch all lessons (Level A or Level B)
 */
export async function getAllLessons(levelCode?: CourseLevel | string): Promise<LessonDoc[]> {
  const code: 'LEVEL_A' | 'LEVEL_B' = levelCode === 'LEVEL_A' ? 'LEVEL_A' : 'LEVEL_B';
  return getLessonsByLevel(code);
}

/**
 * Save / Update a lesson document in Firestore & Local storage
 */
export async function saveLesson(lesson: LessonDoc): Promise<void> {
  try {
    const docRef = doc(db, 'lessons', lesson.id);
    await setDoc(docRef, lesson, { merge: true });
    console.log(`[Firestore] Saved lesson ${lesson.id} with ${lesson.chunks.length} chunks.`);
  } catch (e) {
    console.warn(`[Firestore] saveLesson warning for ${lesson.id}:`, e);
  }

  try {
    const localKey = lesson.level_code === 'LEVEL_A' ? 'chunks_lessons_level_a' : 'chunks_lessons_level_b';
    const existing = await getAllLessons(lesson.level_code as CourseLevel);
    const index = existing.findIndex(l => l.id === lesson.id);
    if (index >= 0) {
      existing[index] = lesson;
    } else {
      existing.push(lesson);
    }
    localStorage.setItem(localKey, JSON.stringify(existing));
  } catch {}
}

/**
 * Add or Update an individual chunk inside the lesson's .chunks array
 */
export async function addOrUpdateChunk(lessonId: string, chunk: ChunkItem): Promise<LessonDoc | null> {
  const lesson = await getLessonById(lessonId);
  if (!lesson) return null;

  const chunks = [...lesson.chunks];
  const chunkIndex = chunks.findIndex(c => c.chunk_id === chunk.chunk_id);
  
  if (chunkIndex >= 0) {
    chunks[chunkIndex] = chunk;
  } else {
    chunks.push(chunk);
  }

  // Update categories and count
  const distinctCategories = Array.from(new Set(chunks.map(c => c.category)));
  const updatedLesson: LessonDoc = {
    ...lesson,
    chunks,
    total_chunks: chunks.length,
    categories: distinctCategories
  };

  await saveLesson(updatedLesson);
  return updatedLesson;
}

/**
 * Delete a chunk from a lesson's .chunks array
 */
export async function deleteChunk(lessonId: string, chunkId: string): Promise<LessonDoc | null> {
  const lesson = await getLessonById(lessonId);
  if (!lesson) return null;

  const updatedChunks = lesson.chunks.filter(c => c.chunk_id !== chunkId);
  const distinctCategories = Array.from(new Set(updatedChunks.map(c => c.category)));

  const updatedLesson: LessonDoc = {
    ...lesson,
    chunks: updatedChunks,
    total_chunks: updatedChunks.length,
    categories: distinctCategories
  };

  await saveLesson(updatedLesson);
  return updatedLesson;
}

/**
 * Save cohort to Firestore
 */
export async function saveCohort(cohort: Cohort): Promise<void> {
  try {
    const docRef = doc(db, 'cohorts', cohort.id);
    await setDoc(docRef, cohort, { merge: true });
  } catch (e) {
    console.warn("[Firestore] saveCohort notice:", e);
  }

  try {
    const saved = localStorage.getItem('chunks_firestore_synced_cohorts');
    let cohorts: Cohort[] = saved ? JSON.parse(saved) : [...DEFAULT_COHORTS];
    const index = cohorts.findIndex(c => c.id === cohort.id);
    if (index >= 0) {
      cohorts[index] = cohort;
    } else {
      cohorts.unshift(cohort);
    }
    localStorage.setItem('chunks_firestore_synced_cohorts', JSON.stringify(cohorts));
  } catch {}
}

/**
 * Delete cohort from Firestore
 */
export async function deleteFirestoreCohort(cohortId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'cohorts', cohortId));
  } catch (e) {
    console.warn("[Firestore] deleteCohort notice:", e);
  }
  try {
    const saved = localStorage.getItem('chunks_firestore_synced_cohorts');
    if (saved) {
      const cohorts: Cohort[] = JSON.parse(saved);
      const filtered = cohorts.filter(c => c.id !== cohortId);
      localStorage.setItem('chunks_firestore_synced_cohorts', JSON.stringify(filtered));
    }
  } catch {}
}

/**
 * Check health & live status of Firestore database connection
 */
export async function checkFirestoreHealth(): Promise<DatabaseStatus> {
  const status: DatabaseStatus = {
    isConnected: false,
    isSynced: false,
    totalLessonsInDb: 0,
    totalCohortsInDb: 0,
    lastChecked: new Date().toISOString(),
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chunks-voicecloning-genshai",
    error: null
  };

  try {
    const testDocRef = doc(db, 'courses', 'course_level_b');
    await getDoc(testDocRef);
    status.isConnected = true;

    const lessonsSnap = await getDocs(collection(db, 'lessons'));
    status.totalLessonsInDb = lessonsSnap.size;

    const cohortsSnap = await getDocs(collection(db, 'cohorts'));
    status.totalCohortsInDb = cohortsSnap.size;

    status.isSynced = status.totalLessonsInDb >= 15;
    return status;
  } catch (err: any) {
    status.isConnected = false;
    status.error = err?.message || String(err);
    return status;
  }
}

/**
 * Push entire curriculum catalog (Level A & Level B) with full .chunks arrays directly to Firestore
 */
export async function syncAllCurriculumToFirestore(
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ success: boolean; totalLessons: number; totalChunks: number; error?: string }> {
  try {
    const allLessons = [...CURRICULUM_CATALOG_LEVEL_A, ...CURRICULUM_CATALOG_LEVEL_B];
    const total = allLessons.length + DEFAULT_COURSES.length;
    let current = 0;

    // 1. Sync Courses
    for (const course of DEFAULT_COURSES) {
      current++;
      onProgress?.(current, total, `Syncing course ${course.title}...`);
      await setDoc(doc(db, 'courses', course.id), course, { merge: true });
    }

    // 2. Sync Lessons with Chunks Array
    let totalChunkCount = 0;
    for (const lesson of allLessons) {
      current++;
      totalChunkCount += lesson.chunks.length;
      onProgress?.(current, total, `Writing ${lesson.id} (${lesson.chunks.length} chunks array) to Firestore...`);
      await setDoc(doc(db, 'lessons', lesson.id), lesson, { merge: true });
    }

    // 3. Sync Initial Cohorts
    for (const cohort of DEFAULT_COHORTS) {
      await setDoc(doc(db, 'cohorts', cohort.id), cohort, { merge: true });
    }

    onProgress?.(total, total, `Synced ${total} documents and ${totalChunkCount} chunks successfully!`);
    return {
      success: true,
      totalLessons: allLessons.length,
      totalChunks: totalChunkCount
    };
  } catch (err: any) {
    return {
      success: false,
      totalLessons: 0,
      totalChunks: 0,
      error: err?.message || String(err)
    };
  }
}

// Aliases for compatibility
export const saveLessonToFirestore = saveLesson;
export const getFirestoreCohorts = getCohorts;
export const saveFirestoreCohort = saveCohort;
export const getFirestoreLessonById = getLessonById;
export const getFirestoreCourses = getCourses;
