import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query, 
  where 
} from 'firebase/firestore';
import { Course, Cohort, LessonDoc, ChunkItem, CourseLevel } from '../types';
import { curriculumRegistry } from './curriculumRegistry';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBrH0sAU__R4k1IBrSYIF73fFdASeSpdE4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chunks-voicecloning-genshai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chunks-voicecloning-genshai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chunks-voicecloning-genshai.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "284566312743",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:284566312743:web:5684ad42-756a-4f59-89ea-08fa00d7a832"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

export interface DatabaseStatus {
  isConnected: boolean;
  isSynced: boolean;
  totalCoursesInDb: number;
  totalLessonsInDb: number;
  totalCohortsInDb: number;
  lastChecked: string;
  projectId?: string;
  error?: string | null;
}

// --------------------------------------------------------------------------
// 1. Fetch All Courses Dynamically
// --------------------------------------------------------------------------
export async function getCourses(): Promise<Course[]> {
  try {
    const snapshot = await getDocs(collection(db, 'courses'));
    if (!snapshot.empty) {
      const courses = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Course));
      return courses;
    }
  } catch (err) {
    console.warn('[Firestore] getCourses fallback to registry:', err);
  }

  return curriculumRegistry.getAllCourses();
}

// --------------------------------------------------------------------------
// 2. Fetch Cohorts by Course Level or Course ID
// --------------------------------------------------------------------------
export async function getCohorts(filterIdentifier?: string): Promise<Cohort[]> {
  try {
    const cohortsRef = collection(db, 'cohorts');
    let snapshot;
    if (filterIdentifier) {
      const isLevelCode = filterIdentifier.startsWith('LEVEL_') || filterIdentifier.includes('_');
      const q = isLevelCode 
        ? query(cohortsRef, where('level_code', '==', filterIdentifier))
        : query(cohortsRef, where('course_id', '==', filterIdentifier));
      snapshot = await getDocs(q);
    } else {
      snapshot = await getDocs(cohortsRef);
    }

    if (!snapshot.empty) {
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Cohort));
    }
  } catch (err) {
    console.warn('[Firestore] getCohorts fallback:', err);
  }

  // LocalStorage cache fallback
  try {
    const saved = localStorage.getItem('chunks_firestore_synced_cohorts');
    if (saved) {
      const parsed: Cohort[] = JSON.parse(saved);
      return filterIdentifier 
        ? parsed.filter(c => c.level_code === filterIdentifier || c.course_id === filterIdentifier) 
        : parsed;
    }
  } catch {}

  return [];
}

