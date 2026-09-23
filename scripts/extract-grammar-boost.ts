import fs from 'fs';
import path from 'path';

// Types
export interface AudioGrammarItem {
  key: string;
  topicDir: string;
  fileName: string;
  topicNumber: number;
  transcript: string;
  grammar_topic: string;
  structures: string[];
  verb_forms: string[];
  tense: string[];
  examples: Array<{ en: string; vi: string }>;
  notes: string;
  processed_at: string;
}

export interface TopicGrammarSummary {
  topic_number: number;
  day_number: number;
  lesson_id: string;
  lesson_title: string;
  source_type: 'audio_boost' | 'pending';
  total_audio_files: number;
  verb_forms: string[];
  sentence_structures: string[];
  tense: string[];
  notes: string;
  mini_lessons: Array<{
    file: string;
    topic: string;
    transcript: string;
    structures: string[];
    verb_forms: string[];
    tense: string[];
    examples: Array<{ en: string; vi: string }>;
    notes: string;
  }>;
}

const AUDIO_ROOT = 'C:\\Users\\gensh\\Downloads\\chunks-grammar\\FULL 30 Topic_P@W\\Grammar Boost\\Grammar Boost';
const CACHE_FILE = path.join(__dirname, '.cache-grammar-transcripts.json');
const CATALOG_JSON = path.join(__dirname, 'grammar-boost-catalog.json');
const CATALOG_MD = path.join(__dirname, 'grammar-boost-catalog.md');
const LEVEL_B_GRAMMAR_FILE = path.join(__dirname, '..', 'src', 'data', 'levelBGrammarData.ts');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('ERROR: GEMINI_API_KEY environment variable is missing!');
  process.exit(1);
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

// Day title mapping from CURRICULUM_CATALOG_LEVEL_B_ERE
const LESSON_TITLES: Record<number, string> = {
  1: "Day 1 - First Day Of Work",
  2: "Day 2 - Viettel",
  3: "Day 3 - Tell me about yourself",
  4: "Day 4 - Smarketing",
  5: "Day 5 - Office Romance",
  6: "Day 6 - Gossipy",
  7: "Day 7 - Electronic mail",
  8: "Day 8 - COVID-19",
  9: "Day 9 - Business trip",
  10: "Day 10 - Project management",
  11: "Day 11 - Stand up meeting",
  12: "Day 12 - Electronic mail (Advanced)",
  13: "Day 13 - Chart analysis",
  14: "Day 14 - Customer complaint",
  15: "Day 15 - Close the deal!",
  16: "Day 16 - Social media",
  17: "Day 17 - Teamwork",
  18: "Day 18 - Salary negotiation",
  19: "Day 19 - EXCEL",
  20: "Day 20 - Year-end party",
  21: "Day 21 - Compensation and benefits",
  22: "Day 22 - Nepotism",
  23: "Day 23 - What KPI stands for?",
  24: "Day 24 - How to write a CV?",
  25: "Day 25 - Small talk",
  26: "Day 26 - Financial picture",
  27: "Day 27 - Shark Tank",
  28: "Day 28 - Never eat alone",
  29: "Day 29 - LinkedIn",
  30: "Day 30 - Farewell party",
};

// 1. Load Cache
function loadCache(): Record<string, AudioGrammarItem> {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (e: any) {
      console.warn('Failed to parse cache, starting fresh:', e.message);
    }
  }
  return {};
}

function saveCache(cache: Record<string, AudioGrammarItem>) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

// 2. Discover all files
interface AudioFileInfo {
  fullPath: string;
  topicDir: string;
  fileName: string;
  topicNumber: number;
  fileIndex: number;
  key: string;
}

function discoverAudioFiles(): AudioFileInfo[] {
  const dirs = fs.readdirSync(AUDIO_ROOT);
  const files: AudioFileInfo[] = [];

  for (const dir of dirs) {
    const dirMatch = dir.match(/Topic\s*(\d+)/i);
    if (!dirMatch) continue;
    const topicNumber = parseInt(dirMatch[1], 10);
    const dirPath = path.join(AUDIO_ROOT, dir);
    if (!fs.statSync(dirPath).isDirectory()) continue;

    const mp3Files = fs.readdirSync(dirPath).filter(f => f.toLowerCase().endsWith('.mp3'));
    for (const f of mp3Files) {
      const idxMatch = f.match(/_(\d+)\.mp3$/i);
      const fileIndex = idxMatch ? parseInt(idxMatch[1], 10) : 0;
      const key = `${dir}/${f}`;
      files.push({
        fullPath: path.join(dirPath, f),
        topicDir: dir,
        fileName: f,
        topicNumber,
        fileIndex,
        key
      });
    }
  }

  // Sort by topicNumber asc, then fileIndex asc
  files.sort((a, b) => {
    if (a.topicNumber !== b.topicNumber) return a.topicNumber - b.topicNumber;
    return a.fileIndex - b.fileIndex;
  });

  return files;
}

