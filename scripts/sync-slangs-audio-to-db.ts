import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
import { CURRICULUM_CATALOG_LEVEL_B_ERE } from "../src/data/levelBEreData";
import type { LessonDoc, ChunkItem } from "../src/types";
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBrH0sAU__R4k1IBrSYIF73fFdASeSpdE4",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "chunks-voicecloning-genshai.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "chunks-voicecloning-genshai",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "chunks-voicecloning-genshai.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "284566312743",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:284566312743:web:038f451f2fc5fa25d30cf8"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Target items to update: items 2, 4, 6, 8, 10
const TARGET_ITEM_NUMBERS: Record<number, true> = {
  2: true,
  4: true,
  6: true,
  8: true,
  10: true
};

async function syncSlangsAudio() {
  console.log("======================================================================");
  console.log("SYNC LEVEL B SLANGS AUDIO (150 EXAMPLES) TO FIRESTORE & LOCAL DATA");
  console.log("Project:", firebaseConfig.projectId);
  console.log("======================================================================");

  // Load manifest to verify target chunks
  const manifestPath = path.resolve(__dirname, "extracted-level-b-slangs-manifest.json");
  const manifest: Array<{ day_number: number; chunk_id: string; item_number: number }> = JSON.parse(
    fs.readFileSync(manifestPath, "utf8")
  );

  const manifestMap = new Map<string, { day_number: number; item_number: number }>();
  for (const m of manifest) {
    manifestMap.set(m.chunk_id, { day_number: m.day_number, item_number: m.item_number });
  }

  // Load local levelBEreData.ts catalog
  const levelBDataPath = path.resolve(__dirname, "../src/data/levelBEreData.ts");
  const localCatalog: LessonDoc[] = JSON.parse(JSON.stringify(CURRICULUM_CATALOG_LEVEL_B_ERE));
  const timestamp = Date.now();
  console.log(`Cache buster timestamp: v=${timestamp}`);

  let totalLocalUpdated = 0;
  let totalFirestoreUpdated = 0;

  for (let day = 1; day <= 30; day++) {
    const lessonId = `level_b_day_${day}`;
    console.log(`\n--- Processing Day ${day} (${lessonId}) ---`);

    // 1. Update local catalog
    const localLesson = localCatalog.find((l) => l.id === lessonId || l.day_number === day);
    if (!localLesson) {
      throw new Error(`Lesson ${lessonId} not found in local catalog!`);
    }

    let dayLocalUpdates = 0;
    for (const chunk of localLesson.chunks) {
      if (
        TARGET_ITEM_NUMBERS[chunk.item_number] &&
        (chunk.part === "Part 1 - Vietnamese Slangs" || chunk.category === "slang") &&
        manifestMap.has(chunk.chunk_id)
      ) {
        const newUrl = `https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/level_b/level_b_day_${day}/${chunk.chunk_id}_en.mp3?v=${timestamp}`;
        
        // Strictly verify Vietnamese audio URLs remain untouched
        const viBefore = {
          audio_url_vi: chunk.audio_url_vi,
          audio_url_tts_vi: chunk.audio_url_tts_vi,
          audio_url_human_vi: chunk.audio_url_human_vi
        };

        chunk.audio_url = newUrl;
        chunk.audio_url_tts = newUrl;
        chunk.audio_url_human = newUrl;

        // Invariant assertion: Vietnamese audio must remain 100% untouched
        if (
          chunk.audio_url_vi !== viBefore.audio_url_vi ||
          chunk.audio_url_tts_vi !== viBefore.audio_url_tts_vi ||
          chunk.audio_url_human_vi !== viBefore.audio_url_human_vi
        ) {
          throw new Error(`Vietnamese audio altered on chunk ${chunk.chunk_id}!`);
        }

        dayLocalUpdates++;
        totalLocalUpdated++;
      }
    }
    console.log(`  Local catalog: ${dayLocalUpdates}/5 example chunks updated for Day ${day}.`);

    // 2. Fetch and update Firestore doc
    const docRef = doc(db, "lessons", lessonId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error(`Firestore doc 'lessons/${lessonId}' does not exist!`);
    }

    const firestoreData = snap.data();
    const firestoreChunks: ChunkItem[] = firestoreData.chunks || [];
    let dayFirestoreUpdates = 0;

    for (const chunk of firestoreChunks) {
      if (
        TARGET_ITEM_NUMBERS[chunk.item_number] &&
        (chunk.part === "Part 1 - Vietnamese Slangs" || chunk.category === "slang") &&
        manifestMap.has(chunk.chunk_id)
      ) {
        const newUrl = `https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/level_b/level_b_day_${day}/${chunk.chunk_id}_en.mp3?v=${timestamp}`;

        const viBefore = {
          audio_url_vi: chunk.audio_url_vi,
          audio_url_tts_vi: chunk.audio_url_tts_vi,
          audio_url_human_vi: chunk.audio_url_human_vi
        };

        chunk.audio_url = newUrl;
        chunk.audio_url_tts = newUrl;
        chunk.audio_url_human = newUrl;

        // Invariant assertion
        if (
          chunk.audio_url_vi !== viBefore.audio_url_vi ||
          chunk.audio_url_tts_vi !== viBefore.audio_url_tts_vi ||
          chunk.audio_url_human_vi !== viBefore.audio_url_human_vi
        ) {
          throw new Error(`Vietnamese audio altered on Firestore chunk ${chunk.chunk_id}!`);
        }

        dayFirestoreUpdates++;
        totalFirestoreUpdated++;
      }
    }

    if (dayFirestoreUpdates !== 5) {
      console.warn(`  ⚠️ Warning: Day ${day} updated ${dayFirestoreUpdates} chunks in Firestore instead of expected 5.`);
    }

    await updateDoc(docRef, { chunks: firestoreChunks });
    console.log(`  Firestore: ${dayFirestoreUpdates}/5 example chunks successfully synced.`);
  }

  // 3. Write back local levelBEreData.ts
  console.log("\nWriting updated catalog to src/data/levelBEreData.ts...");
  const fileContent = `import { LessonDoc } from "../types";\n\nexport const CURRICULUM_CATALOG_LEVEL_B_ERE: LessonDoc[] = ${JSON.stringify(localCatalog, null, 2)};\n`;
  fs.writeFileSync(levelBDataPath, fileContent, "utf8");
  console.log("✅ src/data/levelBEreData.ts written successfully.");

  console.log("\n======================================================================");
  console.log(`SUMMARY:`);
  console.log(`- Local chunks updated: ${totalLocalUpdated}/150`);
  console.log(`- Firestore chunks updated: ${totalFirestoreUpdated}/150`);
  console.log("======================================================================");
}

syncSlangsAudio().catch((err) => {
  console.error("FATAL ERROR during sync:", err);
  process.exit(1);
});
