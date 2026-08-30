import * as XLSX from 'xlsx';
import { ChunkItem, CourseLevel } from '../types';

export function downloadLessonExcelTemplate(levelCode?: string, dayNumber?: number) {
  const sampleData = [
    {
      "Item Number": 1,
      "Category": "vocab",
      "Speaker": "Solie",
      "English": "Good morning everyone,",
      "Vietnamese": "Chào buổi sáng mọi người,",
      "Beat Prosody": "Good morning // everyone,"
    },
    {
      "Item Number": 2,
      "Category": "monologue",
      "Speaker": "Solie",
      "English": "I'm Solie, and I have been working for 5 years in e-commerce.",
      "Vietnamese": "Tôi là Solie, và tôi đã làm việc 5 năm trong ngành TMĐT.",
      "Beat Prosody": "I'm Solie, // and I have been working // for 5 years // in e-commerce."
    },
    {
      "Item Number": 3,
      "Category": "slang",
      "Speaker": "",
      "English": "Besides / Apart from that / other than that",
      "Vietnamese": "Bên cạnh đó",
      "Beat Prosody": "Besides // Apart from that"
    },
    {
      "Item Number": 4,
      "Category": "dialogue",
      "Speaker": "Speaker A",
      "English": "Seriously! I took your phone for what???",
      "Vietnamese": "Thiệt! Tao lấy điện thoại mày để chi???",
      "Beat Prosody": "Seriously! // I took your phone // for what???"
    },
    {
      "Item Number": 5,
      "Category": "review",
      "Speaker": "Speaker B",
      "English": "Let's review today's key conversational chunks.",
      "Vietnamese": "Chúng ta hãy cùng ôn lại các cụm từ đàm thoại quan trọng hôm nay.",
      "Beat Prosody": "Let's review // today's key // conversational chunks."
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Lesson_Chunks");
  const filename = dayNumber ? `CHUNKS_${levelCode || 'Lesson'}_Day_${dayNumber}_Template.xlsx` : "CHUNKS_Lesson_Upload_Template.xlsx";
  XLSX.writeFile(wb, filename);
}

export async function parseExcelLessonFile(
  file: File,
  levelCode: CourseLevel,
  dayNumber: number
): Promise<ChunkItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rows || rows.length === 0) {
          throw new Error('The uploaded Excel file contains no data rows.');
        }

        const prefix = levelCode === 'LEVEL_A' ? 'la' : 'lb';
        const chunks: ChunkItem[] = rows.map((row, index) => {
          const itemNum = row['Item Number'] || row['item_number'] || row['Item'] || index + 1;
          const eng = (row['English'] || row['english'] || '').toString().trim();
          const vie = (row['Vietnamese'] || row['vietnamese'] || '').toString().trim();
          const cat = (row['Category'] || row['category'] || 'phrase').toString().trim().toLowerCase();
          const speaker = row['Speaker'] || row['speaker'] || null;
          const prosody = row['Beat Prosody'] || row['beat_prosody'] || null;
          const chunkId = `chunk_${prefix}_d${dayNumber}_${String(itemNum).padStart(4, '0')}`;

          return {
            chunk_id: chunkId,
            item_number: Number(itemNum),
            category: cat,
            english: eng,
            vietnamese: vie,
            speaker: speaker ? String(speaker).trim() : null,
            beat_prosody: prosody ? String(prosody).trim() : null,
            audio_url: `https://storage.googleapis.com/chunks-mirror-audio-284566312743/${levelCode.toLowerCase()}/day_${dayNumber}/${chunkId}.mp3`
          };
        }).filter(c => c.english.length > 0 || c.vietnamese.length > 0);

        resolve(chunks);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
