/**
 * scripts/fix-vietnamese-missing-spaces.ts
 *
 * Automated Repair & Audit Script for Vietnamese Missing Spaces
 * - Identifies and repairs fused Vietnamese syllables in Level B EREL & ERES datasets.
 * - Writes cleaned datasets back to src/data/levelBErelData.ts & src/data/levelBEresData.ts.
 * - Syncs updated courses and lessons to Cloud Firestore while preserving single-doc chunks array structure.
 * - Runs rigorous verification gates to ensure 0 remaining fused words.
 */

import * as fs from "fs";
import * as path from "path";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, writeBatch } from "firebase/firestore";
import { CURRICULUM_CATALOG_LEVEL_B_EREL } from "../src/data/levelBErelData";
import { CURRICULUM_CATALOG_LEVEL_B_ERES } from "../src/data/levelBEresData";
import { Course, LessonDoc } from "../src/types";

// ============================================================================
// 1. TONE CHARACTERS & REGEX DEFINITIONS
// ============================================================================

export const TONE_LOWER = "áàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ";
export const TONE_UPPER = "ÁÀẢÃẠẮẰẲẴẶẤẦẨẪẬÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ";
export const TONE_ALL = TONE_LOWER + TONE_UPPER;
export const VOWELS_ALL = "aăâeêioôơuưy" + TONE_ALL + "AĂÂEÊIOÔƠUƯY";

export const TONE_CHARS = /[áàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/gi;

// Comprehensive onset consonants in Vietnamese:
// ch, kh, ngh, ng, nh, ph, th, tr, qu, b, c, d, đ, g, h, k, l, m, n, p, r, s, t, v, x
export const ONSETS = "ch|kh|ngh|ng|nh|ph|th|tr|qu|[bcdđghklmnpqrstvxBCĐDGHJKLMNPQRSTVX]";

// Manual overrides dictionary for any specific or special expressions
export const MANUAL_OVERRIDES: Record<string, string> = {
  "tốquyết": "tố quyết",
  "chịsẽtựmình": "chị sẽ tự mình",
};

/**
 * Unfuse Vietnamese words where missing spaces caused syllables to stick together.
 * E.g., "Đểmình" -> "Để mình", "khảnăng" -> "khả năng", "từchỗcửa" -> "từ chỗ cửa"
 */
export function unfuseVietnameseText(text: string): string {
  if (!text) return text;
  let res = text;

  // Apply manual overrides first if any exact substring matches
  for (const [key, val] of Object.entries(MANUAL_OVERRIDES)) {
    if (res.includes(key)) {
      res = res.replaceAll(key, val);
    }
  }

  // 1. Two adjacent tone vowels like "Thụán" -> "Thụ án", "dựán" -> "dự án"
  res = res.replace(
    new RegExp(`([${TONE_ALL}])([${TONE_ALL}])`, "g"),
    "$1 $2"
  );

  // 2. Open tone vowel followed by onset consonant + vowel:
  // Repeat until all fused syllables in words like "từchỗcửa" -> "từ chỗ cửa" are separated
  let prev = "";
  while (prev !== res) {
    prev = res;
    res = res.replace(
      new RegExp(
        `([${TONE_ALL}])(${ONSETS})([${VOWELS_ALL}])`,
        "g"
      ),
      "$1 $2$3"
    );
  }

  return res;
}

/**
 * Audit test to detect whether a string still has fused syllables
 */
export function hasFusedVietnameseWords(text: string): boolean {
  if (!text) return false;
  // 1. Tone vowel directly followed by tone vowel
  const mToneTone = new RegExp(`[${TONE_ALL}][${TONE_ALL}]`).test(text);
  if (mToneTone) return true;

  // 2. Tone vowel directly followed by onset consonant + vowel
  const mToneCons = new RegExp(`[${TONE_ALL}](${ONSETS})[${VOWELS_ALL}]`).test(text);
  if (mToneCons) return true;

  return false;
}

// ============================================================================
// 2. FIREBASE CONFIG & HELPERS
// ============================================================================

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBrH0sAU__R4k1IBrSYIF73fFdASeSpdE4",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "chunks-voicecloning-genshai.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "chunks-voicecloning-genshai",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "chunks-mirror-audio-284566312743",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "284566312743",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:284566312743:web:038f451f2fc5fa25d30cf8"
};

function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    return value === undefined ? null : value;
  }));
}

