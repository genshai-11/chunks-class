import * as XLSX from 'xlsx';
import {
  ImprovPackage,
  ImprovSession,
  ImprovItem,
  ImprovHint,
  HintEvaluationResult
} from '../types';

// --------------------------------------------------------------------------
// 1. Language Evaluation, Sanitization & Logic Connector Dictionary
// --------------------------------------------------------------------------

// Strict regex detecting all standard Vietnamese accented vowels and consonants
export const VI_DIACRITICS_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\u00C0-\u1EF9\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01A0\u01A1\u01AF\u01B0]/i;

export const VI_TO_EN_LOGIC_MAP: Record<string, string> = {
  'nếu không': 'otherwise',
  'neu khong': 'otherwise',
  'do đó': 'therefore',
  'do do': 'therefore',
  'vì vậy': 'so',
  'vi vay': 'so',
  'vì thế': 'so',
  'vi the': 'so',
  'tuy nhiên': 'however',
  'tuy nhien': 'however',
  'sau cùng': 'eventually',
  'sau cung': 'eventually',
  'cuối cùng': 'finally',
  'cuoi cung': 'finally',
  'trước đó': 'before that',
  'truoc do': 'before that',
  'trước khi': 'before',
  'truoc khi': 'before',
  'hơn nữa': 'moreover',
  'hon nua': 'moreover',
  'ngoài ra': 'besides',
  'ngoai ra': 'besides',
  'thêm vào đó': 'in addition',
  'them vao do': 'in addition',
  'tiếp theo': 'next',
  'tiep theo': 'next',
  'sau đó': 'after that',
  'sau do': 'after that',
  'dù vậy': 'nevertheless',
  'du vay': 'nevertheless',
  'mặc dù': 'although',
  'mac du': 'although',
  'đồng thời': 'meanwhile',
  'dong thoi': 'meanwhile',
  'trong khi đó': 'meanwhile',
  'trong khi do': 'meanwhile',
  'nói cách khác': 'in other words',
  'noi cach khac': 'in other words',
  'ví dụ': 'for example',
  'vi du': 'for example',
  'chẳng hạn': 'for instance',
  'chang han': 'for instance',
  'miễn là': 'as long as',
  'mien la': 'as long as',
  'bởi vì': 'because',
  'boi vi': 'because',
  'mặt khác': 'on the other hand',
  'mat khac': 'on the other hand',
  'kết quả là': 'as a result',
  'ket qua la': 'as a result',
  'thay vào đó': 'instead',
  'thay vao do': 'instead',
  'thực ra': 'actually',
  'thuc ra': 'actually',
  'tóm lại': 'in short',
  'tom lai': 'in short',
  'nếu': 'if',
  'neu': 'if',
  'nhưng': 'but',
  'nhung': 'but',
  'và': 'and',
  'va': 'and',
  'hoặc': 'or',
  'hoac': 'or'
};

export const EN_TO_VI_LOGIC_MAP: Record<string, string> = {
  'otherwise': 'nếu không',
  'therefore': 'do đó',
  'so': 'vì vậy',
  'however': 'tuy nhiên',
  'eventually': 'sau cùng',
  'finally': 'cuối cùng',
  'before that': 'trước đó',
  'before': 'trước khi',
  'moreover': 'hơn nữa',
  'besides': 'ngoài ra',
  'in addition': 'thêm vào đó',
  'next': 'tiếp theo',
  'after that': 'sau đó',
  'then': 'sau đó',
  'nevertheless': 'dù vậy',
  'although': 'mặc dù',
  'even though': 'mặc dù',
  'meanwhile': 'đồng thời',
  'in other words': 'nói cách khác',
  'for example': 'ví dụ',
  'for instance': 'chẳng hạn',
  'as long as': 'miễn là',
  'because': 'bởi vì',
  'on the other hand': 'mặt khác',
  'as a result': 'kết quả là',
  'instead': 'thay vào đó',
  'actually': 'thực ra',
  'in short': 'tóm lại',
  'if': 'nếu',
  'but': 'nhưng',
  'and': 'và',
  'or': 'hoặc',
  'in contrast': 'ngược lại',
  'while': 'trong khi'
};

