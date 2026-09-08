import * as fs from "fs";
import * as path from "path";
import { CURRICULUM_CATALOG_LEVEL_B_EREL } from "../src/data/levelBErelData";
import { LessonDoc } from "../src/types";

console.log("=== STRIPPING SPEAKER PREFIXES FROM LEVEL B - EREL ===");

const lessons: LessonDoc[] = JSON.parse(JSON.stringify(CURRICULUM_CATALOG_LEVEL_B_EREL));

const SPEAKER_PREFIX_REGEX = /^([A-Za-z]{1,20})\s*[:–—\-]\s*(.*)$/;

let matchedChunks = 0;
let totalChunks = 0;
const prefixStats: Record<string, number> = {};

for (const lesson of lessons) {
  for (const chunk of lesson.chunks) {
    totalChunks++;
    if (!chunk.vietnamese) continue;

    const match = chunk.vietnamese.match(SPEAKER_PREFIX_REGEX);
    if (match) {
      matchedChunks++;
      const speaker = match[1];
      const strippedDialogue = match[2].trim();

      prefixStats[speaker] = (prefixStats[speaker] || 0) + 1;

      // Preserve speaker if not already set
      if (!chunk.speaker) {
        chunk.speaker = speaker;
      }

      // Update vietnamese to only spoken dialogue
      chunk.vietnamese = strippedDialogue;
    }
  }
}

console.log(`Total chunks processed: ${totalChunks}`);
console.log(`Matched and cleaned chunks: ${matchedChunks}`);
console.log("Prefix statistics:", JSON.stringify(prefixStats, null, 2));

// Safety checks:
if (totalChunks !== 2381) {
  console.error(`❌ Expected 2381 chunks, found ${totalChunks}! Aborting.`);
  process.exit(1);
}

if (matchedChunks !== 275) {
  console.error(`❌ Expected 275 matched chunks, found ${matchedChunks}! Aborting.`);
  process.exit(1);
}

// Check specific examples:
const d1 = lessons.find(l => l.id === "level_b_erel_day_1");
const c77 = d1?.chunks.find(c => c.chunk_id === "chunk_erel_d1_0077");
console.log("\nSample Verification:");
console.log("Chunk 77 (Linda):", c77?.vietnamese, "| Speaker:", c77?.speaker);

const c81 = d1?.chunks.find(c => c.chunk_id === "chunk_erel_d1_0081");
console.log("Chunk 81 (Ducky):", c81?.vietnamese, "| Speaker:", c81?.speaker);

const d7 = lessons.find(l => l.id === "level_b_erel_day_7");
const c91 = d7?.chunks.find(c => c.chunk_id === "chunk_erel_d7_0091");
console.log("Chunk 91 (M: 2 rưỡi):", c91?.vietnamese, "| Speaker:", c91?.speaker, "| EN:", c91?.english);

// Ensure no remaining chunks in vietnamese match the speaker regex
let remainingMatched = 0;
for (const lesson of lessons) {
  for (const chunk of lesson.chunks) {
    if (chunk.vietnamese && SPEAKER_PREFIX_REGEX.test(chunk.vietnamese)) {
      console.error(`❌ Remaining speaker prefix in ${chunk.chunk_id}: ${chunk.vietnamese}`);
      remainingMatched++;
    }
  }
}

if (remainingMatched > 0) {
  console.error(`❌ ${remainingMatched} chunks still have speaker prefixes! Aborting.`);
  process.exit(1);
}

// Write back to src/data/levelBErelData.ts
const targetPath = path.resolve(__dirname, "../src/data/levelBErelData.ts");
const fileContent = `import { LessonDoc } from "../types";

export const CURRICULUM_CATALOG_LEVEL_B_EREL: LessonDoc[] = ${JSON.stringify(lessons, null, 2)};
`;

fs.writeFileSync(targetPath, fileContent, "utf-8");
console.log(`\n✅ Successfully updated ${targetPath}`);