// --------------------------------------------------------------------------
// 3. Fetch Lesson By ID (Dynamic fallback without hardcoded prefix heuristics)
// --------------------------------------------------------------------------
export async function getLessonById(lessonId: string): Promise<LessonDoc | null> {
  try {
    let docRef = doc(db, 'lessons', lessonId);
    let snapshot = await getDoc(docRef);
    
    if (!snapshot.exists() && lessonId.startsWith('level_b_day_')) {
      const eresId = lessonId.replace('level_b_day_', 'level_b_eres_day_');
      docRef = doc(db, 'lessons', eresId);
      snapshot = await getDoc(docRef);
    }

    if (!snapshot.exists() && (lessonId === 'level_a_day_0' || lessonId === 'level_a_0')) {
      docRef = doc(db, 'lessons', 'level_a_word_list');
      snapshot = await getDoc(docRef);
    }

    if (snapshot.exists()) {
      const data = snapshot.data();
      const chunksArray: ChunkItem[] = Array.isArray(data.chunks) ? data.chunks : [];

      return {
        id: snapshot.id,
        course_id: data.course_id,
        level_code: data.level_code || 'CUSTOM',
        day_number: data.day_number ?? 0,
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

  // Fallback to dynamic curriculum registry
  return curriculumRegistry.getLessonById(lessonId);
}

// --------------------------------------------------------------------------
// 4. Fetch All Lessons for ANY Course / Level
// --------------------------------------------------------------------------
export async function getLessonsByLevel(courseIdOrLevel: CourseLevel | string): Promise<LessonDoc[]> {
  try {
    const lessonsRef = collection(db, 'lessons');
    
    // First query by level_code
    let q = query(lessonsRef, where('level_code', '==', courseIdOrLevel));
    let snapshot = await getDocs(q);

    // If empty, query by course_id
    if (snapshot.empty) {
      q = query(lessonsRef, where('course_id', '==', courseIdOrLevel));
      snapshot = await getDocs(q);
    }

    // If still empty, try alias / canonical fallbacks in Firestore
    if (snapshot.empty) {
      if (courseIdOrLevel === 'LEVEL_B' || courseIdOrLevel === 'course_level_b') {
        q = query(lessonsRef, where('level_code', '==', 'LEVEL_B_ERES'));
        snapshot = await getDocs(q);
        if (snapshot.empty) {
          q = query(lessonsRef, where('course_id', '==', 'course_level_b_eres'));
          snapshot = await getDocs(q);
        }
      } else if (courseIdOrLevel === 'LEVEL_B_EREL' || courseIdOrLevel === 'course_level_b_erel') {
        const alt = courseIdOrLevel === 'LEVEL_B_EREL' ? 'course_level_b_erel' : 'LEVEL_B_EREL';
        q = query(lessonsRef, where(courseIdOrLevel === 'LEVEL_B_EREL' ? 'course_id' : 'level_code', '==', alt));
        snapshot = await getDocs(q);
      } else if (courseIdOrLevel === 'LEVEL_B_ERES' || courseIdOrLevel === 'course_level_b_eres') {
        const alt = courseIdOrLevel === 'LEVEL_B_ERES' ? 'course_level_b_eres' : 'LEVEL_B_ERES';
        q = query(lessonsRef, where(courseIdOrLevel === 'LEVEL_B_ERES' ? 'course_id' : 'level_code', '==', alt));
        snapshot = await getDocs(q);
      } else if (courseIdOrLevel === 'LEVEL_A' || courseIdOrLevel === 'course_level_a') {
        const alt = courseIdOrLevel === 'LEVEL_A' ? 'course_level_a' : 'LEVEL_A';
        q = query(lessonsRef, where(courseIdOrLevel === 'LEVEL_A' ? 'course_id' : 'level_code', '==', alt));
        snapshot = await getDocs(q);
      }
    }
    
    if (!snapshot.empty) {
      return snapshot.docs.map(d => {
        const data = d.data();
        const chunks = Array.isArray(data.chunks) ? data.chunks : [];
        return {
          id: d.id,
          course_id: data.course_id,
          level_code: data.level_code || courseIdOrLevel,
          day_number: data.day_number ?? 0,
          lesson_title: data.lesson_title || d.id,
          lesson_type: data.lesson_type || 'Standard Lesson',
          total_chunks: chunks.length,
          categories: data.categories || [],
          chunks: chunks,
          created_at: data.created_at || new Date().toISOString()
        };
      }).sort((a, b) => a.day_number - b.day_number);
    }
  } catch (err) {
    console.warn(`[Firestore] getLessonsByLevel notice for ${courseIdOrLevel}:`, err);
  }

  // Fallback to in-memory registry
  return curriculumRegistry.getLessons(courseIdOrLevel);
}

export async function getAllLessons(courseIdOrLevel?: CourseLevel | string): Promise<LessonDoc[]> {
  if (courseIdOrLevel) {
    return getLessonsByLevel(courseIdOrLevel);
  }
  try {
    const snapshot = await getDocs(collection(db, 'lessons'));
    if (!snapshot.empty) {
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LessonDoc));
    }
  } catch {}
  return curriculumRegistry.getAllLessons();
}

// --------------------------------------------------------------------------
// 5. Save / Update Lesson & Chunks
// --------------------------------------------------------------------------
export async function saveLesson(lesson: LessonDoc): Promise<void> {
  try {
    const docRef = doc(db, 'lessons', lesson.id);
    await setDoc(docRef, lesson, { merge: true });
  } catch (e) {
    console.warn(`[Firestore] saveLesson warning for ${lesson.id}:`, e);
  }
}

export async function addOrUpdateChunk(lessonId: string, chunk: ChunkItem): Promise<LessonDoc | null> {
  const lesson = await getLessonById(lessonId);
  if (!lesson) return null;

  const chunks = [...lesson.chunks];
  const chunkIndex = chunks.findIndex(c => c.chunk_id === chunk.chunk_id);
  if (chunkIndex >= 0) chunks[chunkIndex] = chunk;
  else chunks.push(chunk);

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

export async function updateLessonChunks(lessonId: string, chunks: ChunkItem[]): Promise<LessonDoc | null> {
  const lesson = await getLessonById(lessonId);
  if (!lesson) return null;
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

// --------------------------------------------------------------------------
// 6. Cohort CRUD Operations
// --------------------------------------------------------------------------
export async function saveCohort(cohort: Cohort): Promise<void> {
  try {
    const docRef = doc(db, 'cohorts', cohort.id);
    await setDoc(docRef, cohort, { merge: true });
  } catch (e) {
    console.warn("[Firestore] saveCohort notice:", e);
  }

  try {
    const saved = localStorage.getItem('chunks_firestore_synced_cohorts');
    let cohorts: Cohort[] = saved ? JSON.parse(saved) : [];
    const index = cohorts.findIndex(c => c.id === cohort.id);
    if (index >= 0) cohorts[index] = cohort;
    else cohorts.unshift(cohort);
    localStorage.setItem('chunks_firestore_synced_cohorts', JSON.stringify(cohorts));
  } catch {}
}

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
      localStorage.setItem('chunks_firestore_synced_cohorts', JSON.stringify(cohorts.filter(c => c.id !== cohortId)));
    }
  } catch {}
}

