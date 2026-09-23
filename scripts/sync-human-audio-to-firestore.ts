import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { CURRICULUM_CATALOG_LEVEL_B_ERE } from "../src/data/levelBEreData";

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

async function syncHumanAudioToFirestore() {
  console.log("==================================================");
  console.log("SYNC DUAL-LAYER HUMAN & TTS AUDIO TO FIRESTORE");
  console.log("Target: Firestore /lessons (level_b_day_1 .. level_b_day_30)");
  console.log("Project:", firebaseConfig.projectId);
  console.log("Total Lessons:", CURRICULUM_CATALOG_LEVEL_B_ERE.length);
  console.log("==================================================\n");

  let totalChunksSynced = 0;
  const startTime = Date.now();

  for (let i = 0; i < CURRICULUM_CATALOG_LEVEL_B_ERE.length; i++) {
    const lesson = CURRICULUM_CATALOG_LEVEL_B_ERE[i];
    const docId = lesson.id || `level_b_day_${lesson.day_number}`;
    const lessonRef = doc(db, "lessons", docId);

    const payload = sanitizeForFirestore({
      chunks: lesson.chunks,
      total_chunks: lesson.chunks.length,
      updated_at: new Date().toISOString()
    });

    console.log(`[${i + 1}/${CURRICULUM_CATALOG_LEVEL_B_ERE.length}] Syncing ${docId} (Day ${lesson.day_number}: "${lesson.lesson_title}")...`);

    try {
      await setDoc(lessonRef, payload, { merge: true });
      totalChunksSynced += lesson.chunks.length;
      console.log(`   ✅ Synced ${docId}: ${lesson.chunks.length} chunks (Human & TTS Dual-Layer Active)`);
    } catch (err: any) {
      console.error(`   ❌ Failed to sync ${docId}:`, err?.message || String(err));
      throw err;
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n==================================================");
  console.log(`🎉 SUCCESS: All ${CURRICULUM_CATALOG_LEVEL_B_ERE.length} lessons synced to Firestore in ${durationSec}s!`);
  console.log(`Total chunks updated with Human & TTS audio: ${totalChunksSynced}`);
  console.log("==================================================");
}

syncHumanAudioToFirestore()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Fatal sync error:", err);
    process.exit(1);
  });
