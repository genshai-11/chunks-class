import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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

async function verifyFirestoreEre() {
  console.log("==================================================");
  console.log("VERIFY FIRESTORE: Level B - ERE (30 Topics)");
  console.log("Database Project:", firebaseConfig.projectId);
  console.log("==================================================");

  // 1. Verify Course document
  console.log("\n1. Verifying 'courses/course_level_b_ere'...");
  const courseRef = doc(db, "courses", "course_level_b_ere");
  const courseSnap = await getDoc(courseRef);
  if (!courseSnap.exists()) {
    throw new Error("Course 'courses/course_level_b_ere' does not exist in Firestore!");
  }
  const courseData = courseSnap.data();
  console.log("   ✅ Course exists:", {
    id: courseData.id,
    level_code: courseData.level_code,
    title: courseData.title,
    total_days: courseData.total_days,
    total_chunks: courseData.total_chunks
  });

  // 2. Verify all 30 Lessons
  console.log("\n2. Verifying all 30 lesson documents in 'lessons' collection...");
  let verifiedLessonsCount = 0;
  let verifiedChunksCount = 0;

  for (let day = 1; day <= 30; day++) {
    const lessonId = `level_b_ere_day_${day}`;
    const lessonRef = doc(db, "lessons", lessonId);
    const lessonSnap = await getDoc(lessonRef);
    
    if (!lessonSnap.exists()) {
      throw new Error(`Lesson '${lessonId}' does not exist in Firestore!`);
    }

    const data = lessonSnap.data();
    const chunks = Array.isArray(data.chunks) ? data.chunks : [];

    if (chunks.length !== 105) {
      throw new Error(`Lesson '${lessonId}' has ${chunks.length} chunks, expected 105!`);
    }

    verifiedLessonsCount++;
    verifiedChunksCount += chunks.length;

    if (day === 1 || day === 12 || day === 27 || day === 30) {
      const sample = chunks[0];
      console.log(`   Day ${day} ("${data.lesson_title}"): ${chunks.length} chunks. Sample chunk #1: [${sample.category}] "${sample.english}" / "${sample.vietnamese}"`);
    }
  }

  // 3. Verify Cohort document 'cohorts/cohort_level_b_ere_k30'
  console.log("\n3. Verifying 'cohorts/cohort_level_b_ere_k30'...");
  const cohortRef = doc(db, "cohorts", "cohort_level_b_ere_k30");
  const cohortSnap = await getDoc(cohortRef);
  if (!cohortSnap.exists()) {
    throw new Error("Cohort 'cohorts/cohort_level_b_ere_k30' does not exist in Firestore!");
  }
  const cohortData = cohortSnap.data();
  console.log("   ✅ Cohort exists:", {
    id: cohortData.id,
    level_code: cohortData.level_code,
    course_id: cohortData.course_id,
    title: cohortData.title,
    total_sessions: cohortData.total_sessions,
    sessions_length: Array.isArray(cohortData.sessions) ? cohortData.sessions.length : 0
  });

  if (cohortData.total_sessions !== 30) {
    throw new Error(`Expected cohort total_sessions to be 30, got ${cohortData.total_sessions}`);
  }
  if (!Array.isArray(cohortData.sessions) || cohortData.sessions.length !== 30) {
    throw new Error(`Expected cohort sessions array to have length 30, got ${cohortData.sessions?.length}`);
  }
  if (cohortData.sessions[0].day_number !== 1 || cohortData.sessions[29].day_number !== 30) {
    throw new Error(`Session day_numbers mismatch! Session 1 day: ${cohortData.sessions[0].day_number}, Session 30 day: ${cohortData.sessions[29].day_number}`);
  }
  if (cohortData.sessions[0].status !== 'in_progress') {
    throw new Error(`Expected session 1 status to be 'in_progress', got '${cohortData.sessions[0].status}'`);
  }
  console.log(`   Session 1: [${cohortData.sessions[0].scheduled_date} ${cohortData.sessions[0].day_of_week}] ${cohortData.sessions[0].lesson_title} (status: ${cohortData.sessions[0].status})`);
  console.log(`   Session 30: [${cohortData.sessions[29].scheduled_date} ${cohortData.sessions[29].day_of_week}] ${cohortData.sessions[29].lesson_title} (status: ${cohortData.sessions[29].status})`);

  console.log("\n==================================================");
  console.log(`✅ VERIFICATION SUCCESSFUL!`);
  console.log(`- Course: ${courseData.title} (${courseData.id})`);
  console.log(`- Total Lessons Verified: ${verifiedLessonsCount}/30`);
  console.log(`- Total Chunks Verified: ${verifiedChunksCount}/3,150`);
  console.log(`- Cohort Verified: ${cohortData.title} (${cohortData.sessions.length} sessions)`);
  console.log("==================================================");
}

verifyFirestoreEre()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  });
