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

  console.log("\n==================================================");
  console.log(`✅ VERIFICATION SUCCESSFUL!`);
  console.log(`- Course: ${courseData.title} (${courseData.id})`);
  console.log(`- Total Lessons Verified: ${verifiedLessonsCount}/30`);
  console.log(`- Total Chunks Verified: ${verifiedChunksCount}/3,150`);
  console.log("==================================================");
}

verifyFirestoreEre()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  });
