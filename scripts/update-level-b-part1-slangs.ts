import * as fs from 'fs';
import * as path from 'path';
import { CURRICULUM_CATALOG_LEVEL_B_ERE } from '../src/data/levelBEreData';
import { LessonDoc } from '../src/types';

const filePath = path.resolve(__dirname, '../src/data/levelBEreData.ts');

console.log('Processing levelBEreData.ts...');
let totalPart1Chunks = 0;
let totalExamplesMarked = 0;

const updatedLessons: LessonDoc[] = CURRICULUM_CATALOG_LEVEL_B_ERE.map(lesson => {
  const updatedChunks = lesson.chunks.map((chunk) => {
    // Chunks 1..10 or Part 1 - Vietnamese Slangs
    const isPart1 = (chunk.part && chunk.part.includes('Part 1')) || (chunk.item_number >= 1 && chunk.item_number <= 10);
    if (isPart1) {
      totalPart1Chunks++;
      const isExample = chunk.item_number % 2 === 0 || /_e\d_/.test(chunk.raw_audio_en || '');
      
      const newChunk = {
        ...chunk,
        category: 'slang' as const,
      };

      if (isExample) {
        totalExamplesMarked++;
        newChunk.is_example = true;
        const currentNotes = (newChunk.notes || '').trim();
        if (!currentNotes) {
          newChunk.notes = '[Example Sentence]';
        } else if (!currentNotes.includes('[Example Sentence]')) {
          newChunk.notes = `[Example Sentence] ${currentNotes}`;
        }
      }

      return newChunk;
    }

    return chunk;
  });

  const distinctCategories = Array.from(new Set(updatedChunks.map(c => c.category)));

  return {
    ...lesson,
    total_chunks: updatedChunks.length,
    categories: distinctCategories,
    chunks: updatedChunks
  };
});

console.log(`Processed ${updatedLessons.length} lessons:`);
console.log(`- Total Part 1 chunks updated to category 'slang': ${totalPart1Chunks}`);
console.log(`- Total example chunks marked with is_example and notes: ${totalExamplesMarked}`);

const outputCode = `import { LessonDoc } from "../types";\n\nexport const CURRICULUM_CATALOG_LEVEL_B_ERE: LessonDoc[] = ${JSON.stringify(updatedLessons, null, 2)};\n`;

fs.writeFileSync(filePath, outputCode, 'utf8');
console.log('Successfully written updated data to', filePath);
process.exit(0);
