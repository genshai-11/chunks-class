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
import { Course, Cohort, ClassSession, LessonDoc, ChunkItem, CourseLevel, LessonGrammar } from '../types';
import { curriculumRegistry } from './curriculumRegistry';
import { CURRICULUM_CATALOG_LEVEL_B_ERE } from '../data/levelBEreData';

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
// Lesson Overrides Helpers (Local Persistence)
// --------------------------------------------------------------------------
export interface LessonOverride {
  is_active?: boolean;
  display_title?: string;
  day_number?: number;
}

export function getLessonOverrides(): Record<string, LessonOverride> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = localStorage.getItem('chunks_lesson_overrides');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLessonOverrides(overrides: Record<string, LessonOverride>): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const existing = getLessonOverrides();
    const merged = { ...existing, ...overrides };
    localStorage.setItem('chunks_lesson_overrides', JSON.stringify(merged));
  } catch (e) {
    console.warn('[Firestore] Failed to save chunks_lesson_overrides to localStorage:', e);
  }
}

export function applyLessonOverrides<T extends LessonDoc>(lesson: T, overrides?: Record<string, LessonOverride>): T {
  const map = overrides || getLessonOverrides();
  const override = map[lesson.id];
  if (!override) return lesson;
  return {
    ...lesson,
    day_number: override.day_number !== undefined ? override.day_number : lesson.day_number,
    is_active: override.is_active !== undefined ? override.is_active : (lesson.is_active !== undefined ? lesson.is_active : true),
    display_title: override.display_title || lesson.display_title || lesson.lesson_title,
    lesson_title: override.display_title || lesson.lesson_title
  };
}

