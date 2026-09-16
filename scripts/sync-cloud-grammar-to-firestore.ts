import * as fs from 'node:fs';
import * as path from 'node:path';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBrH0sAU__R4k1IBrSYIF73fFdASeSpdE4",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "chunks-voicecloning-genshai.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "chunks-voicecloning-genshai",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "chunks-mirror-audio-284566312743",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "284566312743",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:284566312743:web:038f451f2fc5fa25d30cf8"
};

function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_key, value) => {
    return value === undefined ? null : value;
  }));
}

export async function syncCloudGrammarToFirestore(): Promise<{
  success: boolean;
  totalSynced: number;
  totalAudioPushed: number;
  durationSec: number;
}> {
  const startTime = Date.now();
  console.log("==================================================");
  console.log("SYNC CLOUD GRAMMAR BOOST AUDIO TO FIRESTORE");
  console.log("Project: " + firebaseConfig.projectId);
  console.log("Target: Firestore /lessons (level_b_day_1 .. level_b_day_30)");
  console.log("Source: src/data/grammarBoostCatalog.json");
  console.log("==================================================\n");

  const catalogPath = path.resolve("src/data/grammarBoostCatalog.json");
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Catalog not found at ${catalogPath}`);
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const topics: any[] = catalog.topics || [];

  if (topics.length !== 30) {
    throw new Error(`Expected 30 topics, found ${topics.length}`);
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);

  let totalSynced = 0;
  let totalAudioPushed = 0;

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const dayNumber = topic.day_number || topic.topic_number || (i + 1);
    const docId = `level_b_day_${dayNumber}`;

    const miniLessons = topic.mini_lessons || [];
    const withAudioCount = miniLessons.filter((m: any) => !!m.audio_url).length;
    totalAudioPushed += withAudioCount;

    const grammarPayload = {
      verb_forms: topic.verb_forms || [],
      sentence_structures: topic.sentence_structures || [],
      tense: topic.tense || [],
      notes: topic.notes || "",
      mini_lessons: miniLessons,
      total_audio_files: withAudioCount,
      source_type: topic.source_type || "audio_boost",
      thematic_module: topic.thematic_module || null,
      status: "active"
    };

    const docPayload = sanitizeForFirestore({
      grammar: grammarPayload,
      updated_at: new Date().toISOString()
    });

    console.log(`[${i + 1}/${topics.length}] Syncing Day ${dayNumber} (${docId}): "${topic.lesson_title}"...`);
    console.log(`   - Mini lessons: ${miniLessons.length}, Cloud audio ready: ${withAudioCount}/${miniLessons.length}`);

    const docRef = doc(db, "lessons", docId);
    await setDoc(docRef, docPayload, { merge: true });
    totalSynced++;
  }

  const durationSec = Number(((Date.now() - startTime) / 1000).toFixed(1));
  console.log("\n==================================================");
  console.log(`✅ SYNC COMPLETE: ${totalSynced}/30 Topics updated in Firestore in ${durationSec}s!`);
  console.log(`🎵 Total Cloud Audio Mini-Lessons In Sync: ${totalAudioPushed}/288`);
  console.log("==================================================\n");

  // Post-sync validation check
  console.log("--- Validating Firestore Documents (Sample Check) ---");
  for (const checkDay of [1, 15, 30]) {
    const checkDocId = `level_b_day_${checkDay}`;
    const snap = await getDoc(doc(db, "lessons", checkDocId));
    if (!snap.exists()) {
      throw new Error(`Validation failed: ${checkDocId} does not exist in Firestore!`);
    }
    const data = snap.data();
    const g = data?.grammar;
    const sampleMl = g?.mini_lessons?.[0];
    console.log(`✓ ${checkDocId}: mini_lessons count=${g?.mini_lessons?.length}, total_audio_files=${g?.total_audio_files}`);
    console.log(`  Sample 1st item: file="${sampleMl?.file}", source="${sampleMl?.audio_source}"`);
    console.log(`  Audio URL: ${sampleMl?.audio_url?.slice(0, 85)}...`);
  }

  console.log("\n🎉 All sample validations PASSED 100%!");
  return {
    success: true,
    totalSynced,
    totalAudioPushed,
    durationSec
  };
}

if (import.meta.main) {
  syncCloudGrammarToFirestore()
    .then(() => process.exit(0))
    .catch(err => {
      console.error("Fatal sync error:", err);
      process.exit(1);
    });
}
