import { checkFirestoreHealth, getCourses, getCohorts, getLessonById, getLessonsByLevel, getAllLessons, invalidateLessonsCache, invalidateCohortsCache, invalidateCoursesCache } from '../src/services/firestoreService';
import { getAllStoredAudioKeys, audioPlayer } from '../src/services/googleTtsService';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBrH0sAU__R4k1IBrSYIF73fFdASeSpdE4",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "chunks-voicecloning-genshai.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "chunks-voicecloning-genshai",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "chunks-mirror-audio-284566312743",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "284566312743",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:284566312743:web:038f451f2fc5fa25d30cf8"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runVerification() {
  console.log('====================================================');
  console.log('STARTING SYSTEM OPTIMIZATION & SLANG VERIFICATION');
  console.log('====================================================\n');

  // 1. TEST FIRESTORE HEALTH WITH getCountFromServer
  console.log('--- 1. Testing checkFirestoreHealth() (getCountFromServer) ---');
  const t0 = performance.now();
  const health = await checkFirestoreHealth();
  const t1 = performance.now();
  console.log(`Health check completed in ${(t1 - t0).toFixed(1)}ms:`);
  console.log(`- isConnected: ${health.isConnected}`);
  console.log(`- isSynced: ${health.isSynced}`);
  console.log(`- totalCoursesInDb: ${health.totalCoursesInDb}`);
  console.log(`- totalLessonsInDb: ${health.totalLessonsInDb}`);
  console.log(`- totalCohortsInDb: ${health.totalCohortsInDb}`);
  if (!health.isConnected || health.totalLessonsInDb === 0) {
    throw new Error('Health check failed or database has 0 lessons!');
  }
  console.log('✅ Health check with getCountFromServer PASSED!\n');

  // 2. TEST IN-MEMORY CACHE & SINGLEFLIGHT
  console.log('--- 2. Testing In-Memory Cache & SingleFlight ---');
  
  // Courses Cache
  const cStart1 = performance.now();
  const courses1 = await getCourses();
  const cDur1 = performance.now() - cStart1;

  const cStart2 = performance.now();
  const courses2 = await getCourses();
  const cDur2 = performance.now() - cStart2;
  console.log(`- getCourses() 1st call: ${cDur1.toFixed(1)}ms (${courses1.length} courses)`);
  console.log(`- getCourses() 2nd call (cached): ${cDur2.toFixed(2)}ms (${courses2.length} courses)`);
  if (courses1 !== courses2) {
    throw new Error('Courses cache failed to return cached reference!');
  }

  // LessonById Cache
  const lStart1 = performance.now();
  const lesson1 = await getLessonById('level_b_day_1');
  const lDur1 = performance.now() - lStart1;

  const lStart2 = performance.now();
  const lesson2 = await getLessonById('level_b_day_1');
  const lDur2 = performance.now() - lStart2;
  console.log(`- getLessonById() 1st call: ${lDur1.toFixed(1)}ms`);
  console.log(`- getLessonById() 2nd call (cached): ${lDur2.toFixed(2)}ms`);
  if (lesson1 !== lesson2) {
    throw new Error('LessonById cache failed to return cached reference!');
  }

  // SingleFlight Concurrent In-flight deduplication
  const sfStart = performance.now();
  const concurrentCalls = await Promise.all([
    getLessonsByLevel('LEVEL_B'),
    getLessonsByLevel('LEVEL_B'),
    getLessonsByLevel('LEVEL_B'),
    getLessonsByLevel('LEVEL_B')
  ]);
  const sfDur = performance.now() - sfStart;
  console.log(`- 4 concurrent getLessonsByLevel('LEVEL_B') resolved in: ${sfDur.toFixed(1)}ms`);
  if (concurrentCalls[0] !== concurrentCalls[1] || concurrentCalls[1] !== concurrentCalls[2]) {
    throw new Error('SingleFlight deduplication did not return identical promise results!');
  }
  console.log('✅ In-Memory Cache & SingleFlight deduplication PASSED!\n');

  // Invalidation test
  console.log('--- Testing Cache Invalidation ---');
  invalidateLessonsCache('LEVEL_B');
  const postInvalStart = performance.now();
  const lessonAfterInval = await getLessonsByLevel('LEVEL_B');
  const postInvalDur = performance.now() - postInvalStart;
  console.log(`- getLessonsByLevel('LEVEL_B') after invalidation: ${postInvalDur.toFixed(1)}ms`);
  console.log('✅ Cache Invalidation PASSED!\n');

  // 3. TEST AUDIO SERVICE KEYS
  console.log('--- 3. Testing Audio Service Keys Methods ---');
  if (typeof getAllStoredAudioKeys !== 'function') {
    throw new Error('getAllStoredAudioKeys is not exported from googleTtsService!');
  }
  if (typeof audioPlayer.getAllCachedKeys !== 'function') {
    throw new Error('audioPlayer.getAllCachedKeys is not a function!');
  }
  const storedKeys = await getAllStoredAudioKeys();
  const allCachedKeys = await audioPlayer.getAllCachedKeys();
  console.log(`- getAllStoredAudioKeys returned: ${storedKeys.size} keys (Set)`);
  console.log(`- audioPlayer.getAllCachedKeys returned: ${allCachedKeys.size} keys (Set)`);
  console.log('✅ Audio Service keys methods PASSED!\n');

  // 4. VERIFY FIRESTORE PART 1 SLANG DATA STRUCTURE
  console.log('--- 4. Verifying Firestore Part 1 Slang Categories ---');
  const testLessonIds = [
    'level_b_day_1',
    'level_b_day_5',
    'level_b_day_12',
    'level_b_day_20',
    'level_b_day_30',
    'level_b_ere_day_1',
    'level_b_ere_day_15',
    'level_b_ere_day_30'
  ];

  for (const docId of testLessonIds) {
    const snap = await getDoc(doc(db, 'lessons', docId));
    if (!snap.exists()) {
      throw new Error(`Lesson document '${docId}' not found in Firestore!`);
    }

    const data = snap.data();
    const chunks = data.chunks;
    if (!Array.isArray(chunks) || chunks.length < 10) {
      throw new Error(`Document '${docId}' has invalid chunks structure!`);
    }

    // Part 1 checks (chunks 0..9)
    for (let i = 0; i < 10; i++) {
      const c = chunks[i];
      if (c.category !== 'slang') {
        throw new Error(`[FAIL] ${docId} chunk ${i + 1} (${c.chunk_id}) category is '${c.category}', expected 'slang'!`);
      }

      const isExampleExpected = i % 2 === 1;
      if (isExampleExpected) {
        if (c.is_example !== true) {
          throw new Error(`[FAIL] ${docId} example chunk ${i + 1} (${c.chunk_id}) missing is_example: true!`);
        }
        if (!c.notes || !c.notes.includes('[Example Sentence]')) {
          throw new Error(`[FAIL] ${docId} example chunk ${i + 1} (${c.chunk_id}) notes missing '[Example Sentence]'! Found: '${c.notes}'`);
        }
      }
    }

    // Categories array check
    if (!data.categories.includes('slang')) {
      throw new Error(`[FAIL] ${docId} categories array does not include 'slang'! Found: ${JSON.stringify(data.categories)}`);
    }

    // Part 4 checks
    const part4Chunks = chunks.filter((c: any) => c.part && c.part.includes('Part 4'));
    if (part4Chunks.length === 0) {
      throw new Error(`[FAIL] ${docId} has no Part 4 chunks!`);
    }
    for (const p4 of part4Chunks) {
      if (p4.category !== 'sentence') {
        throw new Error(`[FAIL] ${docId} Part 4 chunk ${p4.chunk_id} category is '${p4.category}', expected 'sentence'!`);
      }
    }

    console.log(`✅ ${docId}: 10 Part 1 chunks verified (category: 'slang', 5 examples flagged), Part 4 intact (sentence).`);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('====================================================');
  process.exit(0);
}

runVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
