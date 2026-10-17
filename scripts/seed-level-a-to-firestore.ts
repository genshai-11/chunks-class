import { doc, setDoc } from 'firebase/firestore';
import { db } from '../src/services/firestoreService';
import { CURRICULUM_CATALOG_LEVEL_A } from '../src/data/levelAData';
import { getLevelAGrammarForLesson } from '../src/data/levelAGrammarData';
import { Course, LessonDoc } from '../src/types';

function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_key, value) => {
    return value === undefined ? null : value;
  }));
}

async function seedLevelAToFirestore() {
  console.log('====================================================');
  console.log('SEED LEVEL A CURRICULUM & GRAMMAR TO FIRESTORE');
  console.log('Total Lessons to seed:', CURRICULUM_CATALOG_LEVEL_A.length);
  console.log('====================================================');

  // 1. Seed Course Document
  const totalChunks = CURRICULUM_CATALOG_LEVEL_A.reduce(
    (sum, l) => sum + (l.total_chunks || l.chunks.length),
    0
  );

  const courseA: Course = {
    id: 'course_level_a',
    level_code: 'LEVEL_A',
    title: 'Level A - Foundation English Chunks',
    description: '16 Lessons (Word List + Days 1..15) with conversational and survival chunks.',
    total_days: CURRICULUM_CATALOG_LEVEL_A.length,
    total_chunks: totalChunks,
    default_sessions_count: 16,
    source: 'Genshai Foundation Curriculum (ERES Design)',
    is_active: true
  };

  console.log('\n1. Writing Course document: courses/course_level_a...');
  await setDoc(doc(db, 'courses', courseA.id), sanitizeForFirestore(courseA), { merge: true });
  console.log('   ✅ Course course_level_a updated successfully.');

  // 2. Iterate and write each lesson
  console.log('\n2. Writing 16 Lesson documents to /lessons collection...');

  let totalCommittedChunks = 0;
  for (let i = 0; i < CURRICULUM_CATALOG_LEVEL_A.length; i++) {
    const rawLesson = CURRICULUM_CATALOG_LEVEL_A[i];
    const gDoc = getLevelAGrammarForLesson(rawLesson.id);

    const grammarData = gDoc ? {
      verb_forms: gDoc.verb_forms || [],
      sentence_structures: gDoc.sentence_structures || [],
      tense: gDoc.tense || [],
      grammar_points: gDoc.grammar_points || [],
      notes: gDoc.notes || '',
      status: gDoc.status || 'active'
    } : null;

    const hasGrammar = Boolean(grammarData && (
      (grammarData.grammar_points && grammarData.grammar_points.length > 0) ||
      grammarData.sentence_structures.length > 0 ||
      grammarData.verb_forms.length > 0 ||
      grammarData.tense.length > 0
    ));

    const cleanLessonData: Record<string, any> = {
      id: rawLesson.id,
      course_id: 'course_level_a',
      level_code: 'LEVEL_A',
      day_number: rawLesson.day_number,
      lesson_title: rawLesson.lesson_title,
      lesson_type: rawLesson.lesson_type,
      total_chunks: rawLesson.chunks.length,
      chunks_count: rawLesson.chunks.length,
      has_grammar: hasGrammar,
      categories: rawLesson.categories || Array.from(new Set(rawLesson.chunks.map(c => c.category))),
      chunks: rawLesson.chunks,
      grammar: grammarData,
      source_files: rawLesson.source_files || [],
      created_at: rawLesson.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const targetRef = doc(db, 'lessons', rawLesson.id);
    await setDoc(targetRef, sanitizeForFirestore(cleanLessonData));

    totalCommittedChunks += rawLesson.chunks.length;
    console.log(
      `   [${i + 1}/${CURRICULUM_CATALOG_LEVEL_A.length}] Committed ${rawLesson.id} ` +
      `| Day ${rawLesson.day_number} | Chunks: ${rawLesson.chunks.length} ` +
      `| Grammar: ${hasGrammar ? `YES (${grammarData?.grammar_points?.length || 0} points)` : 'NO'}`
    );
  }

  console.log('\n====================================================');
  console.log('✅ ALL 16 LEVEL A LESSONS COMMITTED SUCCESSFULLY!');
  console.log('Total Chunks Seeded:', totalCommittedChunks);
  console.log('====================================================');
  process.exit(0);
}

seedLevelAToFirestore().catch(err => {
  console.error('❌ Error during seeding Level A to Firestore:', err);
  process.exit(1);
});
