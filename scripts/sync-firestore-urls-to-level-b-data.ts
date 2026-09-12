import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
import { CURRICULUM_CATALOG_LEVEL_B_ERE } from "../src/data/levelBEreData";
import { LessonDoc, ChunkItem } from "../src/types";

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

async function syncFirestoreUrlsToLevelBData() {
  console.log("======================================================================");
  console.log("SYNC FIRESTORE AUDIO URLS INTO src/data/levelBEreData.ts");
  console.log("Project:", firebaseConfig.projectId);
  console.log("======================================================================");

  const updatedCatalog: LessonDoc[] = JSON.parse(JSON.stringify(CURRICULUM_CATALOG_LEVEL_B_ERE));

  let totalEnUpdated = 0;
  let totalViUpdated = 0;
  let totalLessonsProcessed = 0;

  const summaryRows: {
    day: number;
    lessonId: string;
    totalChunks: number;
    enCount: number;
    viCount: number;
    status: string;
  }[] = [];

  for (let day = 1; day <= 30; day++) {
    const lessonId = `level_b_day_${day}`;
    const targetLesson = updatedCatalog.find(
      (l) => l.id === lessonId || l.day_number === day
    );

    if (!targetLesson) {
      console.warn(`⚠️ Lesson '${lessonId}' (Day ${day}) not found in local catalog!`);
      continue;
    }

    try {
      const docRef = doc(db, "lessons", lessonId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        summaryRows.push({
          day,
          lessonId,
          totalChunks: targetLesson.chunks.length,
          enCount: 0,
          viCount: 0,
          status: "NOT IN FIRESTORE"
        });
        continue;
      }

      totalLessonsProcessed++;
      const firestoreData = docSnap.data();
      const firestoreChunks: ChunkItem[] = Array.isArray(firestoreData.chunks)
        ? firestoreData.chunks
        : [];

      const chunkById = new Map<string, ChunkItem>();
      const chunkByItemNum = new Map<number, ChunkItem>();

      for (const fc of firestoreChunks) {
        if (fc.chunk_id) {
          chunkById.set(fc.chunk_id, fc);
        }
        if (typeof fc.item_number === "number") {
          chunkByItemNum.set(fc.item_number, fc);
        }
      }

      let dayEnCount = 0;
      let dayViCount = 0;

      for (const chunk of targetLesson.chunks) {
        const match =
          (chunk.chunk_id ? chunkById.get(chunk.chunk_id) : undefined) ||
          chunkByItemNum.get(chunk.item_number);

        if (match) {
          if (match.audio_url && typeof match.audio_url === "string") {
            chunk.audio_url = match.audio_url;
            dayEnCount++;
          }
          if (match.audio_url_vi && typeof match.audio_url_vi === "string") {
            chunk.audio_url_vi = match.audio_url_vi;
            dayViCount++;
          }
        }
      }

      totalEnUpdated += dayEnCount;
      totalViUpdated += dayViCount;

      summaryRows.push({
        day,
        lessonId,
        totalChunks: targetLesson.chunks.length,
        enCount: dayEnCount,
        viCount: dayViCount,
        status: "SYNCED"
      });

      console.log(
        `✅ Day ${String(day).padStart(2)} (${lessonId}): EN: ${String(dayEnCount).padStart(3)} | VI: ${String(dayViCount).padStart(3)} | Total: ${targetLesson.chunks.length}`
      );
    } catch (err) {
      console.error(`❌ Error fetching lesson '${lessonId}':`, err);
    }
  }

  console.log("\n----------------------------------------------------------------------");
  console.log("SUMMARY REPORT:");
  console.table(summaryRows);
  console.log(`Total Lessons Processed: ${totalLessonsProcessed}`);
  console.log(`Total EN Audio URLs Populated: ${totalEnUpdated}`);
  console.log(`Total VI Audio URLs Populated: ${totalViUpdated}`);
  console.log("----------------------------------------------------------------------");

  // Verify Day 1 Chunk 1
  const d1c1 = updatedCatalog[0]?.chunks?.[0];
  console.log("\n🔍 Verification - Day 1 Chunk 1:");
  console.log("Chunk ID:", d1c1?.chunk_id);
  console.log("English:", d1c1?.english);
  console.log("audio_url:", d1c1?.audio_url);
  console.log("audio_url_vi:", d1c1?.audio_url_vi);

  if (!d1c1?.audio_url || !d1c1?.audio_url_vi) {
    throw new Error("❌ Verification failed: Day 1 Chunk 1 does not have both audio_url and audio_url_vi!");
  }

  console.log("\n💾 Writing updated CURRICULUM_CATALOG_LEVEL_B_ERE to src/data/levelBEreData.ts...");
  const targetFile = path.resolve(__dirname, "../src/data/levelBEreData.ts");
  const fileContent = `import { LessonDoc } from "../types";\n\nexport const CURRICULUM_CATALOG_LEVEL_B_ERE: LessonDoc[] = ${JSON.stringify(
    updatedCatalog,
    null,
    2
  )};\n`;

  fs.writeFileSync(targetFile, fileContent, "utf-8");
  console.log(`🎉 Successfully wrote ${targetFile} (${(fileContent.length / 1024 / 1024).toFixed(2)} MB)`);
}

syncFirestoreUrlsToLevelBData()
  .then(() => {
    console.log("Script completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
  });
