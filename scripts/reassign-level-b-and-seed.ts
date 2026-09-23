import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, writeBatch } from "firebase/firestore";
import { CURRICULUM_CATALOG_LEVEL_B_ERE } from "../src/data/levelBEreData";
import { Course, LessonDoc, Cohort, ClassSession } from "../src/types";

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

const WEEKDAY_MAP: Record<string, number> = {
  "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 0
};

const INT_TO_DAY: Record<number, string> = {
  1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 0: "Sun"
};

function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    return value === undefined ? null : value;
  }));
}

async function reassignLevelBAndSeed() {
  console.log("==================================================");
  console.log("REASSIGN LEVEL B (30 TOPICS) & SEED TO FIRESTORE");
  console.log("Database Project:", firebaseConfig.projectId);
  console.log("==================================================");

  const totalChunks = CURRICULUM_CATALOG_LEVEL_B_ERE.reduce(
    (sum, l) => sum + (l.total_chunks || l.chunks.length),
    0
  );

  // 1. Canonical Course Doc: course_level_b
  const canonicalCourse: Course = {
    id: "course_level_b",
    level_code: "LEVEL_B",
    title: "Level B - ERE (English Reflexes Enhancement - 30 Topics)",
    description: "Curriculum 30 Topics - Phản xạ tăng cường CHUNKS ERE (3,150 chunks).",
    total_days: CURRICULUM_CATALOG_LEVEL_B_ERE.length,
    total_chunks: totalChunks,
    default_sessions_count: 30,
    source: "Genshai ERE 30-Topic Curriculum",
    is_active: true
  };

  console.log(`\n1. Writing Canonical Course: 'courses/${canonicalCourse.id}'...`);
  await setDoc(doc(db, "courses", canonicalCourse.id), sanitizeForFirestore(canonicalCourse), { merge: true });
  console.log(`   ✅ Course '${canonicalCourse.id}' saved successfully.`);

  // Also maintain course_level_b_ere alias pointing to the same metadata
  const ereCourseAlias: Course = {
    ...canonicalCourse,
    id: "course_level_b_ere",
    level_code: "LEVEL_B"
  };
  await setDoc(doc(db, "courses", ereCourseAlias.id), sanitizeForFirestore(ereCourseAlias), { merge: true });
  console.log(`   ✅ Course alias '${ereCourseAlias.id}' saved.`);

  // 2. Write all 30 lessons (both level_b_day_X and level_b_ere_day_X)
  console.log(`\n2. Writing ${CURRICULUM_CATALOG_LEVEL_B_ERE.length} Lessons to 'lessons' collection...`);
  const BATCH_SIZE = 10;
  const totalLessons = CURRICULUM_CATALOG_LEVEL_B_ERE.length;

  for (let i = 0; i < totalLessons; i += BATCH_SIZE) {
    const chunkBatch = CURRICULUM_CATALOG_LEVEL_B_ERE.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(totalLessons / BATCH_SIZE);

    console.log(`\n--- Writing Batch ${batchNum}/${totalBatches} (${chunkBatch.length} lessons) ---`);

    for (const lesson of chunkBatch) {
      const canonicalLessonId = `level_b_day_${lesson.day_number}`;
      const ereAliasId = `level_b_ere_day_${lesson.day_number}`;

      const canonicalDoc: LessonDoc = {
        ...lesson,
        id: canonicalLessonId,
        course_id: "course_level_b",
        level_code: "LEVEL_B",
        course_title: "Level B - ERE (English Reflexes Enhancement - 30 Topics)",
        total_chunks: lesson.chunks.length,
        categories: Array.from(new Set(lesson.chunks.map(c => c.category)))
      };

      const aliasDoc: LessonDoc = {
        ...canonicalDoc,
        id: ereAliasId
      };

      // Write canonical doc: level_b_day_X
      batch.set(doc(db, "lessons", canonicalLessonId), sanitizeForFirestore(canonicalDoc), { merge: true });
      // Write alias doc: level_b_ere_day_X
      batch.set(doc(db, "lessons", ereAliasId), sanitizeForFirestore(aliasDoc), { merge: true });

      console.log(`   + Queued ${canonicalLessonId} & ${ereAliasId} (Day ${lesson.day_number}): ${lesson.chunks.length} chunks ("${lesson.lesson_title}")`);
    }

    await batch.commit();
    console.log(`   ✅ Batch ${batchNum} committed.`);
  }

  // 3. Generate and seed 30-Session Cohort: cohort_level_b_k30
  console.log("\n3. Generating 30-Session Cohort for Level B (2026-09-14 Mon/Wed/Fri)...");
  const startDateStr = "2026-09-14";
  const daysOfWeek = ["Mon", "Wed", "Fri"];
  const startTime = "19:30";
  const endTime = "21:00";
  const targetDays = new Set(daysOfWeek.map(d => WEEKDAY_MAP[d]));

  const [year, month, day] = startDateStr.split("-").map(Number);
  const current = new Date(year, month - 1, day, 12, 0, 0);

  const sessions: ClassSession[] = [];
  let count = 1;
  let safetyLoop = 0;

  while (count <= 30 && safetyLoop < 730) {
    safetyLoop++;
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    const isoDate = `${y}-${m}-${d}`;
    const dayOfWeek = current.getDay();

    if (targetDays.has(dayOfWeek)) {
      const lesson = CURRICULUM_CATALOG_LEVEL_B_ERE.find(l => l.day_number === count);
      const lessonTitle = lesson ? lesson.lesson_title : `Day ${count} - ERE Reflex Drill`;
      const lessonType = lesson?.lesson_type || "Standard Lesson";

      sessions.push({
        session_number: count,
        scheduled_date: isoDate,
        day_of_week: INT_TO_DAY[dayOfWeek],
        start_time: startTime,
        end_time: endTime,
        day_number: count,
        lesson_id: `level_b_day_${count}`,
        lesson_title: lessonTitle,
        lesson_type: lessonType,
        status: count === 1 ? "in_progress" : "scheduled"
      });
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  const cohortId = "cohort_level_b_k30";
  const cohortData: Cohort = {
    id: cohortId,
    title: "Cohort Level B - K30 (ERE 30 Topics)",
    level_code: "LEVEL_B",
    course_id: "course_level_b",
    teacher_id: "teacher_chunks_lead",
    start_date: startDateStr,
    schedule_pattern: {
      days_of_week: ["Mon", "Wed", "Fri"],
      start_time: startTime,
      end_time: endTime,
      duration_minutes: 90
    },
    total_sessions: 30,
    sessions,
    audio_settings: {
      voice_profile_primary: "flux-cliff-en",
      voice_profile_secondary: "vi-VN-Neural2-A",
      voice_profile_en: "flux-cliff-en",
      voice_profile_vi: "vi-VN-Neural2-A",
      language_mode: "EN_THEN_VI",
      auto_advance_delay_sec: 0,
      default_speed: 1.0,
      repeat_count: 1
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log(`\n4. Saving Cohort to Firestore 'cohorts/${cohortId}'...`);
  await setDoc(doc(db, "cohorts", cohortId), sanitizeForFirestore(cohortData), { merge: true });
  console.log(`   ✅ Cohort '${cohortId}' saved successfully.`);

  // Also update cohort_level_b_ere_k30 to match
  const ereCohortAlias: Cohort = {
    ...cohortData,
    id: "cohort_level_b_ere_k30",
    title: "Level B - ERE Speaking & Reflex Masterclass (30 Topics)"
  };
  await setDoc(doc(db, "cohorts", ereCohortAlias.id), sanitizeForFirestore(ereCohortAlias), { merge: true });
  console.log(`   ✅ Cohort alias '${ereCohortAlias.id}' updated.`);

  console.log("\n==================================================");
  console.log("🎉 REASSIGNMENT & SEEDING COMPLETED SUCCESSFULLY!");
  console.log(`- Course: ${canonicalCourse.id} (${canonicalCourse.title})`);
  console.log(`- Total Lessons Written: 30 canonical (level_b_day_1..30) + 30 aliases (level_b_ere_day_1..30)`);
  console.log(`- Total Chunks per Lesson: 105 chunks (3,150 total chunks)`);
  console.log(`- Cohort: ${cohortId} (30 Sessions from ${sessions[0].scheduled_date} to ${sessions[29].scheduled_date})`);
  console.log("==================================================");
}

reassignLevelBAndSeed()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
