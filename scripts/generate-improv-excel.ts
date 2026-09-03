import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { IMPROV_SET_01, IMPROV_SET_02 } from '../src/data/improvSet01And02';
import { ImprovPackage } from '../src/types/improv';

export function packageToExcelBuffer(pkg: ImprovPackage): Buffer {
  let maxHints = 5;
  pkg.sessions.forEach(s => {
    s.items.forEach(it => {
      if (it.hints.length > maxHints) {
        maxHints = it.hints.length;
      }
    });
  });

  // 1. Build Header row matching Improv-package-sample.xlsx
  // Format: Session, Item, hc-total, hint-1..N, hint-1..N-translation, hint-1..N-type / function
  const headers: string[] = ['Session', 'Item', 'hc-total'];

  for (let h = 1; h <= maxHints; h++) {
    headers.push(`hint-${h}`);
  }
  for (let h = 1; h <= maxHints; h++) {
    headers.push(`hint-${h}-translation`);
  }
  for (let h = 1; h <= maxHints; h++) {
    headers.push(`hint-${h}-type / function`);
  }

  // 2. Build Data rows
  const aoa: any[][] = [];

  // Row 0: Title banner matching Improv-package-sample.xlsx
  aoa.push([`Presentation — ${pkg.title}`]);
  // Row 1: Subtitle / instruction matching Improv-package-sample.xlsx
  aoa.push(['Hints first; translations and explanations afterward. Fancy words are limited to 1–2 words (except the required proverb). HC 3–4 hints are intentionally related.']);
  // Row 2: Header row
  aoa.push(headers);

  // Row 3+: Items
  pkg.sessions.forEach(session => {
    session.items.forEach(item => {
      const rowData: any[] = [
        item.sessionNumber,
        item.itemNumber,
        item.hcTotal || item.hints.length
      ];

      // hint texts
      for (let h = 1; h <= maxHints; h++) {
        const hint = item.hints.find(hi => hi.itemIndex === h) || item.hints[h - 1];
        rowData.push(hint ? hint.text : null);
      }

      // hint translations
      for (let h = 1; h <= maxHints; h++) {
        const hint = item.hints.find(hi => hi.itemIndex === h) || item.hints[h - 1];
        rowData.push(hint ? hint.translation : null);
      }

      // hint types / functions
      for (let h = 1; h <= maxHints; h++) {
        const hint = item.hints.find(hi => hi.itemIndex === h) || item.hints[h - 1];
        rowData.push(hint ? hint.typeFunction : null);
      }

      aoa.push(rowData);
    });
  });

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  const buf = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  return buf;
}

async function writeWithRetry(filePath: string, buf: Buffer, retries = 5, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      fs.writeFileSync(filePath, buf);
      return;
    } catch (err: any) {
      if (err.code === 'EBUSY' && i < retries - 1) {
        console.warn(`[WARN] ${path.basename(filePath)} is busy/locked. Waiting ${delay}ms before retry ${i + 1}/${retries}...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw err;
      }
    }
  }
}

async function main() {
  const outputDir = path.resolve(process.cwd(), 'public/data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const set01Path = path.join(outputDir, 'Improv_Set_01_Wandering_Souls.xlsx');
  const set02Path = path.join(outputDir, 'Improv_Set_02_Tell_Me_About_Yourself.xlsx');

  const buf1 = packageToExcelBuffer(IMPROV_SET_01);
  await writeWithRetry(set01Path, buf1);
  const stat1 = fs.statSync(set01Path);
  console.log(`[SUCCESS] Generated: ${set01Path} (${stat1.size} bytes)`);

  const buf2 = packageToExcelBuffer(IMPROV_SET_02);
  await writeWithRetry(set02Path, buf2);
  const stat2 = fs.statSync(set02Path);
  console.log(`[SUCCESS] Generated: ${set02Path} (${stat2.size} bytes)`);
}

main().catch(err => {
  console.error('[ERROR] Failed to generate Excel files:', err);
  process.exit(1);
});
