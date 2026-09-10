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
  where,
  getCountFromServer 
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
// In-Memory Cache (TTL: 5 minutes) + SingleFlight Request Deduplication
// --------------------------------------------------------------------------
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inflightRequests = new Map<string, Promise<any>>();

function isCacheValid<T>(entry?: CacheEntry<T>): boolean {
  if (!entry) return false;
  return (Date.now() - entry.timestamp) < CACHE_TTL_MS;
}

function setCacheEntry<T>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

function getCacheEntry<T>(key: string): T | undefined {
  const entry = memoryCache.get(key);
  if (isCacheValid(entry)) {
    return entry!.data as T;
  }
  if (entry) {
    memoryCache.delete(key);
  }
  return undefined;
}

async function executeWithSingleFlight<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inflightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = (async () => {
    try {
      return await fetcher();
    } finally {
      inflightRequests.delete(key);
    }
  })();

  inflightRequests.set(key, promise);
  return promise;
}

export function invalidateLessonsCache(courseIdOrLevel?: string): void {
  if (courseIdOrLevel) {
    const raw = courseIdOrLevel.trim();
    const upper = raw.toUpperCase();
    const lower = raw.toLowerCase();

    memoryCache.delete(`lessons_by_level:${raw}`);
    memoryCache.delete(`lessons_by_level:${upper}`);
    memoryCache.delete(`lessons_by_level:${lower}`);

    if (upper === 'LEVEL_B' || lower === 'course_level_b' || upper === 'LEVEL_B_ERE' || lower === 'course_level_b_ere') {
      memoryCache.delete('lessons_by_level:LEVEL_B');
      memoryCache.delete('lessons_by_level:course_level_b');
      memoryCache.delete('lessons_by_level:LEVEL_B_ERE');
      memoryCache.delete('lessons_by_level:course_level_b_ere');
    }

    for (const key of Array.from(memoryCache.keys())) {
      if (key.startsWith('lesson_by_id:') && (key.includes(lower) || key.includes(raw))) {
        memoryCache.delete(key);
      }
    }
  } else {
    for (const key of Array.from(memoryCache.keys())) {
      if (key.startsWith('lessons_by_level:') || key.startsWith('lesson_by_id:') || key === 'all_lessons') {
        memoryCache.delete(key);
      }
    }
  }
  memoryCache.delete('all_lessons');
}

export function invalidateCohortsCache(filterIdentifier?: string): void {
  if (filterIdentifier) {
    memoryCache.delete(`cohorts:${filterIdentifier}`);
  }
  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith('cohorts:')) {
      memoryCache.delete(key);
    }
  }
}

export function invalidateCoursesCache(): void {
  memoryCache.delete('courses');
}

export function clearAllFirestoreCache(): void {
  memoryCache.clear();
}

// --------------------------------------------------------------------------
// 1. Fetch All Courses Dynamically
// --------------------------------------------------------------------------
export async function getCourses(forceRefresh?: boolean): Promise<Course[]> {
  const cacheKey = 'courses';
  if (!forceRefresh) {
    const cached = getCacheEntry<Course[]>(cacheKey);
    if (cached) return cached;
  }

  return executeWithSingleFlight(cacheKey, async () => {
    try {
      const snapshot = await getDocs(collection(db, 'courses'));
      if (!snapshot.empty) {
        const courses = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Course));
        setCacheEntry(cacheKey, courses);
        return courses;
      }
    } catch (err) {
      console.warn('[Firestore] getCourses fallback to registry:', err);
    }

    const fallbackCourses = curriculumRegistry.getAllCourses();
    setCacheEntry(cacheKey, fallbackCourses);
    return fallbackCourses;
  });
}

// --------------------------------------------------------------------------
// 2. Fetch Cohorts by Course Level or Course ID
// --------------------------------------------------------------------------
export async function getCohorts(filterIdentifier?: string, forceRefresh?: boolean): Promise<Cohort[]> {
  const cacheKey = `cohorts:${filterIdentifier || 'all'}`;
  if (!forceRefresh) {
    const cached = getCacheEntry<Cohort[]>(cacheKey);
    if (cached) return cached;
  }

  return executeWithSingleFlight(cacheKey, async () => {
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
        const cohorts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Cohort));
        setCacheEntry(cacheKey, cohorts);
        return cohorts;
      }
    } catch (err) {
      console.warn('[Firestore] getCohorts fallback:', err);
    }

    // LocalStorage cache fallback
    try {
      const saved = localStorage.getItem('chunks_firestore_synced_cohorts');
      if (saved) {
        const parsed: Cohort[] = JSON.parse(saved);
        const result = filterIdentifier 
          ? parsed.filter(c => c.level_code === filterIdentifier || c.course_id === filterIdentifier) 
          : parsed;
        setCacheEntry(cacheKey, result);
        return result;
      }
    } catch {}

    return [];
  });
}

