import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { ChunkCategory, ChunkItem, LessonDoc } from "../src/types";

const excelPath = "C:\\Users\\gensh\\Downloads\\data-resource-30topics.xlsx";
const workbook = XLSX.readFile(excelPath);

function getCleanTopicTitle(dayNumber: number, rawPart: string): string {
  if (dayNumber === 12) {
    return "Electronic mail (Advanced)";
  }
  if (dayNumber === 27) {
    return "Shark Tank";
  }
  let cleaned = rawPart.replace(/^Topic\s*\d+\s*:\s*/i, "").trim();
  cleaned = cleaned.replace(/\s+/g, " ");
  return cleaned;
}

function getChunkCategory(type: string): ChunkCategory {
  const t = type.toLowerCase().trim();
  if (["i1", "i2", "i3", "i4", "i5"].includes(t)) return "slang";
  if (["e1", "e2", "e3", "e4", "e5"].includes(t)) return "slang";
  
  if (t.startsWith("i")) {
    const num = parseInt(t.slice(1), 10);
    if (num >= 6 && num <= 30) return "vocab";
    if (num >= 31 && num <= 50) return "phrase";
    if (num >= 51 && num <= 60) return "sentence";
    if (num >= 61 && num <= 75) return "monologue";
    if (num >= 76 && num <= 90) return "dialogue";
    if (num >= 91 && num <= 100) return "review";
  }
  
  return "vocab";
}

const lessons: LessonDoc[] = [];

for (let dayNumber = 1; dayNumber <= 30; dayNumber++) {
  const sheetName = `Topic ${dayNumber}`;
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Sheet ${sheetName} not found in workbook!`);
  }

  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const coverRows = rows.filter(r => String(r.TYPE).toLowerCase().startsWith("c"));
  const nonCoverRows = rows.filter(r => !String(r.TYPE).toLowerCase().startsWith("c"));

  if (nonCoverRows.length !== 105) {
    throw new Error(`Expected 105 chunks in ${sheetName}, but got ${nonCoverRows.length}`);
  }

  const c1 = coverRows.find(r => String(r.TYPE).toLowerCase() === "c1") || rows[0];
  const rawTopicPart = c1 ? String(c1.Part || "").trim() : "";
  const cleanTitle = getCleanTopicTitle(dayNumber, rawTopicPart);
  const lessonTitle = `Day ${dayNumber} - ${cleanTitle}`;

  const chunks: ChunkItem[] = nonCoverRows.map((row, idx) => {
    const itemNumber = idx + 1;
    const category = getChunkCategory(String(row.TYPE));
    const english = String(row["KEY - English (en)"] || "").trim();
    const vietnamese = String(row["IDEA - Vietnamese (vi)"] || "").trim();

    const rawAudioEn = row["URL AUDIO EN"] && String(row["URL AUDIO EN"]).trim() ? String(row["URL AUDIO EN"]).trim() : null;
    const rawAudioVi = row["URL AUDIO VI"] && String(row["URL AUDIO VI"]).trim() ? String(row["URL AUDIO VI"]).trim() : null;
    const rawImage = row["URL IMAGE"] && String(row["URL IMAGE"]).trim() ? String(row["URL IMAGE"]).trim() : null;
    const synonym = row["SYNONYM (If any)"] && String(row["SYNONYM (If any)"]).trim() ? String(row["SYNONYM (If any)"]).trim() : undefined;
    const partName = row.Part ? String(row.Part).trim() : undefined;
    const sourceRow = (row.__rowNum__ !== undefined) ? (row.__rowNum__ + 1) : (idx + 2);

    const chunk: ChunkItem = {
      chunk_id: `chunk_ere_d${dayNumber}_${String(itemNumber).padStart(4, "0")}`,
      item_number: itemNumber,
      category,
      english,
      vietnamese,
      speaker: null,
      audio_url: null,
      audio_url_vi: null,
      raw_audio_en: rawAudioEn,
      raw_audio_vi: rawAudioVi,
      raw_image: rawImage,
      beat_prosody: english,
      part: partName,
      source_sheet: sheetName,
      source_row: sourceRow
    };

    if (synonym) {
      chunk.notes = synonym;
    }

    if (["e1", "e2", "e3", "e4", "e5"].includes(String(row.TYPE).toLowerCase().trim())) {
      chunk.is_example = true;
      chunk.notes = chunk.notes ? `[Example Sentence] ${chunk.notes}` : "[Example Sentence]";
    }

    return chunk;
  });

  const lessonDoc: LessonDoc = {
    id: `level_b_ere_day_${dayNumber}`,
    course_id: "course_level_b_ere",
    level_code: "LEVEL_B_ERE",
    course_title: "Level B - ERE (English Reflexes Enhancement)",
    day_number: dayNumber,
    lesson_title: lessonTitle,
    lesson_type: "Reflex & Business Drill",
    total_chunks: 105,
    categories: Array.from(new Set(chunks.map(c => c.category))),
    chunks
  };

  lessons.push(lessonDoc);
}

console.log(`Generated ${lessons.length} lessons with ${lessons.reduce((sum, l) => sum + l.chunks.length, 0)} total chunks.`);

const targetFilePath = path.resolve(__dirname, "../src/data/levelBEreData.ts");

const fileContent = `import { LessonDoc } from "../types";

export const CURRICULUM_CATALOG_LEVEL_B_ERE: LessonDoc[] = ${JSON.stringify(lessons, null, 2)};
`;

fs.writeFileSync(targetFilePath, fileContent, "utf-8");
console.log(`Successfully wrote ${targetFilePath} (${(fs.statSync(targetFilePath).size / 1024 / 1024).toFixed(2)} MB)`);