const PROMPT = `You are an expert English grammar linguist and transcriber.
Listen to this audio recording of a Vietnamese teacher explaining an English grammar point, sentence structure, verb pattern, or common learner mistake.

Return ONLY a valid JSON object with the following schema:
{
  "transcript": "Verbatim bilingual transcript preserving Vietnamese explanations and English sentences/examples/terms",
  "grammar_topic": "Name of the grammar topic or key pattern explained in this audio",
  "structures": ["Key sentence structures, formulas, or patterns mentioned, e.g. S + V + O, Can I have..."],
  "verb_forms": ["Verb forms, phrasal verbs, collocations, or word usages explained, e.g. look forward to V-ing, pay attention to"],
  "tense": ["Tenses or aspect rules mentioned, e.g. Present Continuous, Past Simple, etc."],
  "examples": [
    {
      "en": "English sentence or phrase example",
      "vi": "Vietnamese meaning or explanation from audio"
    }
  ],
  "notes": "Key pedagogical notes, teacher's tips, common errors to avoid, nuances"
}`;

async function processAudioFileWithGemini(file: AudioFileInfo, retryCount = 0): Promise<AudioGrammarItem> {
  const audioBuffer = fs.readFileSync(file.fullPath);
  const audioBase64 = audioBuffer.toString('base64');

  try {
    const resp = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType: 'audio/mp3', data: audioBase64 } }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      if ((resp.status === 429 || resp.status >= 500) && retryCount < 5) {
        const delay = Math.pow(2, retryCount) * 2000 + Math.floor(Math.random() * 1000);
        console.warn(`[HTTP ${resp.status}] Retrying ${file.key} in ${(delay / 1000).toFixed(1)}s (attempt ${retryCount + 1}/5)...`);
        await new Promise(res => setTimeout(res, delay));
        return processAudioFileWithGemini(file, retryCount + 1);
      }
      throw new Error(`Gemini API error ${resp.status}: ${errText}`);
    }

    const data: any = await resp.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) {
      throw new Error(`Empty response candidate from Gemini for ${file.key}`);
    }

    const parsed = JSON.parse(rawJson);

    // Normalize structures, verb_forms, tense, examples
    const structures: string[] = Array.isArray(parsed.structures)
      ? parsed.structures.map((s: any) => String(s).trim()).filter(Boolean)
      : (parsed.structures ? [String(parsed.structures).trim()] : []);

    const verb_forms: string[] = Array.isArray(parsed.verb_forms)
      ? parsed.verb_forms.map((v: any) => String(v).trim()).filter(Boolean)
      : (parsed.verb_forms ? [String(parsed.verb_forms).trim()] : []);

    const tense: string[] = Array.isArray(parsed.tense)
      ? parsed.tense.map((t: any) => String(t).trim()).filter(Boolean)
      : (parsed.tense ? [String(parsed.tense).trim()] : []);

    const examples: Array<{ en: string; vi: string }> = Array.isArray(parsed.examples)
      ? parsed.examples.map((ex: any) => {
          if (typeof ex === 'string') {
            return { en: ex.trim(), vi: '' };
          }
          return {
            en: String(ex.en || ex.english || '').trim(),
            vi: String(ex.vi || ex.vietnamese || '').trim()
          };
        }).filter(ex => ex.en.length > 0)
      : [];

    return {
      key: file.key,
      topicDir: file.topicDir,
      fileName: file.fileName,
      topicNumber: file.topicNumber,
      transcript: String(parsed.transcript || '').trim(),
      grammar_topic: String(parsed.grammar_topic || '').trim(),
      structures,
      verb_forms,
      tense,
      examples,
      notes: String(parsed.notes || '').trim(),
      processed_at: new Date().toISOString()
    };
  } catch (err: any) {
    if (retryCount < 5) {
      const delay = Math.pow(2, retryCount) * 2500;
      console.warn(`[Network/Parse Error] Retrying ${file.key} in ${(delay / 1000).toFixed(1)}s (attempt ${retryCount + 1}/5): ${err.message}`);
      await new Promise(res => setTimeout(res, delay));
      return processAudioFileWithGemini(file, retryCount + 1);
    }
    throw err;
  }
}