// --------------------------------------------------------------------------
// 3. Fetch Lesson By ID (Dynamic fallback without hardcoded prefix heuristics)
// --------------------------------------------------------------------------
export async function getLessonById(lessonId: string, forceRefresh?: boolean): Promise<LessonDoc | null> {
  const cacheKey = `lesson_by_id:${lessonId}`;
  if (!forceRefresh) {
    const cached = getCacheEntry<LessonDoc>(cacheKey);
    if (cached) return cached;
  }

  return executeWithSingleFlight(cacheKey, async () => {
    try {
      let docRef = doc(db, 'lessons', lessonId);
      let snapshot = await getDoc(docRef);
      
      if (!snapshot.exists() && lessonId.startsWith('level_b_day_')) {
        const ereId = lessonId.replace('level_b_day_', 'level_b_ere_day_');
        docRef = doc(db, 'lessons', ereId);
        snapshot = await getDoc(docRef);
      }

      if (!snapshot.exists() && lessonId.startsWith('level_b_ere_day_')) {
        const bId = lessonId.replace('level_b_ere_day_', 'level_b_day_');
        docRef = doc(db, 'lessons', bId);
        snapshot = await getDoc(docRef);
      }

      if (!snapshot.exists() && (lessonId === 'level_a_day_0' || lessonId === 'level_a_0')) {
        docRef = doc(db, 'lessons', 'level_a_word_list');
        snapshot = await getDoc(docRef);
      }

      if (snapshot.exists()) {
        const data = snapshot.data();
        const chunksArray: ChunkItem[] = Array.isArray(data.chunks) ? data.chunks : [];

        const lessonDoc: LessonDoc = {
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

        // Always update registry so in-memory store is synchronized with Firestore permanent audio URLs
        curriculumRegistry.updateLesson(lessonDoc);
        setCacheEntry(cacheKey, lessonDoc);
        if (lessonId.startsWith('level_b_day_')) {
          setCacheEntry(`lesson_by_id:${lessonId.replace('level_b_day_', 'level_b_ere_day_')}`, lessonDoc);
        } else if (lessonId.startsWith('level_b_ere_day_')) {
          setCacheEntry(`lesson_by_id:${lessonId.replace('level_b_ere_day_', 'level_b_day_')}`, lessonDoc);
        }

        return lessonDoc;
      }
    } catch (err) {
      console.warn(`[Firestore] getLessonById notice for ${lessonId}:`, err);
    }

    // Fallback to dynamic curriculum registry
    const fallback = curriculumRegistry.getLessonById(lessonId);
    if (fallback) {
      setCacheEntry(cacheKey, fallback);
    }
    return fallback;
  });
}

/**
 * Helper to deduplicate lessons and prioritize canonical lessons over aliases.
 * Rules:
 * 1. Exclude explicit alias level codes (e.g. 'LEVEL_B_ALIAS').
 * 2. Filter out alias lessons: If lesson.id.startsWith('level_b_ere_day_') and a matching level_b_day_X exists, exclude the alias!
 * 3. Deduplicate by day_number: if multiple lessons have the same day_number, prioritize the canonical one (l.id.startsWith('level_b_day_') over level_b_ere_day_).
 * 4. For Level B context, ensure exactly 30 unique lessons (Days 1 to 30) are returned.
 */
export function deduplicateLessons(lessons: LessonDoc[], context?: CourseLevel | string): LessonDoc[] {
  // 1. Exclude explicit alias level codes
  let candidate = lessons.filter(l => l.level_code !== 'LEVEL_B_ALIAS' && !l.level_code?.endsWith('_ALIAS'));

  // 2. Identify canonical IDs present in the candidate set
  const canonicalIds = new Set(candidate.map(l => l.id));

  // Filter out alias lessons: If lesson.id.startsWith('level_b_ere_day_') and a matching level_b_day_X exists, exclude the alias!
  candidate = candidate.filter(l => {
    if (l.id.startsWith('level_b_ere_day_')) {
      const canonicalId = l.id.replace('level_b_ere_day_', 'level_b_day_');
      if (canonicalIds.has(canonicalId)) {
        return false;
      }
    }
    return true;
  });

  // Helper to determine partition key when lessons span multiple courses
  const getPartitionKey = (lesson: LessonDoc): string => {
    if (context) return String(context).toUpperCase();
    if (lesson.id.startsWith('level_a_') || lesson.level_code === 'LEVEL_A') return 'LEVEL_A';
    if (lesson.id.startsWith('level_b_erel_') || lesson.level_code === 'LEVEL_B_EREL') return 'LEVEL_B_EREL';
    if (lesson.id.startsWith('level_b_eres_') || lesson.level_code === 'LEVEL_B_ERES') return 'LEVEL_B_ERES';
    if (lesson.id.startsWith('level_b_day_') || lesson.id.startsWith('level_b_ere_day_') || lesson.level_code === 'LEVEL_B') return 'LEVEL_B';
    return lesson.course_id || lesson.level_code || 'OTHER';
  };

  // Group by course partition
  const groups = new Map<string, LessonDoc[]>();
  for (const lesson of candidate) {
    const key = getPartitionKey(lesson);
    const list = groups.get(key) || [];
    list.push(lesson);
    groups.set(key, list);
  }

  const result: LessonDoc[] = [];

  for (const [partKey, groupLessons] of groups) {
    const dayMap = new Map<number, LessonDoc>();

    for (const lesson of groupLessons) {
      const day = lesson.day_number ?? 0;
      const existing = dayMap.get(day);

      if (!existing) {
        dayMap.set(day, lesson);
      } else {
        // Prioritize canonical lesson:
        // Prioritize l.id.startsWith('level_b_day_') over level_b_ere_day_
        const lessonIsCanonical = lesson.id.startsWith('level_b_day_');
        const existingIsCanonical = existing.id.startsWith('level_b_day_');

        if (lessonIsCanonical && !existingIsCanonical) {
          dayMap.set(day, lesson);
        } else if (!lessonIsCanonical && existingIsCanonical) {
          // Keep existing
        } else if (existing.id.startsWith('level_b_ere_day_') && !lesson.id.startsWith('level_b_ere_day_')) {
          dayMap.set(day, lesson);
        } else if ((lesson.chunks?.length || 0) > (existing.chunks?.length || 0)) {
          dayMap.set(day, lesson);
        }
      }
    }

    let sortedGroup = Array.from(dayMap.values()).sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0));

    // For LEVEL_B, ensure exactly 30 unique lessons (Days 1 to 30)
    if (partKey === 'LEVEL_B' || partKey === 'COURSE_LEVEL_B' || partKey === 'LEVEL_B_ERE' || partKey === 'COURSE_LEVEL_B_ERE') {
      sortedGroup = sortedGroup.filter(l => (l.day_number ?? 0) >= 1 && (l.day_number ?? 0) <= 30 && l.id !== 'level_b_word_list');
    }

    result.push(...sortedGroup);
  }

  return result.sort((a, b) => {
    if (a.level_code !== b.level_code) {
      return (a.level_code || '').localeCompare(b.level_code || '');
    }
    return (a.day_number ?? 0) - (b.day_number ?? 0);
  });
}

