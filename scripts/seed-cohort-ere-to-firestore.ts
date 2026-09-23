import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { CURRICULUM_CATALOG_LEVEL_B_ERE } from "../src/data/levelBEreData";
import { Cohort, ClassSession } from "../src/types";

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

async function seedCohortEreToFirestore() {
  console.log("==================================================");
  console.log("SEED COHORT: Level B - ERE (30 Topics) TO FIRESTORE");
  console.log("Database Project:", firebaseConfig.projectId);
  console.log("==================================================");

  // 1. Prepare lessons catalog
  console.log("\n1. Resolving lessons catalog for Level B - ERE (30 Topics)...");
  const lessonsMap = new Map<number, { id: string; title: string; type: string }>();

  // Check in Firestore first, fallback to CURRICULUM_CATALOG_LEVEL_B_ERE
  for (let day = 1; day <= 30; day++) {
    const lessonId = `level_b_ere_day_${day}`;
    try {
      const snap = await getDoc(doc(db, "lessons", lessonId));
      if (snap.exists()) {
        const data = snap.data();
        lessonsMap.set(day, {
          id: snap.id,
          title: data.lesson_title || `Day ${day} - Reflex Drill`,
          type: data.lesson_type || "Standard Lesson"
        });
      }
    } catch (e) {
      // ignore
    }

    if (!lessonsMap.has(day)) {
      const local = CURRICULUM_CATALOG_LEVEL_B_ERE.find(l => l.day_number === day || l.id === lessonId);
      if (local) {
        lessonsMap.set(day, {
          id: local.id,
          title: local.lesson_title,
          type: local.lesson_type || "Standard Lesson"
        });
      } else {
        lessonsMap.set(day, {
          id: lessonId,
          title: `Day ${day} - ERE Spoken Reflexes`,
          type: "Standard Lesson"
        });
      }
    }
  }

  console.log(`   Found metadata for ${lessonsMap.size}/30 lessons.`);

  // 2. Generate 30 sessions across Mon, Wed, Fri starting from 2026-09-14
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
  const maxSafetyLoop = 730;

  while (count <= 30 && safetyLoop < maxSafetyLoop) {
    safetyLoop++;
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    const isoDate = `${y}-${m}-${d}`;
    const dayOfWeek = current.getDay();

    if (targetDays.has(dayOfWeek)) {
      const meta = lessonsMap.get(count) || {
        id: `level_b_ere_day_${count}`,
        title: `Day ${count} - ERE Spoken Reflexes`,
        type: "Standard Lesson"
      };

      sessions.push({
        session_number: count,
        scheduled_date: isoDate,
        day_of_week: INT_TO_DAY[dayOfWeek],
        start_time: startTime,
        end_time: endTime,
        day_number: count,
        lesson_id: meta.id,
        lesson_title: meta.title,
        lesson_type: meta.type,
        status: count === 1 ? "in_progress" : "scheduled"
      });
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  if (sessions.length !== 30) {
    throw new Error(`Expected 30 sessions generated, but got ${sessions.length}`);
  }

  console.log(`   ✅ Generated ${sessions.length} sessions:`);
  console.log(`      First: Session 1 on ${sessions[0].scheduled_date} (${sessions[0].day_of_week}) - "${sessions[0].lesson_title}"`);
  console.log(`      Mid:   Session 15 on ${sessions[14].scheduled_date} (${sessions[14].day_of_week}) - "${sessions[14].lesson_title}"`);
  console.log(`      Last:  Session 30 on ${sessions[29].scheduled_date} (${sessions[29].day_of_week}) - "${sessions[29].lesson_title}"`);

  // 3. Construct Cohort document
  const cohortId = "cohort_level_b_ere_k30";
  const cohortData: Cohort = {
    id: cohortId,
    title: "Level B - ERE Speaking & Reflex Masterclass (30 Topics)",
    level_code: "LEVEL_B_ERE",
    course_id: "course_level_b_ere",
    teacher_id: "teacher_genshai",
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

  // 4. Save to Firestore
  console.log(`\n2. Saving Cohort to Firestore 'cohorts/${cohortId}'...`);
  const cohortRef = doc(db, "cohorts", cohortId);
  await setDoc(cohortRef, sanitizeForFirestore(cohortData), { merge: true });

  console.log("==================================================");
  console.log(`🎉 SUCCESS: Cohort '${cohortId}' saved to Firestore!`);
  console.log(`- Title: ${cohortData.title}`);
  console.log(`- Level: ${cohortData.level_code} | Course ID: ${cohortData.course_id}`);
  console.log(`- Total Sessions: ${cohortData.total_sessions}`);
  console.log(`- Date Range: ${sessions[0].scheduled_date} -> ${sessions[29].scheduled_date}`);
  console.log("==================================================");
}

seedCohortEreToFirestore()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Failed to seed cohort to Firestore:", err);
    process.exit(1);
  });