export function evaluateAndSanitizeHint(
  hint: ImprovHint,
  context?: { sessionNumber?: number; itemNumber?: number }
): { hint: ImprovHint; wasFixed: boolean; result?: HintEvaluationResult } {
  if (!hint) {
    return { hint, wasFixed: false };
  }

  const origText = (hint.text || '').trim();
  const origTrans = (hint.translation || '').trim();
  let fixedText = origText;
  let fixedTranslation = origTrans;
  let reason = '';

  const textHasVi = VI_DIACRITICS_REGEX.test(fixedText);
  const transHasVi = VI_DIACRITICS_REGEX.test(fixedTranslation);

  // 1. Text has Vietnamese diacritics and translation does NOT:
  if (textHasVi && !transHasVi) {
    fixedText = origTrans;
    fixedTranslation = origText;
    reason = 'Hoán đổi: Text chứa tiếng Việt còn Translation chứa tiếng Anh.';

    if (VI_TO_EN_LOGIC_MAP[fixedText.toLowerCase().trim()]) {
      const en = VI_TO_EN_LOGIC_MAP[fixedText.toLowerCase().trim()];
      fixedText = en;
      fixedTranslation = EN_TO_VI_LOGIC_MAP[en.toLowerCase()] || fixedTranslation;
    }
  }

  // 2. Both have Vietnamese diacritics or identical Vietnamese logic phrase
  const textLower = fixedText.toLowerCase().trim();
  const transLower = fixedTranslation.toLowerCase().trim();

  if (
    (VI_DIACRITICS_REGEX.test(fixedText) && VI_DIACRITICS_REGEX.test(fixedTranslation)) ||
    (textLower === transLower && (VI_DIACRITICS_REGEX.test(fixedText) || VI_TO_EN_LOGIC_MAP[textLower]))
  ) {
    if (VI_TO_EN_LOGIC_MAP[textLower]) {
      const en = VI_TO_EN_LOGIC_MAP[textLower];
      fixedText = en;
      fixedTranslation = EN_TO_VI_LOGIC_MAP[en.toLowerCase()] || origTrans || origText;
      reason = `Đã dịch từ nối tiếng Việt "${origText}" sang tiếng Anh "${fixedText}".`;
    } else if (VI_TO_EN_LOGIC_MAP[transLower]) {
      const en = VI_TO_EN_LOGIC_MAP[transLower];
      fixedText = en;
      fixedTranslation = EN_TO_VI_LOGIC_MAP[en.toLowerCase()] || origTrans || origText;
      reason = `Đã dịch từ nối tiếng Việt "${origTrans}" sang tiếng Anh "${fixedText}".`;
    }
  }

  // 3. If fixedText still has Vietnamese diacritics after above checks:
  if (VI_DIACRITICS_REGEX.test(fixedText)) {
    const sortedViPhrases = Object.keys(VI_TO_EN_LOGIC_MAP).sort((a, b) => b.length - a.length);
    for (const phrase of sortedViPhrases) {
      if (fixedText.toLowerCase().includes(phrase)) {
        const en = VI_TO_EN_LOGIC_MAP[phrase];
        fixedText = en;
        if (!fixedTranslation || fixedTranslation.toLowerCase() === phrase) {
          fixedTranslation = EN_TO_VI_LOGIC_MAP[en.toLowerCase()] || origText;
        }
        reason = `Đã phát hiện và chuyển đổi cụm từ nối tiếng Việt "${phrase}" trong EN sang "${fixedText}".`;
        break;
      }
    }
  }

  // 4. Checks if translation has NO Vietnamese diacritics but is an English logic word:
  const currentTransLower = fixedTranslation.toLowerCase().trim();
  if (
    !VI_DIACRITICS_REGEX.test(fixedTranslation) &&
    EN_TO_VI_LOGIC_MAP[currentTransLower] &&
    !VI_DIACRITICS_REGEX.test(fixedText)
  ) {
    const mappedVi = EN_TO_VI_LOGIC_MAP[currentTransLower];
    if (fixedTranslation !== mappedVi) {
      fixedTranslation = mappedVi;
      if (!reason) {
        reason = 'Đã dịch từ nối tiếng Anh ở ô Translation sang tiếng Việt.';
      }
    }
  }

  // 5. If text === translation
  if (fixedText.trim().toLowerCase() === fixedTranslation.trim().toLowerCase()) {
    const term = fixedText.trim().toLowerCase();
    if (EN_TO_VI_LOGIC_MAP[term]) {
      fixedTranslation = EN_TO_VI_LOGIC_MAP[term];
      if (!reason) reason = `Đã tách ô trùng lặp tiếng Anh sang tiếng Việt: "${fixedTranslation}".`;
    } else if (VI_TO_EN_LOGIC_MAP[term]) {
      fixedText = VI_TO_EN_LOGIC_MAP[term];
      if (!reason) reason = `Đã tách ô trùng lặp tiếng Việt sang tiếng Anh: "${fixedText}".`;
    }
  }

  const wasFixed = fixedText !== origText || fixedTranslation !== origTrans;
  if (wasFixed) {
    const result: HintEvaluationResult = {
      hintId: hint.id || `hint_${Date.now()}`,
      sessionNumber: context?.sessionNumber ?? 0,
      itemNumber: context?.itemNumber ?? 0,
      itemIndex: hint.itemIndex ?? 0,
      originalText: origText,
      originalTranslation: origTrans,
      fixedText,
      fixedTranslation,
      reason: reason || 'Chuẩn hóa định dạng tiếng Anh / tiếng Việt.'
    };

    return {
      hint: {
        ...hint,
        text: fixedText,
        translation: fixedTranslation
      },
      wasFixed: true,
      result
    };
  }

  return {
    hint,
    wasFixed: false
  };
}

