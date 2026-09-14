import * as fs from 'node:fs';
import * as path from 'node:path';

export interface MiniLesson {
  file: string;
  topic: string;
  transcript: string;
  primary_structure?: string;
  structure_type?: 'sentence_structure' | 'verb_form' | 'tense_reflex';
  structures: string[];
  verb_forms: string[];
  tense: string[];
  examples: Array<{ en: string; vi: string }>;
  notes?: string;
}

export interface RawTopic {
  topic_number: number;
  day_number: number;
  lesson_id: string;
  lesson_title: string;
  source_type: string;
  total_audio_files: number;
  verb_forms: string[];
  sentence_structures: string[];
  tense: string[];
  notes?: string;
  mini_lessons: MiniLesson[];
}

export interface GroupedLesson {
  id: string;
  lesson_id: string;
  course_id: string;
  day_number: number;
  lesson_title: string;
  thematic_module: string;
  data_group: string;
  status: string;
  cohort_day_15: number | null;
  lesson_number_19: number | null;
  verb_forms: string[];
  sentence_structures: string[];
  tense: string[];
  notes?: string;
  updated_at: string;
}

const CATALOG_PATH = path.resolve('scripts/grammar-boost-catalog.json');
const GROUPED_PATH = path.resolve('scripts/grammar-grouped-catalog.json');
const TEMPLATE_PATH = path.resolve('scripts/review-template.html');
const OUTPUT_HTML = path.resolve('review-grammar-boost.html');

export function buildGrammarReviewHtml(): {
  success: boolean;
  outputPath: string;
  outputSizeKb: string;
  stats: {
    totalTopics: number;
    audioTopics: number;
    pendingTopics: number;
    totalAudioFiles: number;
    totalMiniLessons: number;
    totalExamples: number;
  };
} {
  console.log('Building CHUNKS Grammar Boost Reviewer HTML...');

  if (!fs.existsSync(CATALOG_PATH)) {
    throw new Error(`Error: ${CATALOG_PATH} not found`);
  }
  if (!fs.existsSync(GROUPED_PATH)) {
    throw new Error(`Error: ${GROUPED_PATH} not found`);
  }
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Error: ${TEMPLATE_PATH} not found`);
  }

  const catalogData = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const groupedData = JSON.parse(fs.readFileSync(GROUPED_PATH, 'utf8'));
  const templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  const groupedLessonsMap = new Map<number, GroupedLesson>();
  for (const lesson of groupedData.lessons as GroupedLesson[]) {
    groupedLessonsMap.set(lesson.day_number, lesson);
  }

  // Build unified topics array
  const mergedTopics = (catalogData.topics as RawTopic[]).map((t) => {
    const g = groupedLessonsMap.get(t.topic_number);
    const hasAudio = t.source_type === 'audio_boost' && t.total_audio_files > 0;
    return {
      topic_number: t.topic_number,
      day_number: t.day_number || t.topic_number,
      lesson_id: t.lesson_id || g?.lesson_id || `level_b_day_${t.topic_number}`,
      lesson_title: g?.lesson_title || t.lesson_title || `Day ${t.topic_number}`,
      thematic_module: g?.thematic_module || 'General',
      data_group: g?.data_group || (hasAudio ? 'supplemental_7_lessons' : 'pending_4_lessons'),
      status: g?.status || 'active',
      cohort_day_15: g?.cohort_day_15 || null,
      lesson_number_19: g?.lesson_number_19 || null,
      has_audio: hasAudio,
      source_type: t.source_type,
      total_audio_files: t.total_audio_files,
      verb_forms: t.verb_forms || g?.verb_forms || [],
      sentence_structures: t.sentence_structures || g?.sentence_structures || [],
      tense: t.tense || g?.tense || [],
      notes: t.notes || g?.notes || '',
      mini_lessons: t.mini_lessons || [],
    };
  });

  // Calculate statistics
  const totalTopics = mergedTopics.length;
  const audioTopics = mergedTopics.filter((t) => t.has_audio).length;
  const pendingTopics = mergedTopics.filter((t) => !t.has_audio).length;
  let totalAudioFiles = 0;
  let totalMiniLessons = 0;
  let totalExamples = 0;

  for (const t of mergedTopics) {
    totalMiniLessons += t.mini_lessons.length;
    if (t.has_audio) {
      totalAudioFiles += t.mini_lessons.filter((m) => m.file && m.file.endsWith('.mp3')).length;
    }
    for (const m of t.mini_lessons) {
      totalExamples += m.examples?.length || 0;
    }
  }

  const clientPayload = {
    metadata: {
      generated_at: new Date().toISOString(),
      total_topics: totalTopics,
      audio_topics: audioTopics,
      pending_topics: pendingTopics,
      total_audio_files: totalAudioFiles,
      total_mini_lessons: totalMiniLessons,
      total_examples: totalExamples,
      thematic_modules: groupedData.metadata?.thematic_modules || [
        'Onboarding',
        'Office Culture',
        'Operations & Management',
        'Team & Leadership',
        'Professional Acumen',
        'Business & Sales',
      ],
      groups: groupedData.metadata?.groups || {},
    },
    topics: mergedTopics,
  };

  const jsonString = JSON.stringify(clientPayload);
  const placeholder = '/* __GRAMMAR_DATA_PLACEHOLDER__ */ null';

  if (!templateHtml.includes(placeholder)) {
    throw new Error(`Error: Placeholder "${placeholder}" not found in template!`);
  }

  const finalHtml = templateHtml.replace(placeholder, jsonString);
  fs.writeFileSync(OUTPUT_HTML, finalHtml, 'utf8');

  const outputSizeKb = (fs.statSync(OUTPUT_HTML).size / 1024).toFixed(1);
  console.log(`✅ Success! Generated ${OUTPUT_HTML} (${outputSizeKb} KB)`);
  console.log(`📊 Catalog Stats: ${totalTopics} Topics (${audioTopics} with Audio, ${pendingTopics} Pending), ${totalAudioFiles} MP3 files, ${totalMiniLessons} Mini-Lessons, ${totalExamples} Bilingual Examples.`);

  return {
    success: true,
    outputPath: OUTPUT_HTML,
    outputSizeKb,
    stats: {
      totalTopics,
      audioTopics,
      pendingTopics,
      totalAudioFiles,
      totalMiniLessons,
      totalExamples,
    },
  };
}

// Execute if run directly
if (import.meta.main) {
  buildGrammarReviewHtml();
}
