import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildGrammarReviewHtml } from './build-grammar-review-html';
import { syncGrammarToFirestore } from './sync-grammar-to-firestore';

const PORT = Number(process.env.PORT) || 3333;
const AUDIO_BASE_DIR = process.env.AUDIO_DIR || 'C:\\Users\\gensh\\Downloads\\chunks-grammar\\Grammar Boost\\Grammar Boost';
const ROOT_DIR = path.resolve('.');
const HTML_FILE = path.join(ROOT_DIR, 'review-grammar-boost.html');
const CATALOG_JSON = path.join(ROOT_DIR, 'scripts', 'grammar-boost-catalog.json');
const GROUPED_JSON = path.join(ROOT_DIR, 'scripts', 'grammar-grouped-catalog.json');
const LEVEL_B_DATA_PATH = path.join(ROOT_DIR, 'src', 'data', 'levelBGrammarData.ts');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, *',
};

console.log('--------------------------------------------------');
console.log('  CHUNKS Grammar Boost Review Server Initializing ');
console.log('--------------------------------------------------');
console.log(`📁 Project Root : ${ROOT_DIR}`);
console.log(`📄 HTML File    : ${HTML_FILE} (${fs.existsSync(HTML_FILE) ? 'Found' : 'Not generated yet'})`);
console.log(`🎧 Audio Dir    : ${AUDIO_BASE_DIR} (${fs.existsSync(AUDIO_BASE_DIR) ? 'Accessible' : 'Not found'})`);

/**
 * Recomputes the topic-level summary (1-to-1 canonical rule)
 */
function recomputeTopicSummary(topic: any) {
  const sentences: string[] = [];
  const verbs: string[] = [];
  const tenses: string[] = [];
  let audioCount = 0;

  for (const m of topic.mini_lessons || []) {
    if (!m.structure_type) {
      m.structure_type = 'sentence_structure';
    }
    m.primary_structure = (m.primary_structure || m.topic || '').trim();

    if (m.structure_type === 'sentence_structure') {
      if (m.primary_structure) sentences.push(m.primary_structure);
      m.structures = [m.primary_structure];
      m.verb_forms = [];
      m.tense = [];
    } else if (m.structure_type === 'verb_form') {
      if (m.primary_structure) verbs.push(m.primary_structure);
      m.verb_forms = [m.primary_structure];
      m.structures = [];
      m.tense = [];
    } else if (m.structure_type === 'tense_reflex') {
      if (m.primary_structure) tenses.push(m.primary_structure);
      m.tense = [m.primary_structure];
      m.structures = [];
      m.verb_forms = [];
    }

    if (m.file && m.file.toLowerCase().endsWith('.mp3')) {
      audioCount++;
    }
  }

  topic.sentence_structures = sentences;
  topic.verb_forms = verbs;
  topic.tense = tenses;
  topic.total_audio_files = audioCount;
  if (audioCount > 0) {
    topic.source_type = 'audio_boost';
  }
}

/**
 * Persists all files synchronously:
 * 1. scripts/grammar-boost-catalog.json
 * 2. scripts/grammar-grouped-catalog.json
 * 3. src/data/levelBGrammarData.ts
 * 4. review-grammar-boost.html
 */