// --------------------------------------------------------------------------
// 7. Dynamic Health Check
// --------------------------------------------------------------------------
export async function checkFirestoreHealth(): Promise<DatabaseStatus> {
  const status: DatabaseStatus = {
    isConnected: false,
    isSynced: false,
    totalCoursesInDb: 0,
    totalLessonsInDb: 0,
    totalCohortsInDb: 0,
    lastChecked: new Date().toISOString(),
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chunks-voicecloning-genshai",
    error: null
  };

  try {
    const coursesSnap = await getDocs(collection(db, 'courses'));
    status.isConnected = true;
    status.totalCoursesInDb = coursesSnap.size;

    const lessonsSnap = await getDocs(collection(db, 'lessons'));
    status.totalLessonsInDb = lessonsSnap.size;

    const cohortsSnap = await getDocs(collection(db, 'cohorts'));
    status.totalCohortsInDb = cohortsSnap.size;

    status.isSynced = status.totalLessonsInDb > 0 && status.totalCoursesInDb > 0;
    return status;
  } catch (err: any) {
    status.isConnected = false;
    status.error = err?.message || String(err);
    return status;
  }
}

export const DEFAULT_COURSES: Course[] = curriculumRegistry.getAllCourses();

// --------------------------------------------------------------------------
// 8. Safe Chunked Batch Sync (Prevents Firestore 500-operation limit breach)
// --------------------------------------------------------------------------
export async function syncAllCurriculumToFirestore(
  onProgressOrCourses?: ((current: number, total: number, message: string) => void) | Course[],
  customLessons?: LessonDoc[],
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ success: boolean; totalLessons: number; totalChunks: number; error?: string }> {
  try {
    let coursesToSync: Course[];
    let lessonsToSync: LessonDoc[];
    let progressCb: ((current: number, total: number, message: string) => void) | undefined;

    if (typeof onProgressOrCourses === 'function') {
      progressCb = onProgressOrCourses;
      coursesToSync = curriculumRegistry.getAllCourses();
      lessonsToSync = curriculumRegistry.getAllLessons();
    } else {
      coursesToSync = onProgressOrCourses || curriculumRegistry.getAllCourses();
      lessonsToSync = customLessons || curriculumRegistry.getAllLessons();
      progressCb = onProgress;
    }

    const totalOps = coursesToSync.length + lessonsToSync.length;
    let processedOps = 0;
    let totalChunkCount = 0;

    const BATCH_SIZE = 400; // Safe threshold under Firestore 500 limit

    // 1. Sync Courses
    let batch = writeBatch(db);
    let countInBatch = 0;

    for (const course of coursesToSync) {
      batch.set(doc(db, 'courses', course.id), course, { merge: true });
      countInBatch++;
      processedOps++;
      if (countInBatch >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        countInBatch = 0;
        progressCb?.(processedOps, totalOps, `Synced ${processedOps}/${totalOps} items...`);
      }
    }

    // 2. Sync Lessons
    for (const lesson of lessonsToSync) {
      totalChunkCount += (lesson.chunks?.length || 0);
      batch.set(doc(db, 'lessons', lesson.id), lesson, { merge: true });
      countInBatch++;
      processedOps++;
      if (countInBatch >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        countInBatch = 0;
        progressCb?.(processedOps, totalOps, `Synced ${processedOps}/${totalOps} items...`);
      }
    }

    if (countInBatch > 0) {
      await batch.commit();
    }

    progressCb?.(totalOps, totalOps, `Đồng bộ hoàn tất ${lessonsToSync.length} lessons (${totalChunkCount} chunks) cho ${coursesToSync.length} courses!`);
    return {
      success: true,
      totalLessons: lessonsToSync.length,
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

// Aliases for backward compatibility
export const saveLessonToFirestore = saveLesson;
export const getFirestoreCohorts = getCohorts;
export const saveFirestoreCohort = saveCohort;
export const getFirestoreLessonById = getLessonById;
export const getFirestoreCourses = getCourses;