// --------------------------------------------------------------------------
// 4. Fetch All Lessons for ANY Course / Level
// --------------------------------------------------------------------------
export async function getLessonsByLevel(courseIdOrLevel: CourseLevel | string, forceRefresh?: boolean): Promise<LessonDoc[]> {
  const cacheKey = `lessons_by_level:${courseIdOrLevel}`;
  if (!forceRefresh) {
    const cached = getCacheEntry<LessonDoc[]>(cacheKey);
    if (cached) return cached;
  }

  return executeWithSingleFlight(cacheKey, async () => {
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
          q = query(lessonsRef, where('level_code', '==', 'LEVEL_B_ERE'));
          snapshot = await getDocs(q);
          if (snapshot.empty) {
            q = query(lessonsRef, where('course_id', '==', 'course_level_b_ere'));
            snapshot = await getDocs(q);
          }
        } else if (courseIdOrLevel === 'LEVEL_B_ERE' || courseIdOrLevel === 'course_level_b_ere') {
          q = query(lessonsRef, where('level_code', '==', 'LEVEL_B'));
          snapshot = await getDocs(q);
          if (snapshot.empty) {
            q = query(lessonsRef, where('course_id', '==', 'course_level_b'));
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
        const rawLessons = snapshot.docs.map(d => {
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
          } as LessonDoc;
        });

        const lessons = deduplicateLessons(rawLessons, courseIdOrLevel);

        // Iterate and call curriculumRegistry.updateLesson for each doc before returning
        lessons.forEach(lesson => {
          curriculumRegistry.updateLesson(lesson);
          setCacheEntry(`lesson_by_id:${lesson.id}`, lesson);
          if (lesson.id.startsWith('level_b_day_')) {
            setCacheEntry(`lesson_by_id:${lesson.id.replace('level_b_day_', 'level_b_ere_day_')}`, lesson);
          }
        });

        setCacheEntry(cacheKey, lessons);
        return lessons;
      }
    } catch (err) {
      console.warn(`[Firestore] getLessonsByLevel notice for ${courseIdOrLevel}:`, err);
    }

    // Fallback to in-memory registry
    const fallback = curriculumRegistry.getLessons(courseIdOrLevel);
    setCacheEntry(cacheKey, fallback);
    return fallback;
  });
}