// Concurrency Pool
async function processAllAudio(files: AudioFileInfo[], concurrency = 5) {
  const cache = loadCache();
  const total = files.length;
  let cachedCount = 0;
  let freshCount = 0;
  let failedCount = 0;

  console.log(`\n=============================================================`);
  console.log(`🎧 GRAMMAR BOOST EXTRACTION PIPELINE`);
  console.log(`📁 Total Audio Files: ${total}`);
  console.log(`⚡ Concurrency: ${concurrency}`);
  console.log(`💾 Cache File: ${CACHE_FILE}`);
  console.log(`=============================================================\n`);

  // Count already cached
  for (const file of files) {
    if (cache[file.key]) cachedCount++;
  }
  console.log(`Initial Cache Status: ${cachedCount}/${total} files already processed.`);

  let currentIndex = 0;

  async function worker(workerId: number) {
    while (currentIndex < files.length) {
      const idx = currentIndex++;
      const file = files[idx];

      if (cache[file.key]) {
        // Already cached
        continue;
      }

      const start = Date.now();
      try {
        const result = await processAudioFileWithGemini(file);
        cache[file.key] = result;
        freshCount++;
        saveCache(cache); // Save on each completion for zero loss

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        const percent = (((cachedCount + freshCount) / total) * 100).toFixed(1);
        console.log(`[W${workerId}] [${cachedCount + freshCount}/${total}] (${percent}%) ${file.key} -> "${result.grammar_topic}" in ${elapsed}s`);
      } catch (err: any) {
        failedCount++;
        console.error(`[W${workerId}] FAILED ${file.key}:`, err.message);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  console.log(`\n=============================================================`);
  console.log(`✅ AUDIO EXTRACTION FINISHED`);
  console.log(`Total: ${total} | Cached: ${cachedCount} | Fresh: ${freshCount} | Failed: ${failedCount}`);
  console.log(`=============================================================\n`);

  return cache;
}

// 3. Aggregate by Topic
function aggregateTopics(cache: Record<string, AudioGrammarItem>, files: AudioFileInfo[]): TopicGrammarSummary[] {
  const topicMap: Record<number, AudioGrammarItem[]> = {};

  for (const file of files) {
    const item = cache[file.key];
    if (!item) continue;
    if (!topicMap[item.topicNumber]) {
      topicMap[item.topicNumber] = [];
    }
    topicMap[item.topicNumber].push(item);
  }

  const summaries: TopicGrammarSummary[] = [];

  for (let day = 1; day <= 30; day++) {
    const lessonTitle = LESSON_TITLES[day] || `Day ${day}`;
    const lessonId = `level_b_day_${day}`;
    const items = topicMap[day] || [];

    if (items.length > 0) {
      // Audio boost available
      const allStructures = new Set<string>();
      const allVerbForms = new Set<string>();
      const allTenses = new Set<string>();
      const notesList: string[] = [];

      for (const it of items) {
        it.structures.forEach(s => allStructures.add(s));
        it.verb_forms.forEach(v => allVerbForms.add(v));
        it.tense.forEach(t => allTenses.add(t));
        if (it.notes) {
          notesList.push(`- **${it.grammar_topic || it.fileName}**: ${it.notes}`);
        }
      }

      summaries.push({
        topic_number: day,
        day_number: day,
        lesson_id: lessonId,
        lesson_title: lessonTitle,
        source_type: 'audio_boost',
        total_audio_files: items.length,
        verb_forms: Array.from(allVerbForms),
        sentence_structures: Array.from(allStructures),
        tense: Array.from(allTenses),
        notes: notesList.join('\n'),
        mini_lessons: items.map(it => ({
          file: it.fileName,
          topic: it.grammar_topic,
          transcript: it.transcript,
          structures: it.structures,
          verb_forms: it.verb_forms,
          tense: it.tense,
          examples: it.examples,
          notes: it.notes
        }))
      });
    } else {
      // Pending topic (16, 19, 22, 28)
      summaries.push({
        topic_number: day,
        day_number: day,
        lesson_id: lessonId,
        lesson_title: lessonTitle,
        source_type: 'pending',
        total_audio_files: 0,
        verb_forms: [],
        sentence_structures: [],
        tense: [],
        notes: `Topic ${day} (${lessonTitle}) audio not present in Grammar Boost audio files. Curriculum chunk extraction pending.`,
        mini_lessons: []
      });
    }
  }

  return summaries;
}

// 4. Generate JSON and Markdown Catalogs
function generateDeliverables(summaries: TopicGrammarSummary[], totalAudio: number) {
  // 4.1 JSON Catalog
  const catalogObj = {
    metadata: {
      generated_at: new Date().toISOString(),
      source_directory: AUDIO_ROOT,
      total_topics: 30,
      audio_topics_count: summaries.filter(s => s.source_type === 'audio_boost').length,
      pending_topics_count: summaries.filter(s => s.source_type === 'pending').length,
      total_audio_files: totalAudio,
      model_used: "gemini-2.5-flash"
    },
    topics: summaries
  };

  fs.writeFileSync(CATALOG_JSON, JSON.stringify(catalogObj, null, 2), 'utf-8');
  console.log(`📄 Saved JSON catalog to: ${CATALOG_JSON}`);

  // 4.2 Markdown Catalog
  const mdLines: string[] = [];
  mdLines.push(`# 📚 CHUNKS Level B (ERE) Grammar Boost Catalog`);
  mdLines.push(`\n> **Source**: \`${AUDIO_ROOT}\``);
  mdLines.push(`> **Model**: \`gemini-2.5-flash\` | **Generated**: ${new Date().toLocaleDateString('vi-VN')}`);
  mdLines.push(`> **Coverage**: ${summaries.filter(s => s.source_type === 'audio_boost').length}/30 Topics with native teacher audio (${totalAudio} MP3 mini-lessons).\n`);

  mdLines.push(`## 📊 Executive Summary Table\n`);
  mdLines.push(`| Day | Lesson Title | Audio Files | Key Topics Covered | Top Structures / Patterns |`);
  mdLines.push(`| :---: | :--- | :---: | :--- | :--- |`);

  for (const s of summaries) {
    if (s.source_type === 'audio_boost') {
      const topTopics = s.mini_lessons.map(m => m.topic).filter(Boolean).slice(0, 3).join(', ');
      const topStructs = s.sentence_structures.slice(0, 2).join('; ') || s.verb_forms.slice(0, 2).join('; ') || 'N/A';
      mdLines.push(`| **Day ${s.day_number}** | ${s.lesson_title} | **${s.total_audio_files}** | ${topTopics} | \`${topStructs}\` |`);
    } else {
      mdLines.push(`| **Day ${s.day_number}** | ${s.lesson_title} | *0 (Pending)* | *Curriculum Chunks (Pending)* | *Pending* |`);
    }
  }

  mdLines.push(`\n---\n`);
  mdLines.push(`## 📖 Detailed Grammar Points by Topic\n`);

  for (const s of summaries) {
    mdLines.push(`### Day ${s.day_number}: ${s.lesson_title}`);
    if (s.source_type === 'pending') {
      mdLines.push(`\n*Audio not included in Grammar Boost package. Curriculum chunk extraction pending for this topic.*\n`);
      continue;
    }

    mdLines.push(`\n- **Audio Mini-Lessons**: ${s.total_audio_files} recordings`);
    if (s.sentence_structures.length > 0) {
      mdLines.push(`- **Sentence Structures**: ${s.sentence_structures.map(x => `\`${x}\``).join(', ')}`);
    }
    if (s.verb_forms.length > 0) {
      mdLines.push(`- **Verb Forms / Patterns**: ${s.verb_forms.map(x => `\`${x}\``).join(', ')}`);
    }
    if (s.tense.length > 0) {
      mdLines.push(`- **Tense & Aspect**: ${s.tense.map(x => `\`${x}\``).join(', ')}`);
    }

    mdLines.push(`\n#### 🎙️ Verbatim Audio Lessons & Transcripts\n`);

    for (let i = 0; i < s.mini_lessons.length; i++) {
      const ml = s.mini_lessons[i];
      mdLines.push(`##### ${i + 1}. \`${ml.file}\` — ${ml.topic || 'Grammar Point'}`);
      mdLines.push(`\n**Verbatim Teacher Explanation (Vietnamese + English):**`);
      mdLines.push(`> "${ml.transcript}"\n`);

      if (ml.structures.length > 0) {
        mdLines.push(`- **Structures**: ${ml.structures.map(x => `\`${x}\``).join(', ')}`);
      }
      if (ml.verb_forms.length > 0) {
        mdLines.push(`- **Verb Forms**: ${ml.verb_forms.map(x => `\`${x}\``).join(', ')}`);
      }
      if (ml.tense.length > 0) {
        mdLines.push(`- **Tense**: ${ml.tense.map(x => `\`${x}\``).join(', ')}`);
      }

      if (ml.examples.length > 0) {
        mdLines.push(`\n**Examples:**`);
        for (const ex of ml.examples) {
          mdLines.push(`- 🇬🇧 *${ex.en}* ${ex.vi ? `— 🇻🇳 ${ex.vi}` : ''}`);
        }
      }

      if (ml.notes) {
        mdLines.push(`\n**Teacher Notes:** ${ml.notes}`);
      }
      mdLines.push(`\n`);
    }

    mdLines.push(`\n---\n`);
  }

  fs.writeFileSync(CATALOG_MD, mdLines.join('\n'), 'utf-8');
  console.log(`📄 Saved Markdown catalog to: ${CATALOG_MD}`);
}

// 5. Update src/data/levelBGrammarData.ts
function updateLevelBGrammarCatalog(summaries: TopicGrammarSummary[]) {
  // Read current file to keep imports and helpers
  const currentContent = fs.readFileSync(LEVEL_B_GRAMMAR_FILE, 'utf-8');

  // Generate the new array items
  const catalogEntries = summaries.map(s => {
    // If pending, check if current file has existing data or leave clean template
    return `  {
    id: "grammar_level_b_day_${s.day_number}",
    lesson_id: "${s.lesson_id}",
    course_id: "course_level_b",
    day_number: ${s.day_number},
    lesson_title: ${JSON.stringify(s.lesson_title)},
    verb_forms: ${JSON.stringify(s.verb_forms, null, 6)},
    sentence_structures: ${JSON.stringify(s.sentence_structures, null, 6)},
    tense: ${JSON.stringify(s.tense, null, 6)},
    notes: ${JSON.stringify(s.notes.slice(0, 1000))}
  }`;
  });

  const updatedFileContent = `import { LessonGrammarDoc } from '../types';

/**
 * Level B - ERE (English Reflexes Enhancement - 30 Topics) Canonical Grammar Catalog
 * Auto-extracted from Grammar Boost teacher audio dataset (253 MP3 files)
 * Verified with Gemini 2.5 Flash verbatim bilingual audio transcription
 * Updated: ${new Date().toISOString()}
 */
export const LEVEL_B_ERE_GRAMMAR_CATALOG: LessonGrammarDoc[] = [
${catalogEntries.join(',\n')}
];

/**
 * Fast lookup helper for grammar by day number (1..30)
 */
export function getGrammarForDay(dayNumber: number): LessonGrammarDoc | undefined {
  return LEVEL_B_ERE_GRAMMAR_CATALOG.find(g => g.day_number === dayNumber);
}

/**
 * Fast lookup helper for grammar by lesson ID (e.g. "level_b_day_5", "level_b_ere_day_5", "day 5")
 */
export function getGrammarForLesson(lessonId: string): LessonGrammarDoc | undefined {
  if (!lessonId) return undefined;
  const clean = lessonId.trim().toLowerCase();

  // 1. Direct match by lesson_id or id
  const direct = LEVEL_B_ERE_GRAMMAR_CATALOG.find(g => 
    g.lesson_id.toLowerCase() === clean || 
    g.id.toLowerCase() === clean
  );
  if (direct) return direct;

  // 2. Extract day number from id (e.g. "level_b_day_1", "level_b_ere_day_1", "day_1", "day 1")
  const dayMatch = clean.match(/day[_\\s-]*(\\d+)/i);
  if (dayMatch) {
    const dayNum = parseInt(dayMatch[1], 10);
    return getGrammarForDay(dayNum);
  }

  return undefined;
}
`;

  fs.writeFileSync(LEVEL_B_GRAMMAR_FILE, updatedFileContent, 'utf-8');
  console.log(`💾 Updated Level B Grammar Catalog in: ${LEVEL_B_GRAMMAR_FILE}`);
}

// Main Execution
async function main() {
  const files = discoverAudioFiles();
  console.log(`Discovered ${files.length} audio files across 26 topic directories.`);

  // Process all audio with concurrency 5 and caching
  const cache = await processAllAudio(files, 5);

  // Aggregate summaries
  const summaries = aggregateTopics(cache, files);

  // Generate JSON & Markdown
  generateDeliverables(summaries, files.length);

  // Update src/data/levelBGrammarData.ts
  updateLevelBGrammarCatalog(summaries);

  console.log('\n🎉 ALL DELIVERABLES GENERATED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('Fatal Pipeline Error:', err);
  process.exit(1);
});
