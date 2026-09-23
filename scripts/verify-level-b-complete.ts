import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { curriculumRegistry } from "../src/services/curriculumRegistry";
import { Course, LessonDoc, Cohort } from "../src/types";

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
  console.log("==================================================");
  console.log("VERIFICATION: LEVEL B 30-TOPIC CANONICAL ARCHITECTURE");
  console.log("==================================================");

  let errors: string[] = [];

  // 1. In-memory CurriculumRegistry Verification
  console.log("\n[TEST 1] Testing In-Memory Curriculum Registry...");
  const regCourse = curriculumRegistry.getCourse("course_level_b");
  if (!regCourse) {
    errors.push("curriculumRegistry.getCourse('course_level_b') returned null");
  } else {
    console.log(`  ✅ Registry Course: "${regCourse.title}" | Days: ${regCourse.total_days} | Chunks: ${regCourse.total_chunks}`);
    if (regCourse.total_days !== 30) errors.push(`Expected 30 days in registry course, got ${regCourse.total_days}`);
    if (regCourse.total_chunks !== 3150) errors.push(`Expected 3150 chunks in registry course, got ${regCourse.total_chunks}`);
  }

  const regLessons = curriculumRegistry.getLessons("course_level_b");
  console.log(`  ✅ Registry Lessons for 'course_level_b': ${regLessons.length} lessons`);
  if (regLessons.length !== 30) {
    errors.push(`Expected 30 lessons in registry for course_level_b, got ${regLessons.length}`);
  }

  const regDay1 = curriculumRegistry.getLessonById("level_b_day_1");
  const regAliasDay1 = curriculumRegistry.getLessonById("level_b_ere_day_1");
  if (!regDay1) errors.push("curriculumRegistry.getLessonById('level_b_day_1') is undefined");
  if (!regAliasDay1) errors.push("curriculumRegistry.getLessonById('level_b_ere_day_1') is undefined");
  if (regDay1 && regAliasDay1 && regDay1.lesson_title === regAliasDay1.lesson_title) {
    console.log(`  ✅ Alias Resolution: 'level_b_day_1' & 'level_b_ere_day_1' resolve to: "${regDay1.lesson_title}" (${regDay1.chunks.length} chunks)`);
  }

  // 2. Firestore Course Document
  console.log("\n[TEST 2] Testing Firestore Course Document 'courses/course_level_b'...");
  const courseSnap = await getDoc(doc(db, "courses", "course_level_b"));
  if (!courseSnap.exists()) {
    errors.push("Firestore document 'courses/course_level_b' does not exist");
  } else {
    const courseData = courseSnap.data() as Course;
    console.log(`  ✅ Firestore Course: "${courseData.title}" | Level: ${courseData.level_code}`);
    console.log(`     Total Days: ${courseData.total_days} | Total Chunks: ${courseData.total_chunks}`);
    if (courseData.level_code !== "LEVEL_B") errors.push(`Expected level_code LEVEL_B, got ${courseData.level_code}`);
    if (courseData.total_days !== 30) errors.push(`Expected 30 days, got ${courseData.total_days}`);
  }

  // 3. Firestore Lessons for LEVEL_B
  console.log("\n[TEST 3] Testing Firestore Lessons for LEVEL_B...");
  const lessonsQ = query(collection(db, "lessons"), where("level_code", "==", "LEVEL_B"));
  const lessonsSnap = await getDocs(lessonsQ);
  console.log(`  ✅ Found ${lessonsSnap.size} lesson documents matching level_code == 'LEVEL_B'`);

  // Check level_b_day_1 through 30 specifically
  let missingDays: number[] = [];
  for (let d = 1; d <= 30; d++) {
    const dayDoc = await getDoc(doc(db, "lessons", `level_b_day_${d}`));
    if (!dayDoc.exists()) {
      missingDays.push(d);
    } else {
      const data = dayDoc.data() as LessonDoc;
      if (!data.chunks || data.chunks.length !== 105) {
        errors.push(`level_b_day_${d} has ${data.chunks?.length || 0} chunks (expected 105)`);
      }
    }
  }
  if (missingDays.length > 0) {
    errors.push(`Missing Firestore lesson docs: ${missingDays.map(d => `level_b_day_${d}`).join(", ")}`);
  } else {
    console.log(`  ✅ All 30 canonical lessons ('level_b_day_1'..'30') exist in Firestore with 105 chunks each!`);
  }

  // 4. Firestore Cohort cohort_level_b_k30
  console.log("\n[TEST 4] Testing Firestore Cohort 'cohorts/cohort_level_b_k30'...");
  const cohortSnap = await getDoc(doc(db, "cohorts", "cohort_level_b_k30"));
  if (!cohortSnap.exists()) {
    errors.push("Firestore document 'cohorts/cohort_level_b_k30' does not exist");
  } else {
    const cohort = cohortSnap.data() as Cohort;
    console.log(`  ✅ Cohort Name: "${cohort.title}"`);
    console.log(`     Course ID: ${cohort.course_id} | Level: ${cohort.level_code}`);
    console.log(`     Total Sessions: ${cohort.total_sessions} (${cohort.sessions?.length} items in array)`);
    console.log(`     First: Session 1 -> ${cohort.sessions?.[0]?.lesson_id} ("${cohort.sessions?.[0]?.lesson_title}") on ${cohort.sessions?.[0]?.scheduled_date}`);
    console.log(`     Last:  Session 30 -> ${cohort.sessions?.[29]?.lesson_id} ("${cohort.sessions?.[29]?.lesson_title}") on ${cohort.sessions?.[29]?.scheduled_date}`);
    if (cohort.total_sessions !== 30) errors.push(`Expected total_sessions 30, got ${cohort.total_sessions}`);
    if (cohort.sessions?.length !== 30) errors.push(`Expected sessions.length 30, got ${cohort.sessions?.length}`);
    if (cohort.sessions?.[0]?.lesson_id !== "level_b_day_1") errors.push(`Session 1 mapped to ${cohort.sessions?.[0]?.lesson_id}, expected level_b_day_1`);
  }

  console.log("\n==================================================");
  if (errors.length === 0) {
    console.log("🎉 ALL VERIFICATION CHECKS PASSED WITH 100% ACCURACY!");
    console.log("==================================================");
    process.exit(0);
  } else {
    console.error(`❌ VERIFICATION ENCOUNTERED ${errors.length} ERRORS:`);
    errors.forEach((e, idx) => console.error(`  ${idx + 1}. ${e}`));
    console.log("==================================================");
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error("Verification script crashed:", err);
  process.exit(1);
});