// --------------------------------------------------------------------------
// 1. Fetch All Courses Dynamically
// --------------------------------------------------------------------------
export async function getCourses(forceRefresh?: boolean, includeAuxiliary: boolean = false): Promise<Course[]> {
  const cacheKey = `courses:${includeAuxiliary ? 'all' : 'primary'}`;
  if (!forceRefresh) {
    const cached = getCacheEntry<Course[]>(cacheKey);
    if (cached) return cached;
  }

  return executeWithSingleFlight(cacheKey, async () => {
    try {
      const snapshot = await getDocs(collection(db, 'courses'));
      if (!snapshot.empty) {
        let courses = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Course));
        if (!includeAuxiliary) {
          courses = courses.filter(c => 
            c.id !== 'course_level_b_erel' && 
            c.id !== 'course_level_b_eres' && 
            c.level_code !== 'LEVEL_B_EREL' && 
            c.level_code !== 'LEVEL_B_ERES'
          );
        }
        setCacheEntry(cacheKey, courses);
        return courses;
      }
    } catch (err) {
      console.warn('[Firestore] getCourses fallback to registry:', err);
    }

    const fallbackCourses = curriculumRegistry.getAllCourses(includeAuxiliary);
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
          ...data,
          id: snapshot.id,
          course_id: data.course_id,
          level_code: data.level_code || 'CUSTOM',
          day_number: data.day_number ?? 0,
          lesson_title: data.display_title || data.lesson_title || snapshot.id,
          display_title: data.display_title || data.lesson_title || snapshot.id,
          is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
          lesson_type: data.lesson_type || 'Standard Lesson',
          total_chunks: chunksArray.length,
          categories: Array.isArray(data.categories) ? data.categories : [],
          chunks: chunksArray,
          grammar: data.grammar,
          created_at: data.created_at || new Date().toISOString()
        };

        // Merge with local storage overrides
        const mergedDoc = applyLessonOverrides(lessonDoc);

        // Always update registry so in-memory store is synchronized with Firestore permanent audio URLs
        curriculumRegistry.updateLesson(mergedDoc);
        setCacheEntry(cacheKey, mergedDoc);
        if (lessonId.startsWith('level_b_day_')) {
          setCacheEntry(`lesson_by_id:${lessonId.replace('level_b_day_', 'level_b_ere_day_')}`, mergedDoc);
        } else if (lessonId.startsWith('level_b_ere_day_')) {
          setCacheEntry(`lesson_by_id:${lessonId.replace('level_b_ere_day_', 'level_b_day_')}`, mergedDoc);
        }

        return mergedDoc;
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
    const idMap = new Map<string, LessonDoc>();

    for (const lesson of groupLessons) {
      const existing = idMap.get(lesson.id);
      if (!existing) {
        idMap.set(lesson.id, lesson);
      } else {
        // If duplicate ID exists, keep the one with more chunks or updated content
        if ((lesson.chunks?.length || 0) > (existing.chunks?.length || 0)) {
          idMap.set(lesson.id, lesson);
        }
      }
    }

    let sortedGroup = Array.from(idMap.values()).sort((a, b) => {
      const dayDiff = (a.day_number ?? 0) - (b.day_number ?? 0);
      if (dayDiff !== 0) return dayDiff;
      return a.id.localeCompare(b.id);
    });

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
            ...data,
            id: d.id,
            course_id: data.course_id,
            level_code: data.level_code || courseIdOrLevel,
            day_number: data.day_number ?? 0,
            lesson_title: data.display_title || data.lesson_title || d.id,
            display_title: data.display_title || data.lesson_title || d.id,
            is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
            lesson_type: data.lesson_type || 'Standard Lesson',
            total_chunks: chunks.length,
            categories: data.categories || [],
            chunks: chunks,
            grammar: data.grammar,
            created_at: data.created_at || new Date().toISOString()
          } as LessonDoc;
        });

        const lessons = deduplicateLessons(rawLessons, courseIdOrLevel);
        // Secondary persistence: merge with localStorage overrides
        const overrides = getLessonOverrides();
        const lessonsWithOverrides = lessons
          .map(l => applyLessonOverrides(l, overrides))
          .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0));

        // Iterate and call curriculumRegistry.updateLesson for each doc before returning
        lessonsWithOverrides.forEach(lesson => {
          curriculumRegistry.updateLesson(lesson);
          setCacheEntry(`lesson_by_id:${lesson.id}`, lesson);
          if (lesson.id.startsWith('level_b_day_')) {
            setCacheEntry(`lesson_by_id:${lesson.id.replace('level_b_day_', 'level_b_ere_day_')}`, lesson);
          }
        });

        setCacheEntry(cacheKey, lessonsWithOverrides);
        return lessonsWithOverrides;
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
            ...data,
            id: d.id,
            course_id: data.course_id,
            level_code: data.level_code || 'CUSTOM',
            day_number: data.day_number ?? 0,
            lesson_title: data.display_title || data.lesson_title || d.id,
            display_title: data.display_title || data.lesson_title || d.id,
            is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
            lesson_type: data.lesson_type || 'Standard Lesson',
            total_chunks: chunks.length,
            categories: Array.isArray(data.categories) ? data.categories : [],
            chunks: chunks,
            grammar: data.grammar,
            created_at: data.created_at || new Date().toISOString()
          } as LessonDoc;
        });

        const lessons = deduplicateLessons(rawLessons);
        // Merge with localStorage overrides
        const overridesAll = getLessonOverrides();
        const lessonsAllWithOverrides = lessons
          .map(l => applyLessonOverrides(l, overridesAll))
          .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0));

        lessonsAllWithOverrides.forEach(lesson => {
          curriculumRegistry.updateLesson(lesson);
          setCacheEntry(`lesson_by_id:${lesson.id}`, lesson);
          if (lesson.id.startsWith('level_b_day_')) {
            setCacheEntry(`lesson_by_id:${lesson.id.replace('level_b_day_', 'level_b_ere_day_')}`, lesson);
          }
        });
        setCacheEntry(cacheKey, lessonsAllWithOverrides);
        return lessonsAllWithOverrides;
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
/**
 * Batch update multiple lessons in Firestore and synchronize in-memory registry.
 * Chunked into batches of up to 450 operations to respect Firestore's 500 limit.
 */