export async function getAllLessons(courseIdOrLevel?: CourseLevel | string, forceRefresh?: boolean): Promise<LessonDoc[]> {
  if (courseIdOrLevel) {
    return getLessonsByLevel(courseIdOrLevel, forceRefresh);
  }
  const cacheKey = 'all_lessons';
  if (!forceRefresh) {
    const cached = getCacheEntry<LessonDoc[]>(cacheKey);
    if (cached) return cached;
  }

  return executeWithSingleFlight(cacheKey, async () => {
    try {
      const snapshot = await getDocs(collection(db, 'lessons'));
      if (!snapshot.empty) {
        const rawLessons = snapshot.docs.map(d => {
          const data = d.data();
          const chunks = Array.isArray(data.chunks) ? data.chunks : [];
          return {
            id: d.id,
            course_id: data.course_id,
            level_code: data.level_code || 'CUSTOM',
            day_number: data.day_number ?? 0,
            lesson_title: data.lesson_title || d.id,
            lesson_type: data.lesson_type || 'Standard Lesson',
            total_chunks: chunks.length,
            categories: Array.isArray(data.categories) ? data.categories : [],
            chunks: chunks,
            created_at: data.created_at || new Date().toISOString()
          } as LessonDoc;
        });

        const lessons = deduplicateLessons(rawLessons);

        lessons.forEach(lesson => {
          curriculumRegistry.updateLesson(lesson);
          setCacheEntry(`lesson_by_id:${lesson.id}`, lesson);
          if (lesson.id.startsWith('level_b_day_')) {
            setCacheEntry(`lesson_by_id:${lesson.id.replace('level_b_day_', 'level_b_ere_day_')}`, lesson);
          }
        });
        setCacheEntry(cacheKey, lessons);
        return lessons;
      }
    } catch (err) {
      console.warn('[Firestore] getAllLessons notice:', err);
    }
    const fallback = curriculumRegistry.getAllLessons();
    setCacheEntry(cacheKey, fallback);
    return fallback;
  });
}

/**
 * Dedicated helper to synchronize Firestore /lessons into in-memory curriculumRegistry.
 * Fetches the latest lessons from Firestore /lessons, updates curriculumRegistry for each lesson,
 * and returns counts of total lessons, total chunks, and chunks with valid permanent audio_url.
 */
export async function syncFirestoreLessonsToRegistry(
  courseIdOrLevel?: CourseLevel | string
): Promise<{ totalLessons: number; totalChunks: number; chunksWithAudio: number }> {
  try {
    let lessons: LessonDoc[] = [];
    if (courseIdOrLevel) {
      lessons = await getLessonsByLevel(courseIdOrLevel);
    } else {
      lessons = await getAllLessons();
    }

    let totalChunks = 0;
    let chunksWithAudio = 0;

    for (const lesson of lessons) {
      if (Array.isArray(lesson.chunks)) {
        totalChunks += lesson.chunks.length;
        chunksWithAudio += lesson.chunks.filter(c =>
          Boolean(c.audio_url && c.audio_url.startsWith('http') && !c.audio_url.includes('placeholder'))
        ).length;
      }
    }

    return {
      totalLessons: lessons.length,
      totalChunks,
      chunksWithAudio
    };
  } catch (err) {
    console.error('[Firestore] syncFirestoreLessonsToRegistry error:', err);
    throw err;
  }
}

// --------------------------------------------------------------------------
// 5. Save / Update Lesson & Chunks
// --------------------------------------------------------------------------
export async function saveLesson(lesson: LessonDoc): Promise<void> {
  // Update in-memory registry immediately so current and future tab components see changes instantly
  curriculumRegistry.updateLesson(lesson);
  invalidateLessonsCache(lesson.course_id || lesson.level_code);
  memoryCache.delete(`lesson_by_id:${lesson.id}`);
  if (lesson.id.startsWith('level_b_day_')) {
    memoryCache.delete(`lesson_by_id:${lesson.id.replace('level_b_day_', 'level_b_ere_day_')}`);
  } else if (lesson.id.startsWith('level_b_ere_day_')) {
    memoryCache.delete(`lesson_by_id:${lesson.id.replace('level_b_ere_day_', 'level_b_day_')}`);
  }
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
  invalidateCohortsCache();
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
  invalidateCohortsCache();
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
    const coursesSnap = await getCountFromServer(collection(db, 'courses'));
    status.isConnected = true;
    status.totalCoursesInDb = coursesSnap.data().count;

    const lessonsSnap = await getCountFromServer(collection(db, 'lessons'));
    status.totalLessonsInDb = lessonsSnap.data().count;

    const cohortsSnap = await getCountFromServer(collection(db, 'cohorts'));
    status.totalCohortsInDb = cohortsSnap.data().count;

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

    invalidateCoursesCache();
    invalidateLessonsCache();

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
