import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { CURRICULUM_CATALOG_LEVEL_B_ERE } from "../src/data/levelBEreData";
import { Course, LessonDoc, Cohort, ClassSession, CohortAudioSettings } from "../src/types";
import { getLessonsByLevel, getCohorts } from "../src/services/firestoreService";

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
  Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0
};

const INT_TO_DAY: Record<number, string> = {
  1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 0: "Sun"
};

function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      return value === undefined ? null : value;
    })
  );
}

async function fixFirestoreLevelBDuplicates() {
  console.log("==================================================================");
  console.log("FIX FIRESTORE LEVEL B DUPLICATES & RE-SEED 30-SESSION COHORTS");
  console.log("Database Project:", firebaseConfig.projectId);
  console.log("==================================================================");

  // -------------------------------------------------------------------------
  // Step 1: Ensure canonical Course doc 'courses/course_level_b' is primary
  // -------------------------------------------------------------------------
  console.log("\n[STEP 1] Updating Courses...");
  const totalChunks = CURRICULUM_CATALOG_LEVEL_B_ERE.reduce(
    (sum, l) => sum + (l.total_chunks || l.chunks.length),
    0
  );

  const canonicalCourse: Course = {
    id: "course_level_b",
    level_code: "LEVEL_B",
    title: "Level B - ERE (English Reflexes Enhancement - 30 Topics)",
    description: "Curriculum 30 Topics - Phản xạ tăng cường CHUNKS ERE (3,150 chunks).",
    total_days: 30,
    total_chunks: totalChunks,
    default_sessions_count: 30,
    source: "Genshai ERE 30-Topic Curriculum",
    is_active: true
  };

  await setDoc(doc(db, "courses", "course_level_b"), sanitizeForFirestore(canonicalCourse), { merge: true });
  console.log("  ✅ Primary Course 'courses/course_level_b' saved (level_code: LEVEL_B, total_days: 30).");

  // Mark course_level_b_ere as alias
  await setDoc(
    doc(db, "courses", "course_level_b_ere"),
    {
      id: "course_level_b_ere",
      level_code: "LEVEL_B_ALIAS",
      title: "Level B - ERE (English Reflexes Enhancement - 30 Topics) [Alias]",
      total_days: 30,
      total_chunks: totalChunks,
      is_active: false
    },
    { merge: true }
  );
  console.log("  ✅ Course alias 'courses/course_level_b_ere' updated to level_code: 'LEVEL_B_ALIAS'.");

  // -------------------------------------------------------------------------
  // Step 2: Clean up Lessons Collection
  // - Ensure canonical lessons level_b_day_1..30 have level_code: 'LEVEL_B' and course_id: 'course_level_b'
  // - Update alias lessons level_b_ere_day_1..30 to level_code: 'LEVEL_B_ALIAS'
  // - Update level_b_word_list to level_code: 'LEVEL_B_ALIAS'
  // -------------------------------------------------------------------------
  console.log("\n[STEP 2] Cleaning up Lessons collection...");

  // Batch update alias documents
  const BATCH_SIZE = 15;
  for (let i = 1; i <= 30; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const end = Math.min(i + BATCH_SIZE - 1, 30);
    for (let day = i; day <= end; day++) {
      const aliasId = `level_b_ere_day_${day}`;
      const aliasRef = doc(db, "lessons", aliasId);
      batch.set(
        aliasRef,
        {
          level_code: "LEVEL_B_ALIAS",
          updated_at: new Date().toISOString()
        },
        { merge: true }
      );
    }
    await batch.commit();
    console.log(`  ✅ Updated alias lessons level_b_ere_day_${i}..${end} to LEVEL_B_ALIAS.`);
  }

  // Update level_b_word_list if it has level_code == 'LEVEL_B'
  const wordListRef = doc(db, "lessons", "level_b_word_list");
  const wordListSnap = await getDoc(wordListRef);
  if (wordListSnap.exists()) {
    await setDoc(
      wordListRef,
      {
        level_code: "LEVEL_B_ALIAS",
        course_id: "course_level_b",
        updated_at: new Date().toISOString()
      },
      { merge: true }
    );
    console.log("  ✅ Updated 'lessons/level_b_word_list' to level_code: 'LEVEL_B_ALIAS'.");
  }

  // Verify and ensure all 30 canonical lessons exist and have level_code: 'LEVEL_B'
  const canonicalLessons: LessonDoc[] = [];
  for (let day = 1; day <= 30; day++) {
    const canonicalId = `level_b_day_${day}`;
    const lessonRef = doc(db, "lessons", canonicalId);
    const snap = await getDoc(lessonRef);
    const seed = CURRICULUM_CATALOG_LEVEL_B_ERE.find(l => l.day_number === day);

    let lessonDoc: LessonDoc;
    if (snap.exists()) {
      const existingData = snap.data() as LessonDoc;
      lessonDoc = {
        ...existingData,
        id: canonicalId,
        course_id: "course_level_b",
        level_code: "LEVEL_B",
        course_title: "Level B - ERE (English Reflexes Enhancement - 30 Topics)",
        day_number: day,
        lesson_title: existingData.lesson_title || seed?.lesson_title || `Day ${day}`,
        lesson_type: existingData.lesson_type || seed?.lesson_type || "Reflex & Business Drill",
        total_chunks: existingData.chunks?.length || seed?.chunks.length || 105,
        chunks: existingData.chunks && existingData.chunks.length > 0 ? existingData.chunks : (seed?.chunks || [])
      };
    } else if (seed) {
      lessonDoc = {
        ...seed,
        id: canonicalId,
        course_id: "course_level_b",
        level_code: "LEVEL_B",
        course_title: "Level B - ERE (English Reflexes Enhancement - 30 Topics)",
        day_number: day
      };
    } else {
      throw new Error(`Cannot resolve lesson for Day ${day}!`);
    }

    await setDoc(lessonRef, sanitizeForFirestore(lessonDoc), { merge: true });
    canonicalLessons.push(lessonDoc);
  }
  console.log("  ✅ All 30 canonical lessons ('level_b_day_1'..'30') ensured with level_code: 'LEVEL_B'.");

  // -------------------------------------------------------------------------
  // Step 3: Re-seed Clean 30-Session Cohorts in Firestore
  // -------------------------------------------------------------------------
  console.log("\n[STEP 3] Re-generating 30 Sequential Sessions (starting 2026-09-14 Mon/Wed/Fri)...");
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
      const canonicalLesson = canonicalLessons.find(l => l.day_number === count);
      const lessonTitle = canonicalLesson ? canonicalLesson.lesson_title : `Day ${count} - ERE Reflex Drill`;
      const lessonType = canonicalLesson?.lesson_type || "Reflex & Business Drill";

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

  const audioSettings: CohortAudioSettings = {
    voice_profile_primary: "flux-cliff-en",
    voice_profile_secondary: "vi-VN-Neural2-A",
    voice_profile_en: "flux-cliff-en",
    voice_profile_vi: "vi-VN-Neural2-A",
    language_mode: "EN_THEN_VI",
    auto_advance_delay_sec: 0,
    default_speed: 1.0,
    repeat_count: 1
  };

  // 1. Cohort: cohort_level_b_k30
  const cohortLevelBK30: Cohort = {
    id: "cohort_level_b_k30",
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
    audio_settings: audioSettings,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await setDoc(doc(db, "cohorts", cohortLevelBK30.id), sanitizeForFirestore(cohortLevelBK30));
  console.log(`  ✅ Cohort '${cohortLevelBK30.id}' written to Firestore with 30 sessions.`);

  // 2. Cohort: cohort_level_b_ere_k30
  const cohortLevelBEreK30: Cohort = {
    ...cohortLevelBK30,
    id: "cohort_level_b_ere_k30",
    title: "Level B - ERE (30 Topics)"
  };

  await setDoc(doc(db, "cohorts", cohortLevelBEreK30.id), sanitizeForFirestore(cohortLevelBEreK30));
  console.log(`  ✅ Cohort '${cohortLevelBEreK30.id}' written to Firestore with 30 sessions.`);

  // -------------------------------------------------------------------------
  // Step 4: Verification
  // -------------------------------------------------------------------------
  console.log("\n[STEP 4] Verifying Firestore state...");

  // 1. Query raw Firestore where level_code == 'LEVEL_B'
  const rawQuery = query(collection(db, "lessons"), where("level_code", "==", "LEVEL_B"));
  const rawSnap = await getDocs(rawQuery);
  console.log(`  Raw Firestore query [level_code == 'LEVEL_B']: found ${rawSnap.size} documents.`);
  if (rawSnap.size !== 30) {
    console.error(`  ❌ Expected exactly 30 documents matching level_code == 'LEVEL_B', but got ${rawSnap.size}!`);
    rawSnap.docs.forEach(d => console.log(`     - ${d.id} (day: ${d.data().day_number})`));
  } else {
    console.log("  ✅ Exactly 30 canonical documents have level_code == 'LEVEL_B' in Firestore!");
  }

  // 2. Query getLessonsByLevel('LEVEL_B') via firestoreService
  console.log("\n  Testing firestoreService.getLessonsByLevel('LEVEL_B')...");
  const serviceLessons = await getLessonsByLevel("LEVEL_B", true);
  console.log(`  firestoreService.getLessonsByLevel('LEVEL_B') returned: ${serviceLessons.length} lessons.`);

  let hasDuplicateDay = false;
  const seenDays = new Set<number>();
  for (const l of serviceLessons) {
    if (seenDays.has(l.day_number)) {
      hasDuplicateDay = true;
      console.error(`  ❌ Duplicate day detected: Day ${l.day_number} (${l.id})`);
    }
    seenDays.add(l.day_number);
  }

  if (serviceLessons.length === 30 && !hasDuplicateDay) {
    console.log("  ✅ getLessonsByLevel('LEVEL_B') returned EXACTLY 30 unique lessons (Days 1 to 30) with ZERO duplicates!");
    console.log(`     First: Day ${serviceLessons[0].day_number} (${serviceLessons[0].id}) - "${serviceLessons[0].lesson_title}"`);
    console.log(`     Last:  Day ${serviceLessons[29].day_number} (${serviceLessons[29].id}) - "${serviceLessons[29].lesson_title}"`);
  } else {
    console.error(`  ❌ getLessonsByLevel('LEVEL_B') validation failed! Length: ${serviceLessons.length}, hasDuplicate: ${hasDuplicateDay}`);
  }

  // 3. Query getFirestoreCohorts()
  console.log("\n  Testing firestoreService.getCohorts()...");
  const allCohorts = await getCohorts(undefined, true);
  for (const cId of ["cohort_level_b_k30", "cohort_level_b_ere_k30"]) {
    const c = allCohorts.find(item => item.id === cId);
    if (!c) {
      console.error(`  ❌ Cohort '${cId}' not found in getCohorts()!`);
      continue;
    }
    console.log(`  ✅ Cohort '${c.id}':`);
    console.log(`     Title: "${c.title}" | Course: ${c.course_id} | Level: ${c.level_code}`);
    console.log(`     Total Sessions: ${c.total_sessions} | Sessions in array: ${c.sessions?.length}`);
    console.log(`     Session 1: Day ${c.sessions[0].day_number} (${c.sessions[0].lesson_id}) - "${c.sessions[0].lesson_title}" [${c.sessions[0].status}] on ${c.sessions[0].scheduled_date}`);
    console.log(`     Session 30: Day ${c.sessions[29].day_number} (${c.sessions[29].lesson_id}) - "${c.sessions[29].lesson_title}" [${c.sessions[29].status}] on ${c.sessions[29].scheduled_date}`);

    const isSequential = c.sessions.every((s, idx) => s.day_number === idx + 1 && s.session_number === idx + 1);
    if (isSequential && c.sessions.length === 30) {
      console.log(`     ✅ Sessions are strictly sequential from Day 1 to Day 30!`);
    } else {
      console.error(`     ❌ Sessions are NOT sequential!`);
    }
  }

  console.log("\n==================================================================");
  console.log("🎉 ALL LEVEL B FIXES & RE-SEEDING COMPLETED SUCCESSFULLY!");
  console.log("==================================================================");
}

fixFirestoreLevelBDuplicates()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌ Script failed:", err);
    process.exit(1);
  });
