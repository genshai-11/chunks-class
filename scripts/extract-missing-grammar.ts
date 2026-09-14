import fs from 'fs';
import path from 'path';

export interface AudioGrammarItem {
  key: string;
  topicDir: string;
  fileName: string;
  topicNumber: number;
  transcript: string;
  grammar_topic: string;
  primary_structure: string;
  structure_type: 'sentence_structure' | 'verb_form' | 'tense_reflex';
  structures: string[];
  verb_forms: string[];
  tense: string[];
  examples: Array<{ en: string; vi: string }>;
  notes: string;
  processed_at: string;
}

const AUDIO_ROOT = 'C:\\Users\\gensh\\Downloads\\chunks-grammar\\FULL 30 Topic_P@W\\Grammar Boost\\Grammar Boost';
const CACHE_FILE = path.join(__dirname, '.cache-grammar-transcripts.json');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('ERROR: GEMINI_API_KEY environment variable is missing!');
  process.exit(1);
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

interface AudioFileInfo {
  fullPath: string;
  topicDir: string;
  fileName: string;
  topicNumber: number;
  fileIndex: number;
  key: string;
}

const TARGET_TOPICS = [16, 19, 22, 28];

function discoverTargetAudioFiles(): AudioFileInfo[] {
  const files: AudioFileInfo[] = [];
  for (const topicNum of TARGET_TOPICS) {
    const dirName = `Topic ${topicNum}`;
    const dirPath = path.join(AUDIO_ROOT, dirName);
    if (!fs.existsSync(dirPath)) {
      console.error(`Directory not found: ${dirPath}`);
      continue;
    }
    const mp3s = fs.readdirSync(dirPath).filter(f => f.toLowerCase().endsWith('.mp3'));
    for (const f of mp3s) {
      const idxMatch = f.match(/_(\d+)\.mp3$/i);
      const fileIndex = idxMatch ? parseInt(idxMatch[1], 10) : 0;
      files.push({
        fullPath: path.join(dirPath, f),
        topicDir: dirName,
        fileName: f,
        topicNumber: topicNum,
        fileIndex,
        key: `${dirName}/${f}`
      });
    }
  }

  files.sort((a, b) => {
    if (a.topicNumber !== b.topicNumber) return a.topicNumber - b.topicNumber;
    return a.fileIndex - b.fileIndex;
  });

  return files;
}

const PROMPT = `You are an expert English grammar linguist, teacher, and audio transcriber.
Listen carefully to this audio recording of a Vietnamese teacher explaining an English grammar point, sentence structure, verb pattern, tense/reflex, or common learner mistake.
The teacher often starts by stating the topic number and the section (e.g., 'phần verb forms', 'phần sentence structures', or tense/reflex).

Your job is to extract:
1. The exact verbatim bilingual transcript (Vietnamese explanation and English sentences/examples/terms spoken by the teacher).
2. The core grammar topic name.
3. The EXACT 1-to-1 primary target grammar structure or formula taught in this recording (e.g. "S + have/has been V-ing", "get left behind", "Unlike + N, S + V", "prevent + O + from being V3", "Would you mind + V-ing?").
4. The category/type of this structure: MUST be one of 'sentence_structure' | 'verb_form' | 'tense_reflex'.
   - 'verb_form': phrasal verbs, verb collocations, gerund/infinitive patterns (e.g., get left behind, try V-ing, pull strings, take responsibility for V-ing).
   - 'sentence_structure': clause formulas, conditionals, discourse markers, conversational frames, embedded questions (e.g., Unlike + N, S + V; There is no such thing as + N; May I ask you a favor?).
   - 'tense_reflex': verb tense usages, aspect nuances, time frame reflexes (e.g., S + has/have been V-ing, I thought you had V3, S + should have V3).
5. The bilingual examples mentioned in the audio ({ en, vi }).
6. Concise pedagogical teacher notes summarizing common mistakes, rules, and nuances mentioned.

Return ONLY a valid JSON object with the following schema:
{
  "transcript": "Verbatim bilingual transcript preserving Vietnamese explanations and English sentences/examples/terms",
  "grammar_topic": "Name of the grammar topic or key pattern explained in this audio",
  "primary_structure": "Single primary target grammar structure formula",
  "structure_type": "sentence_structure" | "verb_form" | "tense_reflex",
  "structures": ["Key sentence structures or formulas mentioned"],
  "verb_forms": ["Verb forms, phrasal verbs, collocations mentioned"],
  "tense": ["Tenses or aspect rules mentioned"],
  "examples": [
    {
      "en": "English sentence or phrase example from audio",
      "vi": "Vietnamese meaning or explanation from audio"
    }
  ],
  "notes": "Key pedagogical notes, teacher tips, common errors to avoid, nuances explained in the audio"
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
          temperature: 0.1
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

    let structureType: 'sentence_structure' | 'verb_form' | 'tense_reflex' = 'sentence_structure';
    if (parsed.structure_type === 'verb_form' || parsed.structure_type === 'tense_reflex' || parsed.structure_type === 'sentence_structure') {
      structureType = parsed.structure_type;
    }

    const primaryStructure = String(parsed.primary_structure || parsed.grammar_topic || '').trim();

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
      primary_structure: primaryStructure,
      structure_type: structureType,
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
      console.warn(`[Error] Retrying ${file.key} in ${(delay / 1000).toFixed(1)}s (attempt ${retryCount + 1}/5): ${err.message}`);
      await new Promise(res => setTimeout(res, delay));
      return processAudioFileWithGemini(file, retryCount + 1);
    }
    throw err;
  }
}

async function main() {
  const files = discoverTargetAudioFiles();
  console.log(`Discovered ${files.length} audio files across Topics 16, 19, 22, 28.`);

  // Load existing cache
  let cache: Record<string, any> = {};
  if (fs.existsSync(CACHE_FILE)) {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  }

  let successCount = 0;
  let skippedCount = 0;
  let currentIndex = 0;
  const concurrency = 5;

  async function worker(workerId: number) {
    while (currentIndex < files.length) {
      const idx = currentIndex++;
      const file = files[idx];

      if (cache[file.key] && cache[file.key].transcript && cache[file.key].transcript.length > 20) {
        console.log(`[W${workerId}] [${idx + 1}/${files.length}] Already cached: ${file.key}`);
        skippedCount++;
        continue;
      }

      const t0 = Date.now();
      console.log(`[W${workerId}] [${idx + 1}/${files.length}] Processing ${file.key}...`);
      try {
        const item = await processAudioFileWithGemini(file);
        cache[file.key] = item;
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`[W${workerId}]    ✅ Extracted in ${elapsed}s: [${item.structure_type}] ${item.primary_structure}`);
        successCount++;
      } catch (err: any) {
        console.error(`[W${workerId}]    ❌ Failed to process ${file.key}:`, err.message);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  console.log(`\nFinished processing! Processed: ${successCount}, Skipped: ${skippedCount}, Total in cache: ${Object.keys(cache).length}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
