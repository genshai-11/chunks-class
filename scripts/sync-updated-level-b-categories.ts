import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, writeBatch } from "firebase/firestore";
import { CURRICULUM_CATALOG_LEVEL_B_ERE } from "../src/data/levelBEreData";
import { LessonDoc, ChunkItem } from "../src/types";

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

function updatePart1Chunks(chunks: ChunkItem[]): ChunkItem[] {
  return chunks.map(chunk => {
    const isPart1 = (chunk.part && chunk.part.includes("Part 1")) || (chunk.item_number >= 1 && chunk.item_number <= 10);
    if (!isPart1) return chunk;

    const isExample = chunk.item_number % 2 === 0 || /_e\d_/.test(chunk.raw_audio_en || "");
    const updated: ChunkItem = {
      ...chunk,
      category: "slang"
    };

    if (isExample) {
      updated.is_example = true;
      const notes = (updated.notes || "").trim();
      if (!notes) {
        updated.notes = "[Example Sentence]";
      } else if (!notes.includes("[Example Sentence]")) {
        updated.notes = `[Example Sentence] ${notes}`;
      }
    }

    return updated;
  });
}

async function syncUpdatedCategories() {
  console.log("==================================================");
  console.log("SYNC UPDATED LEVEL B PART 1 SLANG CATEGORIES TO FIRESTORE");
  console.log("Database Project:", firebaseConfig.projectId);
  console.log("==================================================");

  let totalUpdatedDocs = 0;
  let totalPart1ChunksProcessed = 0;

  const BATCH_SIZE = 10;
  let batch = writeBatch(db);
  let queuedInBatch = 0;
  let batchIndex = 1;

  for (let dayNum = 1; dayNum <= 30; dayNum++) {
    const seedLesson = CURRICULUM_CATALOG_LEVEL_B_ERE[dayNum - 1];
    const targetIds = [
      `level_b_day_${dayNum}`,
      `level_b_ere_day_${dayNum}`
    ];

    for (const docId of targetIds) {
      const docRef = doc(db, "lessons", docId);
      const snap = await getDoc(docRef);

      let lessonDoc: LessonDoc;
      if (snap.exists()) {
        const existingData = snap.data() as LessonDoc;
        const chunks = updatePart1Chunks(existingData.chunks || seedLesson.chunks);
        const categories = Array.from(new Set(chunks.map(c => c.category)));
        lessonDoc = {
          ...existingData,
          id: docId,
          total_chunks: chunks.length,
          categories,
          chunks
        };
      } else {
        const chunks = updatePart1Chunks(seedLesson.chunks);
        const categories = Array.from(new Set(chunks.map(c => c.category)));
        lessonDoc = {
          ...seedLesson,
          id: docId,
          course_id: docId.startsWith("level_b_ere_") ? "course_level_b_ere" : "course_level_b",
          level_code: "LEVEL_B",
          total_chunks: chunks.length,
          categories,
          chunks
        };
      }

      totalPart1ChunksProcessed += 10;
      batch.set(docRef, sanitizeForFirestore(lessonDoc), { merge: true });
      queuedInBatch++;
      totalUpdatedDocs++;

      console.log(`[Queued] ${docId}: ${lessonDoc.chunks.length} chunks, categories: [${lessonDoc.categories.join(", ")}]`);

      if (queuedInBatch >= BATCH_SIZE) {
        console.log(`\n--- Committing Batch ${batchIndex} (${queuedInBatch} documents) ---`);
        await batch.commit();
        console.log(`✅ Batch ${batchIndex} committed successfully.\n`);
        batch = writeBatch(db);
        queuedInBatch = 0;
        batchIndex++;
      }
    }
  }

  if (queuedInBatch > 0) {
    console.log(`\n--- Committing Final Batch ${batchIndex} (${queuedInBatch} documents) ---`);
    await batch.commit();
    console.log(`✅ Final Batch ${batchIndex} committed successfully.\n`);
  }

  console.log("==================================================");
  console.log(`🎉 ALL DONE: Successfully updated ${totalUpdatedDocs} lesson docs in Firestore.`);
  console.log(`Part 1 chunks updated to category 'slang': ${totalPart1ChunksProcessed}`);
  console.log("==================================================");
  process.exit(0);
}

syncUpdatedCategories().catch(err => {
  console.error("❌ Error syncing categories to Firestore:", err);
  process.exit(1);
});