export async function batchUpdateLessons(
  lessons: LessonDoc[]
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!lessons || lessons.length === 0) {
    return { success: true, count: 0 };
  }

  const now = new Date().toISOString();
  const updatedLessons: LessonDoc[] = [];

  // 1. Update in-memory registry and local caches immediately
  for (const lesson of lessons) {
    const updated = {
      ...lesson,
      updated_at: now
    };
    curriculumRegistry.updateLesson(updated);
    invalidateLessonsCache(updated.course_id || updated.level_code);
    memoryCache.delete(`lesson_by_id:${updated.id}`);
    if (updated.id.startsWith('level_b_day_')) {
      memoryCache.delete(`lesson_by_id:${updated.id.replace('level_b_day_', 'level_b_ere_day_')}`);
    } else if (updated.id.startsWith('level_b_ere_day_')) {
      memoryCache.delete(`lesson_by_id:${updated.id.replace('level_b_ere_day_', 'level_b_day_')}`);
    }
    updatedLessons.push(updated);
  }

  // Dual-persistence: serialize and save overrides map to localStorage
  try {
    const overridesMap: Record<string, LessonOverride> = {};
    for (const l of updatedLessons) {
      overridesMap[l.id] = {
        is_active: l.is_active !== undefined ? Boolean(l.is_active) : true,
        display_title: l.display_title || l.lesson_title,
        day_number: l.day_number !== undefined ? Number(l.day_number) : 0
      };
    }
    saveLessonOverrides(overridesMap);
    if (typeof window !== 'undefined' && window.localStorage) {
      // Also write level-scoped backup if applicable
      const firstLevel = updatedLessons[0]?.level_code || updatedLessons[0]?.course_id;
      if (firstLevel) {
        localStorage.setItem(`chunks_lesson_overrides_${firstLevel}`, JSON.stringify(overridesMap));
      }
    }
  } catch (e) {
    console.warn('[Firestore] Failed to persist lesson overrides to localStorage in batchUpdateLessons:', e);
  }

  // 2. Commit in Firestore batches (max 450 per commit)
  // CRITICAL OPTIMIZATION: Write ONLY updated metadata (is_active, display_title, lesson_title, day_number, updated_at).
  // DO NOT write multi-megabyte `chunks` array to avoid network bloat, quota waste, and latency.
  // Include a 6-second timeout race on batch.commit() so saving never hangs indefinitely.
  try {
    const BATCH_SIZE = 450;
    for (let i = 0; i < updatedLessons.length; i += BATCH_SIZE) {
      const chunk = updatedLessons.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      for (const lesson of chunk) {
        const docRef = doc(db, 'lessons', lesson.id);
        const payload: Record<string, unknown> = {
          is_active: lesson.is_active !== undefined ? Boolean(lesson.is_active) : true,
          display_title: lesson.display_title || lesson.lesson_title,
          lesson_title: lesson.display_title || lesson.lesson_title,
          day_number: lesson.day_number !== undefined ? Number(lesson.day_number) : 0,
          updated_at: now
        };
        if (lesson.course_id) payload.course_id = lesson.course_id;
        if (lesson.level_code) payload.level_code = lesson.level_code;
        if (lesson.lesson_type) payload.lesson_type = lesson.lesson_type;
        batch.set(docRef, payload, { merge: true });
      }

      // Commit with a 6-second timeout race
      const commitPromise = batch.commit();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Firestore commit timed out after 6000ms. Local state & offline cache have been preserved.')), 6000);
      });
      await Promise.race([commitPromise, timeoutPromise]);
    }

    // 3. Automatically synchronize course cohorts with active lessons
    const firstLevel = updatedLessons[0]?.level_code || updatedLessons[0]?.course_id;
    if (firstLevel) {
      try {
        await syncCourseCohortsWithActiveLessons(firstLevel, updatedLessons);
      } catch (cohortSyncErr) {
        console.warn('[Firestore] syncCourseCohortsWithActiveLessons auto-sync notice in batchUpdateLessons:', cohortSyncErr);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('chunks:lessons-updated', {
          detail: { lessons: updatedLessons, courseLevel: firstLevel }
        }));
      } catch {}
    }
    return { success: true, count: updatedLessons.length };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[Firestore] batchUpdateLessons error:', err);
    return { 
      success: false, 
      count: 0, 
      error: errorMessage 
    };
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

