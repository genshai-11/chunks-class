import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { CURRICULUM_CATALOG_LEVEL_B_ERE } from "../src/data/levelBEreData";
import { LessonDoc } from "../src/types";

const TARGET_FILE = resolve(__dirname, "../src/data/levelBEreData.ts");

console.log("Transforming CURRICULUM_CATALOG_LEVEL_B_ERE with dual-layer audio URLs...");
console.log(`Total lessons: ${CURRICULUM_CATALOG_LEVEL_B_ERE.length}`);

let totalChunksUpdated = 0;

for (const lesson of CURRICULUM_CATALOG_LEVEL_B_ERE) {
  const dayNumber = lesson.day_number;
  for (const chunk of lesson.chunks) {
    const humanEn = `https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/human/level_b/level_b_day_${dayNumber}/${chunk.chunk_id}_en.mp3`;
    const humanVi = `https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/human/level_b/level_b_day_${dayNumber}/${chunk.chunk_id}_vi.mp3`;

    // Preserve existing TTS URLs
    const currentTtsEn = chunk.audio_url_tts !== undefined ? chunk.audio_url_tts : (chunk.audio_url || null);
    const currentTtsVi = chunk.audio_url_tts_vi !== undefined ? chunk.audio_url_tts_vi : (chunk.audio_url_vi || null);

    chunk.audio_url_tts = currentTtsEn;
    chunk.audio_url_tts_vi = currentTtsVi;
    chunk.audio_url_human = humanEn;
    chunk.audio_url_human_vi = humanVi;
    chunk.audio_url = humanEn;
    chunk.audio_url_vi = humanVi;
    chunk.audio_source_preferred = 'human';

    totalChunksUpdated++;
  }
}

console.log(`Updated ${totalChunksUpdated} chunks across ${CURRICULUM_CATALOG_LEVEL_B_ERE.length} lessons.`);

const fileContent = `import { LessonDoc } from "../types";\n\nexport const CURRICULUM_CATALOG_LEVEL_B_ERE: LessonDoc[] = ${JSON.stringify(CURRICULUM_CATALOG_LEVEL_B_ERE, null, 2)};\n`;

writeFileSync(TARGET_FILE, fileContent, "utf-8");
console.log(`Successfully wrote updated data to ${TARGET_FILE}`);
