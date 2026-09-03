import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { IMPROV_SET_01, IMPROV_SET_02 } from '../src/data/improvSet01And02';
import { ImprovPackage } from '../src/types/improv';

function packageToExcelBuffer(pkg: ImprovPackage): Buffer {
  let maxHints = 4;
  pkg.sessions.forEach(s => {
    s.items.forEach(it => {
      if (it.hints.length > maxHints) {
        maxHints = it.hints.length;
      }
    });
  });

  const rows: Record<string, any>[] = [];

  pkg.sessions.forEach(session => {
    session.items.forEach(item => {
      const row: Record<string, any> = {
        'Session': item.sessionNumber,
        'Item': item.itemNumber,
        'hc-total': item.hcTotal || item.hints.length
      };

      for (let h = 1; h <= maxHints; h++) {
        const hint = item.hints.find(hi => hi.itemIndex === h) || item.hints[h - 1];
        row[`hint-${h}`] = hint ? hint.text : '';
        row[`hint-${h}-translation`] = hint ? hint.translation : '';
        row[`hint-${h}-type / function`] = hint ? hint.typeFunction : '';
      }

      rows.push(row);
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Improv_Package');

  const buf = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  return buf;
}

async function main() {
  const outputDir = path.resolve(process.cwd(), 'public/data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const set01Path = path.join(outputDir, 'Improv_Set_01_Wandering_Souls.xlsx');
  const set02Path = path.join(outputDir, 'Improv_Set_02_Tell_Me_About_Yourself.xlsx');

  const buf1 = packageToExcelBuffer(IMPROV_SET_01);
  fs.writeFileSync(set01Path, buf1);
  const stat1 = fs.statSync(set01Path);
  console.log(`[SUCCESS] Generated: ${set01Path} (${stat1.size} bytes)`);

  const buf2 = packageToExcelBuffer(IMPROV_SET_02);
  fs.writeFileSync(set02Path, buf2);
  const stat2 = fs.statSync(set02Path);
  console.log(`[SUCCESS] Generated: ${set02Path} (${stat2.size} bytes)`);
}

main().catch(err => {
  console.error('[ERROR] Failed to generate Excel files:', err);
  process.exit(1);
});