export function evaluateAndSanitizePackage(pkg: ImprovPackage): {
  package: ImprovPackage;
  fixedCount: number;
  issues: HintEvaluationResult[];
} {
  if (!pkg) {
    return { package: pkg, fixedCount: 0, issues: [] };
  }

  const issues: HintEvaluationResult[] = [];
  let fixedCount = 0;

  const newSessions: ImprovSession[] = (pkg.sessions || []).map(session => {
    const newItems: ImprovItem[] = (session.items || []).map(item => {
      const newHints: ImprovHint[] = (item.hints || []).map(hint => {
        const { hint: sanitizedHint, wasFixed, result } = evaluateAndSanitizeHint(hint, {
          sessionNumber: session.sessionNumber,
          itemNumber: item.itemNumber
        });
        if (wasFixed && result) {
          fixedCount++;
          issues.push(result);
        }
        return sanitizedHint;
      });

      return {
        ...item,
        hints: newHints
      };
    });

    return {
      ...session,
      items: newItems
    };
  });

  const updatedPkg: ImprovPackage = {
    ...pkg,
    sessions: newSessions,
    updatedAt: fixedCount > 0 ? new Date().toISOString() : pkg.updatedAt
  };

  return {
    package: updatedPkg,
    fixedCount,
    issues
  };
}

export const sanitizePackageLanguage = evaluateAndSanitizePackage;

