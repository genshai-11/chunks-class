import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, writeBatch } from "firebase/firestore";
import { CURRICULUM_CATALOG_LEVEL_B_EREL } from "../src/data/levelBErelData";
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

async function syncErelToFirestore() {
  console.log("==================================================");
  console.log("SYNC EREL CURRICULUM TO FIRESTORE");
  console.log("Project:", firebaseConfig.projectId);
  console.log("==================================================");

  const totalChunks = CURRICULUM_CATALOG_LEVEL_B_EREL.reduce(
    (sum, l) => sum + (l.total_chunks || l.chunks.length),
    0
  );

  const courseErel: Course = {
    id: "course_level_b_erel",
    level_code: "LEVEL_B_EREL",
    title: "Level B - EREL (English Reflexes Enhancement for Listening)",
    description: "15 Days of Emotional Reflexes & Movie Shadowing with 2,381 deep listening dialogues and reflex chunks.",
    total_days: CURRICULUM_CATALOG_LEVEL_B_EREL.length,
    total_chunks: totalChunks,
    default_sessions_count: 15,
    source: "Genshai EREL Listening Curriculum",
    is_active: true
  };

  console.log(`\n1. Syncing Course Document: 'courses/${courseErel.id}'...`);
  console.log(`   Title: ${courseErel.title}`);
  console.log(`   Total Days: ${courseErel.total_days}, Total Chunks: ${courseErel.total_chunks}`);

  await setDoc(doc(db, "courses", courseErel.id), sanitizeForFirestore(courseErel), { merge: true });
  console.log(`   ✅ Course '${courseErel.id}' synced successfully.`);

  console.log(`\n2. Syncing ${CURRICULUM_CATALOG_LEVEL_B_EREL.length} Lessons to 'lessons' collection...`);

  const batch = writeBatch(db);
  let syncedLessonsCount = 0;
  let syncedChunksCount = 0;

  for (const lesson of CURRICULUM_CATALOG_LEVEL_B_EREL) {
    const lessonDoc: LessonDoc = {
      ...lesson,
      title: lesson.lesson_title,
      total_chunks: lesson.chunks.length,
      categories: Array.from(new Set(lesson.chunks.map(c => c.category)))
    };

    const sanitized = sanitizeForFirestore(lessonDoc);
    const lessonRef = doc(db, "lessons", sanitized.id);
    batch.set(lessonRef, sanitized, { merge: true });

    syncedLessonsCount++;
    syncedChunksCount += sanitized.chunks.length;
    console.log(`   - Queued ${sanitized.id} (Day ${sanitized.day_number}): ${sanitized.chunks.length} chunks ("${sanitized.lesson_title}")`);
  }

  console.log(`\nCommitting batch write to Firestore (${syncedLessonsCount} documents)...`);
  await batch.commit();
  console.log(`✅ Batch commit complete! Synced ${syncedLessonsCount} lessons with ${syncedChunksCount} chunks.`);
}

syncErelToFirestore()
  .then(() => {
    console.log("\nSync finished successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Sync failed:", err);
    process.exit(1);
  });