/**
 * Automatically realigns cohort sessions when lesson configurations change (is_active, display_title, day_number).
 * Re-aligns each cohort's sessions to match active lessons, updates total_sessions, and persists to Firestore & localStorage.
 */
export async function syncCourseCohortsWithActiveLessons(
  courseLevelOrId: string,
  lessons: LessonDoc[]
): Promise<{ updatedCount: number; cohortIds: string[] }> {
  if (!courseLevelOrId || !lessons || lessons.length === 0) {
    return { updatedCount: 0, cohortIds: [] };
  }

  // Filter active lessons sorted by day_number ascending
  const activeLessons = lessons
    .filter(l => l.is_active !== false)
    .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0));

  if (activeLessons.length === 0) {
    return { updatedCount: 0, cohortIds: [] };
  }

  const matchesCourse = (c: Cohort, identifier: string): boolean => {
    if (!identifier) return false;
    const target = identifier.toLowerCase();
    const cLevel = (c.level_code || '').toLowerCase();
    const cCourse = (c.course_id || '').toLowerCase();

    if (cLevel === target || cCourse === target) return true;

    // Level A aliases:
    const isTargetLevelA = target === 'level_a' || target === 'course_level_a';
    const isCohortLevelA = cLevel === 'level_a' || cCourse === 'course_level_a' || cLevel === 'course_level_a';
    if (isTargetLevelA && isCohortLevelA) return true;

    // Level B / ERE aliases:
    const isTargetLevelB = target === 'level_b' || target === 'course_level_b' || target === 'level_b_ere' || target === 'course_level_b_ere';
    const isCohortLevelB = cLevel === 'level_b' || cCourse === 'course_level_b' || cLevel === 'level_b_ere' || cCourse === 'course_level_b_ere' || cLevel === 'course_level_b';
    if (isTargetLevelB && isCohortLevelB) return true;

    // EREL aliases:
    const isTargetErel = target === 'level_b_erel' || target === 'course_level_b_erel';
    const isCohortErel = cLevel === 'level_b_erel' || cCourse === 'course_level_b_erel';
    if (isTargetErel && isCohortErel) return true;

    // ERES aliases:
    const isTargetEres = target === 'level_b_eres' || target === 'course_level_b_eres';
    const isCohortEres = cLevel === 'level_b_eres' || cCourse === 'course_level_b_eres';
    if (isTargetEres && isCohortEres) return true;

    return false;
  };

  // 1. Fetch all cohorts from Firestore
  let allCohorts: Cohort[] = [];
  try {
    const cohortsRef = collection(db, 'cohorts');
    const snapshot = await getDocs(cohortsRef);
    if (!snapshot.empty) {
      allCohorts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Cohort));
    }
  } catch (err) {
    console.warn('[Firestore] syncCourseCohortsWithActiveLessons fetch error:', err);
  }

  // Fallback / merge with localStorage cohorts if any exist
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('chunks_firestore_synced_cohorts');
      if (saved) {
        const localList: Cohort[] = JSON.parse(saved);
        for (const lc of localList) {
          if (!allCohorts.some(c => c.id === lc.id)) {
            allCohorts.push(lc);
          }
        }
      }
    } catch {}
  }

  const matchingCohorts = allCohorts.filter(c => matchesCourse(c, courseLevelOrId));
  if (matchingCohorts.length === 0) {
    return { updatedCount: 0, cohortIds: [] };
  }

  const updatedCohortIds: string[] = [];
  const now = new Date().toISOString();

  // 2. Re-align each cohort's sessions
  for (const cohort of matchingCohorts) {
    if (!cohort.sessions || cohort.sessions.length === 0) continue;

    const targetCount = Math.min(cohort.sessions.length, activeLessons.length);
    const updatedSessions: ClassSession[] = [];

    for (let i = 0; i < targetCount; i++) {
      const session = cohort.sessions[i];
      const lesson = activeLessons[i];
      updatedSessions.push({
        ...session,
        session_number: i + 1,
        day_number: lesson.day_number !== undefined ? lesson.day_number : session.day_number,
        lesson_id: lesson.id,
        lesson_title: lesson.display_title || lesson.lesson_title || session.lesson_title,
        lesson_type: lesson.lesson_type || session.lesson_type || 'standard'
      });
    }

    cohort.sessions = updatedSessions;
    cohort.total_sessions = targetCount;
    cohort.updated_at = now;

    // 3. Save updated cohort to Firestore
    try {
      const docRef = doc(db, 'cohorts', cohort.id);
      await setDoc(docRef, cohort, { merge: true });
    } catch (saveErr) {
      console.warn(`[Firestore] Failed to save aligned cohort ${cohort.id}:`, saveErr);
    }

    updatedCohortIds.push(cohort.id);
  }

  // 4. Update localStorage `chunks_firestore_synced_cohorts`
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('chunks_firestore_synced_cohorts');
      let localCohorts: Cohort[] = saved ? JSON.parse(saved) : [];
      for (const updated of matchingCohorts) {
        const idx = localCohorts.findIndex(c => c.id === updated.id);
        if (idx >= 0) {
          localCohorts[idx] = updated;
        } else {
          localCohorts.push(updated);
        }
      }
      localStorage.setItem('chunks_firestore_synced_cohorts', JSON.stringify(localCohorts));
    } catch {}
  }

  // Invalidate in-memory caches
  invalidateCohortsCache();

  // Dispatch real-time cohort synchronization event for open components
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('chunks:cohorts-updated', {
        detail: { cohorts: matchingCohorts, courseLevel: courseLevelOrId }
      }));
    } catch (e) {
      console.warn('[Firestore] Error dispatching chunks:cohorts-updated:', e);
    }
  }
  return {
    updatedCount: updatedCohortIds.length,
    cohortIds: updatedCohortIds
  };
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