// Helper for generating UUIDs safely
function generateId(prefix: string = 'improv'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// --------------------------------------------------------------------------
// 2. Excel Exporter (SheetJS Builder)
// --------------------------------------------------------------------------

/**
 * Exports an ImprovPackage to an Excel (.xlsx) file buffer.
 */
export function exportToExcel(pkg: ImprovPackage): Buffer {
  let maxHints = 5;
  (pkg.sessions || []).forEach(s => {
    (s.items || []).forEach(it => {
      if (it.hints && it.hints.length > maxHints) {
        maxHints = it.hints.length;
      }
    });
  });

  const headers: string[] = ['Session', 'Item', 'hc-total'];
  for (let h = 1; h <= maxHints; h++) headers.push(`hint-${h}`);
  for (let h = 1; h <= maxHints; h++) headers.push(`hint-${h}-translation`);
  for (let h = 1; h <= maxHints; h++) headers.push(`hint-${h}-type / function`);

  const aoa: any[][] = [];
  aoa.push([`Presentation — ${pkg.title}`]);
  aoa.push(['Hints first; translations and explanations afterward. Fancy words are limited to 1–2 words (except the required proverb). HC 3–4 hints are intentionally related.']);
  aoa.push(headers);

  (pkg.sessions || []).forEach(session => {
    (session.items || []).forEach(item => {
      const rowData: any[] = [
        item.sessionNumber,
        item.itemNumber,
        item.hcTotal || (item.hints ? item.hints.length : 0)
      ];

      for (let h = 1; h <= maxHints; h++) {
        const hint = item.hints ? (item.hints.find(hi => hi.itemIndex === h) || item.hints[h - 1]) : undefined;
        rowData.push(hint ? hint.text : null);
      }
      for (let h = 1; h <= maxHints; h++) {
        const hint = item.hints ? (item.hints.find(hi => hi.itemIndex === h) || item.hints[h - 1]) : undefined;
        rowData.push(hint ? hint.translation : null);
      }
      for (let h = 1; h <= maxHints; h++) {
        const hint = item.hints ? (item.hints.find(hi => hi.itemIndex === h) || item.hints[h - 1]) : undefined;
        rowData.push(hint ? hint.typeFunction : null);
      }

      aoa.push(rowData);
    });
  });

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  const buf = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
}

// --------------------------------------------------------------------------
// 3. Excel Parser (SheetJS Ingestion)
// --------------------------------------------------------------------------

/**
 * Parses an Excel spreadsheet (.xlsx) into a structured ImprovPackage.
 */
export function parseFromExcel(
  buffer: Buffer | Uint8Array | ArrayBuffer,
  packageTitle?: string
): ImprovPackage {
  let data: Uint8Array;
  if (Buffer.isBuffer(buffer)) {
    data = new Uint8Array(buffer);
  } else if (buffer instanceof Uint8Array) {
    data = buffer;
  } else {
    data = new Uint8Array(buffer);
  }

  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const raw2D: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  let headerRowIdx = -1;

  for (let i = 0; i < raw2D.length; i++) {
    const r = raw2D[i];
    if (Array.isArray(r) && r.some(c => {
      if (c === null || c === undefined) return false;
      const str = String(c).toLowerCase().trim();
      return str === 'session' || str === 'item' || str === 'hc-total' || str === 'hint-1';
    })) {
      headerRowIdx = i;
      break;
    }
  }

  let rows: any[] = [];
  let titleFromSheet = '';
  let descFromSheet = '';

  if (headerRowIdx !== -1) {
    for (let preIdx = 0; preIdx < headerRowIdx; preIdx++) {
      const preRow = raw2D[preIdx];
      if (Array.isArray(preRow)) {
        const textCell = preRow.find(c => c !== null && c !== undefined && String(c).trim().length > 0);
        if (textCell) {
          const val = String(textCell).trim();
          if (!titleFromSheet) titleFromSheet = val;
          else if (!descFromSheet) descFromSheet = val;
        }
      }
    }

    const header = raw2D[headerRowIdx];
    const customRows: any[] = [];
    for (let rIdx = headerRowIdx + 1; rIdx < raw2D.length; rIdx++) {
      const r = raw2D[rIdx];
      if (!r || !Array.isArray(r)) continue;
      const hasAnyValue = r.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '');
      if (!hasAnyValue) continue;

      const obj: Record<string, any> = {};
      header.forEach((colName, colIdx) => {
        if (colName !== null && colName !== undefined && String(colName).trim() !== '') {
          obj[String(colName).trim()] = r[colIdx];
        }
      });
      customRows.push(obj);
    }
    rows = customRows;
  } else {
    rows = XLSX.utils.sheet_to_json(worksheet);
  }

  if (!rows || rows.length === 0) {
    throw new Error('The uploaded Improv Excel file contains no data rows.');
  }

  const sessionsMap = new Map<number, ImprovItem[]>();
  let totalItemsCount = 0;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];

    const rawSession = row['Session'] ?? row['session'] ?? row['Session Number'] ?? row['session_number'] ?? 1;
    const sessionNumber = Number(rawSession) || 1;

    const rawItem = row['Item'] ?? row['item'] ?? row['Item Number'] ?? row['item_number'] ?? (rowIndex + 1);
    const itemNumber = Number(rawItem) || (rowIndex + 1);

    const rawHcTotal = row['hc-total'] ?? row['hc_total'] ?? row['hcTotal'] ?? row['HC Total'] ?? row['HC-Total'] ?? 0;
    let hcTotal = Number(rawHcTotal) || 0;

    const hints: ImprovHint[] = [];
    for (let h = 1; h <= 20; h++) {
      const hintText = row[`hint-${h}`] ?? 
                       row[`hint_${h}`] ?? 
                       row[`Hint ${h}`] ?? 
                       row[`hint ${h}`] ?? 
                       row[`Hint-${h}`] ?? 
                       row[`hint${h}`];

      if (hintText !== undefined && String(hintText).trim() !== '') {
        const translation = row[`hint-${h}-translation`] ?? 
                            row[`hint_${h}_translation`] ?? 
                            row[`hint-${h} translation`] ?? 
                            row[`hint ${h} translation`] ?? 
                            row[`hint-${h}-vi`] ?? 
                            row[`hint_${h}_vi`] ?? 
                            row[`hint${h}_vi`] ?? 
                            '';

        const typeFunction = row[`hint-${h}-type / function`] ?? 
                             row[`hint-${h}-type/function`] ?? 
                             row[`hint-${h}-type`] ?? 
                             row[`hint-${h}-function`] ?? 
                             row[`hint_${h}_type`] ?? 
                             row[`hint ${h} type / function`] ?? 
                             row[`hint ${h} type`] ?? 
                             row[`hint${h}_type`] ?? 
                             `Hint ${h}`;

        hints.push({
          id: `h_${sessionNumber}_${itemNumber}_${h}`,
          text: String(hintText).trim(),
          translation: String(translation).trim(),
          typeFunction: String(typeFunction).trim(),
          itemIndex: h
        });
      }
    }

    if (hints.length > 0) {
      if (hcTotal === 0) hcTotal = hints.length;

      const item: ImprovItem = {
        id: `item_s${sessionNumber}_i${itemNumber}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        itemNumber,
        sessionNumber,
        hcTotal,
        hints,
        createdAt: new Date().toISOString()
      };

      if (!sessionsMap.has(sessionNumber)) {
        sessionsMap.set(sessionNumber, []);
      }
      sessionsMap.get(sessionNumber)!.push(item);
      totalItemsCount++;
    }
  }

  const sortedSessionNumbers = Array.from(sessionsMap.keys()).sort((a, b) => a - b);
  const sessions: ImprovSession[] = sortedSessionNumbers.map(sessionNum => {
    const items = sessionsMap.get(sessionNum)!.sort((a, b) => a.itemNumber - b.itemNumber);
    const sessionHcTotal = items[0]?.hcTotal || (items[0]?.hints?.length || 4);

    const hintTypes: string[] = [];
    for (let h = 1; h <= sessionHcTotal; h++) {
      const sampleHint = items.find(it => it.hints.some(hi => hi.itemIndex === h))?.hints.find(hi => hi.itemIndex === h);
      hintTypes.push(sampleHint?.typeFunction || `Hint ${h}`);
    }

    return {
      sessionNumber: sessionNum,
      title: `Session ${sessionNum}`,
      hcTotal: sessionHcTotal,
      hintTypes,
      items
    };
  });

  const cleanTitle = titleFromSheet ? titleFromSheet.replace(/^Presentation\s*[—–-]\s*/i, '').trim() : '';
  const title = packageTitle || cleanTitle || "Imported Improv Package";
  const description = descFromSheet || `Imported Improv package containing ${sessions.length} sessions and ${totalItemsCount} practice items.`;
  const now = new Date().toISOString();

  const improvPackage: ImprovPackage = {
    id: generateId('pkg_improv'),
    title,
    description,
    totalItems: totalItemsCount,
    sessionsCount: sessions.length,
    sessions,
    createdAt: now,
    updatedAt: now
  };

  const { package: sanitized } = evaluateAndSanitizePackage(improvPackage);
  return sanitized;
}
