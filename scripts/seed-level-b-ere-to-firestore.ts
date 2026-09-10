import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, writeBatch } from "firebase/firestore";
import { CURRICULUM_CATALOG_LEVEL_B_ERE } from "../src/data/levelBEreData";
import { Course, LessonDoc } from "../src/types";

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

function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    return value === undefined ? null : value;
  }));
}

async function seedLevelBEreToFirestore() {
  console.log("==================================================");
  console.log("SEED LEVEL B - ERE (30 TOPICS) TO FIRESTORE");
  console.log("Database Project:", firebaseConfig.projectId);
  console.log("==================================================");

  const totalChunks = CURRICULUM_CATALOG_LEVEL_B_ERE.reduce(
    (sum, l) => sum + (l.total_chunks || l.chunks.length),
    0
  );

  const courseEre: Course = {
    id: "course_level_b_ere",
    level_code: "LEVEL_B_ERE",
    title: "Level B - ERE (English Reflexes Enhancement)",
    description: "30 Topics of Comprehensive Spoken Reflexes with 3,150 conversational, vocabulary, and workplace chunks.",
    total_days: CURRICULUM_CATALOG_LEVEL_B_ERE.length,
    total_chunks: totalChunks,
    default_sessions_count: 30,
    source: "Genshai ERE 30-Topic Curriculum",
    is_active: true
  };

  console.log(`\n1. Writing Course Document: 'courses/${courseEre.id}'...`);
  console.log(`   Title: ${courseEre.title}`);
  console.log(`   Total Days: ${courseEre.total_days}, Total Chunks: ${courseEre.total_chunks}`);

  await setDoc(doc(db, "courses", courseEre.id), sanitizeForFirestore(courseEre), { merge: true });
  console.log(`   ✅ Course '${courseEre.id}' written successfully.`);

  console.log(`\n2. Writing ${CURRICULUM_CATALOG_LEVEL_B_ERE.length} Lessons to 'lessons' collection...`);

  const BATCH_SIZE = 10;
  const totalLessons = CURRICULUM_CATALOG_LEVEL_B_ERE.length;
  let syncedLessonsCount = 0;
  let syncedChunksCount = 0;

  for (let i = 0; i < totalLessons; i += BATCH_SIZE) {
    const chunkBatch = CURRICULUM_CATALOG_LEVEL_B_ERE.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(totalLessons / BATCH_SIZE);

    console.log(`\n--- Preparing Batch ${batchNum}/${totalBatches} (${chunkBatch.length} lessons) ---`);

    for (const lesson of chunkBatch) {
      const lessonDoc: LessonDoc = {
        ...lesson,
        total_chunks: lesson.chunks.length,
        categories: Array.from(new Set(lesson.chunks.map(c => c.category)))
      };

      const sanitized = sanitizeForFirestore(lessonDoc);
      const lessonRef = doc(db, "lessons", sanitized.id);
      batch.set(lessonRef, sanitized, { merge: true });

      syncedLessonsCount++;
      syncedChunksCount += sanitized.chunks.length;
      console.log(`   + [Batch ${batchNum}] Queued ${sanitized.id} (Day ${sanitized.day_number}): ${sanitized.chunks.length} chunks ("${sanitized.lesson_title}")`);
    }

    console.log(`   Committing Batch ${batchNum}...`);
    await batch.commit();
    console.log(`   ✅ Batch ${batchNum} committed successfully.`);
  }

  console.log("\n==================================================");
  console.log(`🎉 ALL DONE: Successfully seeded course '${courseEre.id}' and ${syncedLessonsCount} lessons with ${syncedChunksCount} chunks.`);
  console.log("==================================================");
}

seedLevelBEreToFirestore()
  .then(() => {
    console.log("Script completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