// ============================================================================
// 3. MAIN WORKFLOW: REPAIR, WRITE-BACK, FIRESTORE SYNC & VERIFICATION
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const skipSync = args.includes("--no-sync") || args.includes("--dry-run");

  console.log("================================================================================");
  console.log("CHUNKS PLATFORM: VIETNAMESE MISSING-SPACES AUDIT & REPAIR PIPELINE");
  console.log("================================================================================");
  console.log(`Sync to Firestore: ${skipSync ? "DISABLED (--no-sync/--dry-run)" : "ENABLED"}`);

  // --------------------------------------------------------------------------
  // Step 1: Repair Level B EREL
  // --------------------------------------------------------------------------
  console.log("\n[1/4] Processing Level B EREL (15 Lessons)...");
  let erelAffectedCount = 0;
  const erelRepairs: Array<{ id: string; before: string; after: string }> = [];

  for (const lesson of CURRICULUM_CATALOG_LEVEL_B_EREL) {
    for (const chunk of lesson.chunks) {
      const orig = chunk.vietnamese || "";
      const fixed = unfuseVietnameseText(orig);
      if (fixed !== orig) {
        erelAffectedCount++;
        erelRepairs.push({ id: chunk.chunk_id, before: orig, after: fixed });
        chunk.vietnamese = fixed;
      }
    }
  }

  console.log(`   Found & repaired ${erelAffectedCount} chunks in Level B EREL.`);
  console.log("   Sample repairs in EREL:");
  for (const item of erelRepairs.slice(0, 5)) {
    console.log(`     - [${item.id}] "${item.before}" -> "${item.after}"`);
  }

  // --------------------------------------------------------------------------
  // Step 2: Repair Level B ERES
  // --------------------------------------------------------------------------
  console.log("\n[2/4] Processing Level B ERES (15 Lessons)...");
  let eresAffectedCount = 0;
  const eresRepairs: Array<{ id: string; before: string; after: string }> = [];

  for (const lesson of CURRICULUM_CATALOG_LEVEL_B_ERES) {
    for (const chunk of lesson.chunks) {
      const orig = chunk.vietnamese || "";
      const fixed = unfuseVietnameseText(orig);
      if (fixed !== orig) {
        eresAffectedCount++;
        eresRepairs.push({ id: chunk.chunk_id, before: orig, after: fixed });
        chunk.vietnamese = fixed;
      }
    }
  }

  console.log(`   Found & repaired ${eresAffectedCount} chunks in Level B ERES.`);
  console.log("   Sample repairs in ERES:");
  for (const item of eresRepairs.slice(0, 5)) {
    console.log(`     - [${item.id}] "${item.before}" -> "${item.after}"`);
  }

  // --------------------------------------------------------------------------
  // Step 3: Write Back Cleaned Datasets to Codebase
  // --------------------------------------------------------------------------
  console.log("\n[3/4] Writing Cleaned Datasets Back to Codebase Files...");

  const erelFilePath = path.resolve(__dirname, "../src/data/levelBErelData.ts");
  const erelContent = `import { LessonDoc } from "../types";\n\nexport const CURRICULUM_CATALOG_LEVEL_B_EREL: LessonDoc[] = ${JSON.stringify(CURRICULUM_CATALOG_LEVEL_B_EREL, null, 2)};\n`;
  fs.writeFileSync(erelFilePath, erelContent, "utf-8");
  console.log(`   ✅ Wrote cleaned EREL catalog to ${erelFilePath}`);

  const eresFilePath = path.resolve(__dirname, "../src/data/levelBEresData.ts");
  const eresContent = `import { LessonDoc } from "../types";\n\nexport const CURRICULUM_CATALOG_LEVEL_B_ERES: LessonDoc[] = ${JSON.stringify(CURRICULUM_CATALOG_LEVEL_B_ERES, null, 2)};\n`;
  fs.writeFileSync(eresFilePath, eresContent, "utf-8");
  console.log(`   ✅ Wrote cleaned ERES catalog to ${eresFilePath}`);

  // --------------------------------------------------------------------------
  // Step 4: Verification Audit
  // --------------------------------------------------------------------------
  console.log("\n[4/4] Executing Comprehensive Post-Repair Audit...");

  let erelRemainingFaults = 0;
  for (const lesson of CURRICULUM_CATALOG_LEVEL_B_EREL) {
    for (const chunk of lesson.chunks) {
      if (hasFusedVietnameseWords(chunk.vietnamese)) {
        erelRemainingFaults++;
        console.error(`   ❌ Remaining fault in EREL [${chunk.chunk_id}]: ${chunk.vietnamese}`);
      }
    }
  }

  let eresRemainingFaults = 0;
  for (const lesson of CURRICULUM_CATALOG_LEVEL_B_ERES) {
    for (const chunk of lesson.chunks) {
      if (hasFusedVietnameseWords(chunk.vietnamese)) {
        eresRemainingFaults++;
        console.error(`   ❌ Remaining fault in ERES [${chunk.chunk_id}]: ${chunk.vietnamese}`);
      }
    }
  }

  console.log(`   Level B EREL remaining fused words: ${erelRemainingFaults}`);
  console.log(`   Level B ERES remaining fused words: ${eresRemainingFaults}`);

  if (erelRemainingFaults > 0 || eresRemainingFaults > 0) {
    throw new Error(`Audit failed: ${erelRemainingFaults} EREL and ${eresRemainingFaults} ERES faults remain!`);
  }
  console.log("   ✅ AUDIT PASSED: 0 fused words remain across both catalogs!");

  // --------------------------------------------------------------------------
  // Step 5: Sync to Cloud Firestore (Preserving Single-Doc Chunks Structure)
  // --------------------------------------------------------------------------
  if (!skipSync) {
    console.log("\n================================================================================");
    console.log("SYNCING REPAIRED DATASETS TO CLOUD FIRESTORE");
    console.log(`Target Project: ${firebaseConfig.projectId}`);
    console.log("================================================================================");

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // 5.1 Sync Course EREL & Lessons
    console.log("\n1. Syncing Level B - EREL...");
    const erelTotalChunks = CURRICULUM_CATALOG_LEVEL_B_EREL.reduce(
      (sum, l) => sum + (l.total_chunks || l.chunks.length),
      0
    );

    const courseErel: Course = {
      id: "course_level_b_erel",
      level_code: "LEVEL_B_EREL",
      title: "Level B - EREL (English Reflexes Enhancement for Listening)",
      description: "15 Days of Emotional Reflexes & Movie Shadowing with 2,381 deep listening dialogues and reflex chunks.",
      total_days: CURRICULUM_CATALOG_LEVEL_B_EREL.length,
      total_chunks: erelTotalChunks,
      default_sessions_count: 15,
      source: "Genshai EREL Listening Curriculum",
      is_active: true
    };

    await setDoc(doc(db, "courses", courseErel.id), sanitizeForFirestore(courseErel), { merge: true });
    console.log(`   ✅ Course doc 'courses/${courseErel.id}' synced.`);

    const erelBatch = writeBatch(db);
    let erelQueuedDocs = 0;

    for (const lesson of CURRICULUM_CATALOG_LEVEL_B_EREL) {
      const lessonDoc: LessonDoc = {
        ...lesson,
        title: lesson.lesson_title,
        total_chunks: lesson.chunks.length,
        categories: Array.from(new Set(lesson.chunks.map(c => c.category)))
      };

      const sanitized = sanitizeForFirestore(lessonDoc);
      const lessonRef = doc(db, "lessons", sanitized.id);
      erelBatch.set(lessonRef, sanitized, { merge: true });
      erelQueuedDocs++;
      console.log(`   - Queued EREL ${sanitized.id} (Day ${sanitized.day_number}): ${sanitized.chunks.length} chunks`);
    }

    console.log(`   Committing EREL batch write (${erelQueuedDocs} documents)...`);
    await erelBatch.commit();
    console.log(`   ✅ EREL batch write complete!`);

    // 5.2 Sync Course ERES & Lessons
    console.log("\n2. Syncing Level B - ERES...");
    const eresTotalChunks = CURRICULUM_CATALOG_LEVEL_B_ERES.reduce(
      (sum, l) => sum + (l.total_chunks || l.chunks.length),
      0
    );

    const courseEres: Course = {
      id: "course_level_b_eres",
      level_code: "LEVEL_B_ERES",
      title: "Level B - ERES (English Reflexes Enhancement for Speaking)",
      description: "15 Days of Spoken Reflexes & Business English with conversational and workplace chunks.",
      total_days: CURRICULUM_CATALOG_LEVEL_B_ERES.length,
      total_chunks: eresTotalChunks,
      default_sessions_count: 15,
      source: "Genshai ERES Speaking Curriculum",
      is_active: true
    };

    await setDoc(doc(db, "courses", courseEres.id), sanitizeForFirestore(courseEres), { merge: true });
    console.log(`   ✅ Course doc 'courses/${courseEres.id}' synced.`);

    const eresBatch = writeBatch(db);
    let eresQueuedDocs = 0;

    for (const lesson of CURRICULUM_CATALOG_LEVEL_B_ERES) {
      const lessonDoc: LessonDoc = {
        ...lesson,
        title: lesson.lesson_title,
        total_chunks: lesson.chunks.length,
        categories: Array.from(new Set(lesson.chunks.map(c => c.category)))
      };

      const sanitized = sanitizeForFirestore(lessonDoc);
      const lessonRef = doc(db, "lessons", sanitized.id);
      eresBatch.set(lessonRef, sanitized, { merge: true });
      eresQueuedDocs++;
      console.log(`   - Queued ERES ${sanitized.id} (Day ${sanitized.day_number}): ${sanitized.chunks.length} chunks`);
    }

    console.log(`   Committing ERES batch write (${eresQueuedDocs} documents)...`);
    await eresBatch.commit();
    console.log(`   ✅ ERES batch write complete!`);
  }

  console.log("\n================================================================================");
  console.log("PIPELINE EXECUTION COMPLETED SUCCESSFULLY");
  console.log(`Total Repaired: EREL = ${erelAffectedCount}, ERES = ${eresAffectedCount}`);
  console.log("================================================================================");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Pipeline failed:", err);
    process.exit(1);
  });
