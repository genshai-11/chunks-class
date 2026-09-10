import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { getLessonsByLevel, getAllLessons, getFirestoreCohorts } from "../src/services/firestoreService";

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

async function runFinalVerification() {
  console.log("==================================================================");
  console.log("FINAL VERIFICATION: LEVEL B DEDUPLICATION & COHORT RESEEDING");
  console.log("==================================================================");

  let errors: string[] = [];

  // 1. Direct Firestore query where level_code == 'LEVEL_B'
  console.log("\n[VERIFICATION 1] Direct Firestore collection('lessons') query for level_code == 'LEVEL_B'...");
  const rawQ = query(collection(db, "lessons"), where("level_code", "==", "LEVEL_B"));
  const rawSnap = await getDocs(rawQ);
  console.log(`  Found ${rawSnap.size} documents in Firestore with level_code == 'LEVEL_B'.`);
  if (rawSnap.size !== 30) {
    errors.push(`Expected exactly 30 documents with level_code == 'LEVEL_B', found ${rawSnap.size}`);
  }
  const rawIds = rawSnap.docs.map(d => d.id).sort();
  console.log(`  First doc ID: ${rawIds[0]}, Last doc ID: ${rawIds[rawIds.length - 1]}`);
  for (let d = 1; d <= 30; d++) {
    const expectedId = `level_b_day_${d}`;
    if (!rawIds.includes(expectedId)) {
      errors.push(`Missing canonical lesson in Firestore: ${expectedId}`);
    }
  }

  // 2. getLessonsByLevel('LEVEL_B')
  console.log("\n[VERIFICATION 2] Testing firestoreService.getLessonsByLevel('LEVEL_B')...");
  const lessons = await getLessonsByLevel("LEVEL_B", true);
  console.log(`  Returned ${lessons.length} lessons.`);
  if (lessons.length !== 30) {
    errors.push(`Expected getLessonsByLevel('LEVEL_B') to return 30 lessons, got ${lessons.length}`);
  }

  const seenDays = new Set<number>();
  let duplicateCount = 0;
  lessons.forEach((l, idx) => {
    if (seenDays.has(l.day_number)) {
      duplicateCount++;
      errors.push(`Duplicate day found in getLessonsByLevel: Day ${l.day_number} (${l.id})`);
    }
    seenDays.add(l.day_number);

    const expectedDay = idx + 1;
    if (l.day_number !== expectedDay) {
      errors.push(`Index ${idx} has day_number ${l.day_number}, expected ${expectedDay}`);
    }
    if (l.id !== `level_b_day_${expectedDay}`) {
      errors.push(`Index ${idx} has id '${l.id}', expected 'level_b_day_${expectedDay}'`);
    }
  });

  if (duplicateCount === 0 && lessons.length === 30) {
    console.log("  ✅ getLessonsByLevel('LEVEL_B') returned EXACTLY 30 unique lessons (Days 1 to 30) with ZERO duplicates!");
  }

  // 3. getAllLessons('LEVEL_B')
  console.log("\n[VERIFICATION 3] Testing firestoreService.getAllLessons('LEVEL_B')...");
  const allLessons = await getAllLessons("LEVEL_B", true);
  console.log(`  Returned ${allLessons.length} lessons.`);
  if (allLessons.length !== 30) {
    errors.push(`Expected getAllLessons('LEVEL_B') to return 30 lessons, got ${allLessons.length}`);
  } else {
    console.log("  ✅ getAllLessons('LEVEL_B') returned EXACTLY 30 unique lessons with ZERO duplicates!");
  }

  // 4. getFirestoreCohorts()
  console.log("\n[VERIFICATION 4] Testing firestoreService.getFirestoreCohorts()...");
  const cohorts = await getFirestoreCohorts(undefined, true);
  const targetCohorts = ["cohort_level_b_k30", "cohort_level_b_ere_k30"];

  for (const cId of targetCohorts) {
    const cohort = cohorts.find(c => c.id === cId);
    if (!cohort) {
      errors.push(`Cohort '${cId}' not found in getFirestoreCohorts()`);
      continue;
    }

    console.log(`\n  Checking Cohort '${cohort.id}':`);
    console.log(`    Title: "${cohort.title}"`);
    console.log(`    Level: ${cohort.level_code} | Course: ${cohort.course_id}`);
    console.log(`    Total Sessions: ${cohort.total_sessions} (${cohort.sessions?.length} in array)`);

    if (cohort.total_sessions !== 30) {
      errors.push(`${cohort.id}: total_sessions is ${cohort.total_sessions}, expected 30`);
    }
    if (!cohort.sessions || cohort.sessions.length !== 30) {
      errors.push(`${cohort.id}: sessions.length is ${cohort.sessions?.length}, expected 30`);
      continue;
    }

    // Check strict sequence
    let isStrictlySequential = true;
    for (let i = 0; i < 30; i++) {
      const s = cohort.sessions[i];
      const expectedDay = i + 1;
      if (s.session_number !== expectedDay || s.day_number !== expectedDay) {
        isStrictlySequential = false;
        errors.push(`${cohort.id}: session ${i + 1} has day_number ${s.day_number}, session_number ${s.session_number}`);
      }
      if (s.lesson_id !== `level_b_day_${expectedDay}`) {
        isStrictlySequential = false;
        errors.push(`${cohort.id}: session ${i + 1} has lesson_id '${s.lesson_id}', expected 'level_b_day_${expectedDay}'`);
      }
    }

    if (isStrictlySequential) {
      console.log(`    ✅ Sessions are in STRICT SEQUENCE from Day 1 to Day 30:`);
      console.log(`       Session 1:  [${cohort.sessions[0].scheduled_date} ${cohort.sessions[0].day_of_week}] ${cohort.sessions[0].lesson_id} - "${cohort.sessions[0].lesson_title}" [${cohort.sessions[0].status}]`);
      console.log(`       Session 15: [${cohort.sessions[14].scheduled_date} ${cohort.sessions[14].day_of_week}] ${cohort.sessions[14].lesson_id} - "${cohort.sessions[14].lesson_title}" [${cohort.sessions[14].status}]`);
      console.log(`       Session 30: [${cohort.sessions[29].scheduled_date} ${cohort.sessions[29].day_of_week}] ${cohort.sessions[29].lesson_id} - "${cohort.sessions[29].lesson_title}" [${cohort.sessions[29].status}]`);
    }
  }

  console.log("\n==================================================================");
  if (errors.length === 0) {
    console.log("🎉 ALL FINAL VERIFICATION CHECKS PASSED WITH ZERO ERRORS!");
    console.log("==================================================================");
    process.exit(0);
  } else {
    console.error(`❌ Final verification encountered ${errors.length} errors:`);
    errors.forEach((e, idx) => console.error(`  ${idx + 1}. ${e}`));
    console.log("==================================================================");
    process.exit(1);
  }
}

runFinalVerification().catch(err => {
  console.error("Verification crashed:", err);
  process.exit(1);
});