function syncAllDataFiles(catalog: any, affectedTopicNumber: number): any {
  // 1. Find and recompute affected topic
  const targetTopic = (catalog.topics || []).find(
    (t: any) => t.topic_number === affectedTopicNumber || t.day_number === affectedTopicNumber
  );
  if (targetTopic) {
    recomputeTopicSummary(targetTopic);
  }

  // 2. Update catalog metadata
  let totalStructures = 0;
  let totalAudio = 0;
  for (const t of catalog.topics || []) {
    totalStructures += (t.mini_lessons || []).length;
    for (const m of t.mini_lessons || []) {
      if (m.file && m.file.toLowerCase().endsWith('.mp3')) {
        totalAudio++;
      }
    }
  }

  catalog.metadata = {
    ...catalog.metadata,
    last_audit: new Date().toISOString(),
    total_structures: totalStructures,
    total_audio_files: totalAudio,
    one_to_one_rule: '1 audio file = exactly 1 primary target grammar structure',
  };

  // Write scripts/grammar-boost-catalog.json
  fs.writeFileSync(CATALOG_JSON, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`💾 [Sync] Updated ${CATALOG_JSON}`);

  // 3. Update scripts/grammar-grouped-catalog.json
  if (fs.existsSync(GROUPED_JSON)) {
    try {
      const grouped = JSON.parse(fs.readFileSync(GROUPED_JSON, 'utf8'));
      const topicMap = new Map<number, any>();
      catalog.topics.forEach((t: any) => topicMap.set(t.day_number || t.topic_number, t));

      grouped.lessons.forEach((l: any) => {
        const t = topicMap.get(l.day_number);
        if (t) {
          l.sentence_structures = [...t.sentence_structures];
          l.verb_forms = [...t.verb_forms];
          l.tense = [...t.tense];
          if (t.notes) l.notes = t.notes;
          l.updated_at = new Date().toISOString();
        }
      });

      fs.writeFileSync(GROUPED_JSON, JSON.stringify(grouped, null, 2), 'utf8');
      console.log(`💾 [Sync] Updated ${GROUPED_JSON}`);
    } catch (err: any) {
      console.error(`⚠️ [Sync Error] Grouped catalog update failed:`, err.message);
    }
  }

  // 4. Update src/data/levelBGrammarData.ts
  try {
    const tsEntries = catalog.topics.map((t: any) => {
      return `  {
    id: "grammar_level_b_day_${t.day_number || t.topic_number}",
    lesson_id: "${t.lesson_id}",
    course_id: "course_level_b",
    day_number: ${t.day_number || t.topic_number},
    lesson_title: ${JSON.stringify(t.lesson_title)},
    verb_forms: ${JSON.stringify(t.verb_forms || [], null, 6)},
    sentence_structures: ${JSON.stringify(t.sentence_structures || [], null, 6)},
    tense: ${JSON.stringify(t.tense || [], null, 6)},
    notes: ${JSON.stringify(t.notes || '')}
  }`;
    });

    const tsContent = `import { LessonGrammarDoc } from '../types';

/**
 * Level B - ERE (English Reflexes Enhancement - 30 Topics) Canonical Grammar Catalog
 * STRICT 1-TO-1 ALIGNMENT: 1 Audio Recording = Exactly 1 Primary Target Grammar Structure
 * Total 30 Days: 253 Audio Mini-Lessons + 16 Curated Manual Lessons = 269 Total Focus Formulas
 * Partitioned cleanly into sentence_structures, verb_forms, and tense without duplicate bloat.
 * Last Audit & Update: ${new Date().toISOString()}
 */
export const LEVEL_B_ERE_GRAMMAR_CATALOG: LessonGrammarDoc[] = [
${tsEntries.join(',\n')}
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

    fs.writeFileSync(LEVEL_B_DATA_PATH, tsContent, 'utf8');
    console.log(`💾 [Sync] Updated ${LEVEL_B_DATA_PATH}`);
  } catch (err: any) {
    console.error(`⚠️ [Sync Error] levelBGrammarData.ts update failed:`, err.message);
  }

  // 5. Rebuild review-grammar-boost.html
  try {
    buildGrammarReviewHtml();
    console.log(`💾 [Sync] Rebuilt ${HTML_FILE}`);
  } catch (err: any) {
    console.error(`⚠️ [Sync Error] HTML rebuild failed:`, err.message);
  }

  return targetTopic;
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const rawPathname = url.pathname;
    let pathname: string;
    try {
      pathname = decodeURIComponent(rawPathname);
    } catch {
      pathname = rawPathname;
    }

    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // 1. Root & HTML Document
    if (pathname === '/' || pathname === '/index.html' || pathname === '/review-grammar-boost.html') {
      if (!fs.existsSync(HTML_FILE)) {
        try {
          buildGrammarReviewHtml();
        } catch (e: any) {
          return new Response(
            '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;">' +
            '<h2>review-grammar-boost.html generation failed</h2>' +
            `<pre>${e.message}</pre>` +
            '</body></html>',
            {
              status: 500,
              headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
            }
          );
        }
      }
      const file = Bun.file(HTML_FILE);
      return new Response(file, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
          ...corsHeaders,
        },
      });
    }

    // 2. Audio Streaming: /audio/Topic 1/1en_Gr_01_1.mp3
    if (pathname.startsWith('/audio/')) {
      const relativeAudioPath = pathname.slice('/audio/'.length);
      const normalizedSub = path.normalize(relativeAudioPath).replace(/^(\.\.[\/\\])+/, '');
      const fullAudioPath = path.join(AUDIO_BASE_DIR, normalizedSub);

      const file = Bun.file(fullAudioPath);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=86400',
            ...corsHeaders,
          },
        });
      }

      // Case-insensitive / normalized fallback if folder has different casing
      if (normalizedSub.includes('/') || normalizedSub.includes('\\')) {
        const parts = normalizedSub.split(/[/\\]/);
        const folderPart = parts[0];
        const filePart = parts.slice(1).join('/');

        const topicMatch = folderPart.match(/topic\s*(\d+)/i);
        if (topicMatch) {
          const canonicalFolder = `Topic ${topicMatch[1]}`;
          const fallbackPath = path.join(AUDIO_BASE_DIR, canonicalFolder, filePart);
          const fallbackFile = Bun.file(fallbackPath);
          if (await fallbackFile.exists()) {
            return new Response(fallbackFile, {
              headers: {
                'Content-Type': 'audio/mpeg',
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=86400',
                ...corsHeaders,
              },
            });
          }
        }
      }

      return new Response(`Audio file not found: ${normalizedSub}`, {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          ...corsHeaders,
        },
      });
    }

    // 3. API Health & Status
    if (pathname === '/api/health') {
      const audioDirExists = fs.existsSync(AUDIO_BASE_DIR);
      let audioFileCount = 0;
      if (audioDirExists) {
        try {
          const dirs = fs.readdirSync(AUDIO_BASE_DIR);
          for (const d of dirs) {
            const p = path.join(AUDIO_BASE_DIR, d);
            if (fs.statSync(p).isDirectory()) {
              audioFileCount += fs.readdirSync(p).filter(f => f.endsWith('.mp3')).length;
            }
          }
        } catch {
          // ignore
        }
      }

      return Response.json({
        status: 'ok',
        server: 'CHUNKS Grammar Boost Reviewer',
        port: PORT,
        html_exists: fs.existsSync(HTML_FILE),
        audio_dir: AUDIO_BASE_DIR,
        audio_dir_accessible: audioDirExists,
        audio_files_found: audioFileCount,
        live_editor: true,
        timestamp: new Date().toISOString(),
      }, {
        headers: corsHeaders,
      });
    }

    // 4. API Catalog
    if (pathname === '/api/catalog') {
      const file = Bun.file(CATALOG_JSON);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...corsHeaders,
          },
        });
      }
      return Response.json({ error: 'Catalog JSON not found' }, { status: 404, headers: corsHeaders });
    }

    if (pathname === '/api/grouped-catalog') {
      const file = Bun.file(GROUPED_JSON);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...corsHeaders,
          },
        });
      }
      return Response.json({ error: 'Grouped catalog JSON not found' }, { status: 404, headers: corsHeaders });
    }

    // ==========================================
    // 5. LIVE EDITOR APIS
    // ==========================================

    // POST /api/save-mini-lesson
    if (pathname === '/api/save-mini-lesson' && req.method === 'POST') {
      try {
        const body = await req.json();
        const { topic_number, mini_lesson_index, mini_lesson } = body;

        if (typeof topic_number !== 'number' || typeof mini_lesson_index !== 'number' || !mini_lesson) {
          return Response.json({
            success: false,
            error: 'Missing or invalid parameters: topic_number, mini_lesson_index, and mini_lesson are required.',
          }, { status: 400, headers: corsHeaders });
        }

        if (!fs.existsSync(CATALOG_JSON)) {
          return Response.json({ success: false, error: 'Catalog JSON file not found.' }, { status: 500, headers: corsHeaders });
        }

        const catalog = JSON.parse(fs.readFileSync(CATALOG_JSON, 'utf8'));
        const topic = (catalog.topics || []).find(
          (t: any) => t.topic_number === topic_number || t.day_number === topic_number
        );

        if (!topic) {
          return Response.json({
            success: false,
            error: `Topic number ${topic_number} not found in catalog.`,
          }, { status: 404, headers: corsHeaders });
        }

        if (!topic.mini_lessons || mini_lesson_index < 0 || mini_lesson_index >= topic.mini_lessons.length) {
          return Response.json({
            success: false,
            error: `mini_lesson_index ${mini_lesson_index} is out of bounds (0..${(topic.mini_lessons || []).length - 1}).`,
          }, { status: 400, headers: corsHeaders });
        }

        // Clean and update mini-lesson
        const existing = topic.mini_lessons[mini_lesson_index];
        const updatedMini = {
          ...existing,
          ...mini_lesson,
          file: mini_lesson.file || existing.file,
          topic: (mini_lesson.topic || existing.topic || '').trim(),
          transcript: (mini_lesson.transcript || existing.transcript || '').trim(),
          primary_structure: (mini_lesson.primary_structure || existing.primary_structure || '').trim(),
          structure_type: mini_lesson.structure_type || existing.structure_type || 'sentence_structure',
          examples: Array.isArray(mini_lesson.examples) ? mini_lesson.examples : existing.examples || [],
          notes: typeof mini_lesson.notes === 'string' ? mini_lesson.notes.trim() : (existing.notes || ''),
        };

        topic.mini_lessons[mini_lesson_index] = updatedMini;

        // Perform full file synchronization and HTML rebuild
        const updatedTopic = syncAllDataFiles(catalog, topic_number);

        return Response.json({
          success: true,
          message: 'Saved successfully',
          topic: updatedTopic,
          mini_lesson: updatedMini,
          mini_lesson_index,
        }, { headers: corsHeaders });
      } catch (err: any) {
        console.error('Error saving mini lesson:', err);
        return Response.json({
          success: false,
          error: err.message || 'Internal server error while saving mini lesson',
        }, { status: 500, headers: corsHeaders });
      }
    }

    // POST /api/add-mini-lesson
    if (pathname === '/api/add-mini-lesson' && req.method === 'POST') {
      try {
        const body = await req.json();
        const { topic_number, mini_lesson } = body;

        if (typeof topic_number !== 'number' || !mini_lesson) {
          return Response.json({
            success: false,
            error: 'Missing or invalid parameters: topic_number and mini_lesson are required.',
          }, { status: 400, headers: corsHeaders });
        }

        if (!fs.existsSync(CATALOG_JSON)) {
          return Response.json({ success: false, error: 'Catalog JSON file not found.' }, { status: 500, headers: corsHeaders });
        }

        const catalog = JSON.parse(fs.readFileSync(CATALOG_JSON, 'utf8'));
        const topic = (catalog.topics || []).find(
          (t: any) => t.topic_number === topic_number || t.day_number === topic_number
        );

        if (!topic) {
          return Response.json({
            success: false,
            error: `Topic number ${topic_number} not found in catalog.`,
          }, { status: 404, headers: corsHeaders });
        }

        if (!topic.mini_lessons) {
          topic.mini_lessons = [];
        }

        const newIndex = topic.mini_lessons.length;
        const defaultFilename = topic.has_audio
          ? `1en_Gr_${String(topic_number).padStart(2, '0')}_${newIndex + 1}.mp3`
          : `curriculum_d${topic_number}_${newIndex + 1}.manual`;

        const newMini = {
          file: (mini_lesson.file || defaultFilename).trim(),
          topic: (mini_lesson.topic || `Cấu trúc mới #${newIndex + 1}`).trim(),
          transcript: (mini_lesson.transcript || '').trim(),
          primary_structure: (mini_lesson.primary_structure || '').trim(),
          structure_type: mini_lesson.structure_type || 'sentence_structure',
          structures: [],
          verb_forms: [],
          tense: [],
          examples: Array.isArray(mini_lesson.examples) ? mini_lesson.examples : [],
          notes: typeof mini_lesson.notes === 'string' ? mini_lesson.notes.trim() : '',
        };

        topic.mini_lessons.push(newMini);

        // Perform full file synchronization and HTML rebuild
        const updatedTopic = syncAllDataFiles(catalog, topic_number);

        return Response.json({
          success: true,
          message: 'Mini-lesson added successfully',
          topic: updatedTopic,
          mini_lesson: newMini,
          mini_lesson_index: newIndex,
        }, { headers: corsHeaders });
      } catch (err: any) {
        console.error('Error adding mini lesson:', err);
        return Response.json({
          success: false,
          error: err.message || 'Internal server error while adding mini lesson',
        }, { status: 500, headers: corsHeaders });
      }
    }

    // POST /api/delete-mini-lesson
    if (pathname === '/api/delete-mini-lesson' && req.method === 'POST') {
      try {
        const body = await req.json();
        const { topic_number, mini_lesson_index } = body;

        if (typeof topic_number !== 'number' || typeof mini_lesson_index !== 'number') {
          return Response.json({
            success: false,
            error: 'Missing or invalid parameters: topic_number and mini_lesson_index are required.',
          }, { status: 400, headers: corsHeaders });
        }

        const catalog = JSON.parse(fs.readFileSync(CATALOG_JSON, 'utf8'));
        const topic = (catalog.topics || []).find(
          (t: any) => t.topic_number === topic_number || t.day_number === topic_number
        );

        if (!topic) {
          return Response.json({
            success: false,
            error: `Topic number ${topic_number} not found.`,
          }, { status: 404, headers: corsHeaders });
        }

        if (!topic.mini_lessons || mini_lesson_index < 0 || mini_lesson_index >= topic.mini_lessons.length) {
          return Response.json({
            success: false,
            error: `mini_lesson_index ${mini_lesson_index} is out of bounds.`,
          }, { status: 400, headers: corsHeaders });
        }

        // Remove item
        topic.mini_lessons.splice(mini_lesson_index, 1);

        // Perform full file synchronization and HTML rebuild
        const updatedTopic = syncAllDataFiles(catalog, topic_number);

        return Response.json({
          success: true,
          message: 'Mini-lesson deleted successfully',
          topic: updatedTopic,
        }, { headers: corsHeaders });
      } catch (err: any) {
        console.error('Error deleting mini lesson:', err);
        return Response.json({
          success: false,
          error: err.message || 'Internal server error while deleting mini lesson',
        }, { status: 500, headers: corsHeaders });
      }
    }

    // POST /api/sync-firestore
    if (pathname === '/api/sync-firestore' && req.method === 'POST') {
      try {
        console.log('☁️ Triggering Firestore Grammar Sync via API...');
        const result = await syncGrammarToFirestore();
        return Response.json({
          success: true,
          total_synced: result.total_synced,
          duration_sec: result.duration_sec,
          logs: result.logs,
        }, { headers: corsHeaders });
      } catch (err: any) {
        console.error('❌ Firestore sync API failed:', err);
        return Response.json({
          success: false,
          error: err.message || 'Firestore synchronization failed',
        }, { status: 500, headers: corsHeaders });
      }
    }

    return new Response('404 Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders },
    });
  },
});

console.log('');
console.log('╔═════════════════════════════════════════════════════════════════════════════╗');
console.log(`║  🚀 Grammar Boost Reviewer & Live Editor is live at http://localhost:${PORT}   ║`);
console.log('║                                                                             ║');
console.log('║  ⚡ REST Endpoints available:                                                ║');
console.log('║     • POST /api/save-mini-lesson    : Save & re-sync mini lesson            ║');
console.log('║     • POST /api/add-mini-lesson     : Add new mini-lesson to topic          ║');
console.log('║     • POST /api/delete-mini-lesson  : Delete mini-lesson & recompute         ║');
console.log('║     • POST /api/sync-firestore      : Push all 30 lessons to Firestore      ║');
console.log('║     • GET  /api/health              : Server status & audio files count     ║');
console.log('║     • GET  /api/catalog             : Live catalog JSON                     ║');
console.log('║                                                                             ║');
console.log('║  🎧 Streaming teacher recordings from:                                      ║');
console.log(`║     ${AUDIO_BASE_DIR.padEnd(72).slice(0, 72)} ║`);
console.log('╚═════════════════════════════════════════════════════════════════════════════╝');
console.log('');
