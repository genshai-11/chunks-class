import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { CURRICULUM_CATALOG_LEVEL_B_ERE } from "../src/data/levelBEreData";
import { LEVEL_B_ERE_GRAMMAR_CATALOG, getGrammarForLesson } from "../src/data/levelBGrammarData";

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
  return JSON.parse(JSON.stringify(data, (_key, value) => {
    return value === undefined ? null : value;
  }));
}

async function syncGrammarToFirestore() {
  console.log("==================================================");
  console.log("SYNC LEVEL B ERE GRAMMAR METADATA TO FIRESTORE");
  console.log("Target: Firestore /lessons (level_b_day_1 .. level_b_day_30)");
  console.log("Project:", firebaseConfig.projectId);
  console.log("Total Lessons in Catalog:", CURRICULUM_CATALOG_LEVEL_B_ERE.length);
  console.log("Total Grammar Docs in Catalog:", LEVEL_B_ERE_GRAMMAR_CATALOG.length);
  console.log("==================================================\n");

  const startTime = Date.now();
  let successCount = 0;

  for (let i = 0; i < CURRICULUM_CATALOG_LEVEL_B_ERE.length; i++) {
    const lesson = CURRICULUM_CATALOG_LEVEL_B_ERE[i];
    const docId = `level_b_day_${lesson.day_number}`;
    const g = getGrammarForLesson(lesson.id) || getGrammarForLesson(docId);

    if (!g) {
      console.error(`❌ [Day ${lesson.day_number}] Missing grammar document for lesson ${lesson.id} (${docId})`);
      throw new Error(`Missing grammar document for ${lesson.id}`);
    }

    const docRef = doc(db, "lessons", docId);
    const payload = sanitizeForFirestore({
      grammar: {
        verb_forms: g.verb_forms || [],
        sentence_structures: g.sentence_structures || [],
        tense: g.tense || [],
        notes: g.notes || ""
      },
      updated_at: new Date().toISOString()
    });

    console.log(`[${i + 1}/${CURRICULUM_CATALOG_LEVEL_B_ERE.length}] Syncing grammar for ${docId} (Day ${lesson.day_number}: "${lesson.lesson_title}")...`);
    console.log(`   - Verb forms: ${g.verb_forms.length}, Sentence structures: ${g.sentence_structures.length}, Tenses: ${g.tense.length}, Notes length: ${g.notes?.length || 0}`);

    try {
      await setDoc(docRef, payload, { merge: true });
      successCount++;
      console.log(`   ✅ Synced ${docId} successfully.`);
    } catch (err: any) {
      console.error(`   ❌ Failed to sync ${docId}:`, err?.message || String(err));
      throw err;
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n==================================================");
  console.log(`🎉 SUCCESS: All ${successCount} lessons updated with grammar metadata in ${durationSec}s!`);
  console.log("==================================================");
}

syncGrammarToFirestore()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal sync error:", err);
    process.exit(1);
  });