// --------------------------------------------------------------------------
// 7. Grammar Resource Management & Sync
// --------------------------------------------------------------------------
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_key, value) => {
    return value === undefined ? null : value;
  }));
}

export async function saveLessonGrammar(
  lessonId: string,
  grammar: LessonGrammar
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!lessonId) {
      return { success: false, error: 'lessonId is required' };
    }
    const cleanId = lessonId.trim();
    const docId = cleanId.startsWith('level_b_ere_day_') 
      ? cleanId.replace('level_b_ere_day_', 'level_b_day_')
      : cleanId;

    const sanitizedGrammar = sanitizeForFirestore(grammar);
    const docRef = doc(db, 'lessons', docId);

    await setDoc(
      docRef,
      {
        grammar: sanitizedGrammar,
        updated_at: new Date().toISOString()
      },
      { merge: true }
    );

    // Update in-memory registry immediately so all components see updates
    curriculumRegistry.updateLessonGrammar(docId, sanitizedGrammar);
    if (docId !== cleanId) {
      curriculumRegistry.updateLessonGrammar(cleanId, sanitizedGrammar);
    }

    // Invalidate caches
    invalidateLessonsCache('LEVEL_B');
    invalidateLessonsCache('course_level_b');
    memoryCache.delete(`lesson_by_id:${docId}`);
    memoryCache.delete(`lesson_by_id:${cleanId}`);

    return { success: true };
  } catch (err: any) {
    console.error(`[Firestore] saveLessonGrammar error for ${lessonId}:`, err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function getLessonGrammar(lessonId: string): Promise<LessonGrammar | null> {
  try {
    if (!lessonId) return null;
    const cleanId = lessonId.trim();
    const docId = cleanId.startsWith('level_b_ere_day_') 
      ? cleanId.replace('level_b_ere_day_', 'level_b_day_')
      : cleanId;

    let snap = await getDoc(doc(db, 'lessons', docId));
    if (snap.exists() && snap.data()?.grammar) {
      return snap.data().grammar as LessonGrammar;
    }
    if (docId !== cleanId) {
      snap = await getDoc(doc(db, 'lessons', cleanId));
      if (snap.exists() && snap.data()?.grammar) {
        return snap.data().grammar as LessonGrammar;
      }
    }
    return null;
  } catch (err) {
    console.warn(`[Firestore] getLessonGrammar error for ${lessonId}:`, err);
    return null;
  }
}

export async function getAllLevelBGrammarFromFirestore(): Promise<{
  success: boolean;
  grammarByDay: Record<number, LessonGrammar>;
  error?: string;
}> {
  try {
    const grammarByDay: Record<number, LessonGrammar> = {};
    const days = Array.from({ length: 30 }, (_, i) => i + 1);

    await Promise.all(
      days.map(async (day) => {
        const primaryDocId = `level_b_day_${day}`;
        try {
          let snap = await getDoc(doc(db, 'lessons', primaryDocId));
          if (snap.exists() && snap.data()?.grammar) {
            grammarByDay[day] = snap.data().grammar as LessonGrammar;
            return;
          }
          const fallbackDocId = `level_b_ere_day_${day}`;
          snap = await getDoc(doc(db, 'lessons', fallbackDocId));
          if (snap.exists() && snap.data()?.grammar) {
            grammarByDay[day] = snap.data().grammar as LessonGrammar;
          }
        } catch (fetchErr) {
          console.warn(`[Firestore] Could not load grammar for Day ${day}:`, fetchErr);
        }
      })
    );

    return {
      success: true,
      grammarByDay
    };
  } catch (err: any) {
    console.error('[Firestore] getAllLevelBGrammarFromFirestore error:', err);
    return {
      success: false,
      grammarByDay: {},
      error: err?.message || String(err)
    };
  }
}

export async function syncAllLevelBGrammarToFirestore(
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ success: boolean; totalSynced: number; error?: string }> {
  try {
    const total = CURRICULUM_CATALOG_LEVEL_B_ERE.length;
    let syncedCount = 0;

    for (let i = 0; i < total; i++) {
      const lesson = CURRICULUM_CATALOG_LEVEL_B_ERE[i];
      const docId = `level_b_day_${lesson.day_number}`;

      const existingGrammar = lesson.grammar || 
        curriculumRegistry.getGrammarByLessonId(docId) || 
        curriculumRegistry.getGrammarByLessonId(lesson.id);

      if (!existingGrammar) {
        onProgress?.(i + 1, total, `Bỏ qua Day ${lesson.day_number}: Không tìm thấy cấu trúc`);
        continue;
      }

      onProgress?.(
        i + 1,
        total,
        `Đang đồng bộ Day ${lesson.day_number} (${lesson.lesson_title})...`
      );

      const result = await saveLessonGrammar(docId, existingGrammar);
      if (!result.success) {
        throw new Error(`Lỗi đồng bộ ${docId}: ${result.error}`);
      }

      syncedCount++;
    }

    onProgress?.(total, total, `Đã đồng bộ thành công toàn bộ ${syncedCount} bài học ERE lên Firestore!`);
    return { success: true, totalSynced: syncedCount };
  } catch (err: any) {
    console.error('[Firestore] syncAllLevelBGrammarToFirestore error:', err);
    return { success: false, totalSynced: 0, error: err?.message || String(err) };
  }
}

// Aliases for backward compatibility
export const saveLessonToFirestore = saveLesson;
export const getFirestoreCohorts = getCohorts;
export const saveFirestoreCohort = saveCohort;
export const getFirestoreLessonById = getLessonById;
export const getFirestoreCourses = getCourses;
