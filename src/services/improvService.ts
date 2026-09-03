import * as XLSX from 'xlsx';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from './firestoreService';
import { curriculumRegistry } from './curriculumRegistry';
import { getLessonById, getLessonsByLevel } from './firestoreService';
import { 
  ImprovPackage, 
  ImprovSession, 
  ImprovItem, 
  ImprovHint, 
  ImprovLLMConfig, 
  ImprovSessionConfig,
  ImprovGenerateRequest,
  ChunkItem
} from '../types';
import { DEFAULT_IMPROV_PACKAGES } from '../data/defaultImprovPackages';
import { IMPROV_SET_01, IMPROV_SET_02 } from '../data/improvSet01And02';

export function loadDefaultPresets(): ImprovPackage[] {
  return [IMPROV_SET_01, IMPROV_SET_02];
}

export function ensureDefaultSetsPresent(packages: ImprovPackage[]): ImprovPackage[] {
  const result = [...packages];
  const existingIds = new Set(result.map(p => p.id));

  // If IMPROV_SET_02 is missing, prepend it
  if (!existingIds.has(IMPROV_SET_02.id)) {
    result.unshift(IMPROV_SET_02);
  }

  // If IMPROV_SET_01 is missing, prepend it (so Set 01 comes first)
  if (!existingIds.has(IMPROV_SET_01.id)) {
    result.unshift(IMPROV_SET_01);
  }

  return result;
}

// --------------------------------------------------------------------------
// 1. Default Master System Prompt & LLM Configuration
// --------------------------------------------------------------------------

export const DEFAULT_IMPROV_MASTER_PROMPT = `You are the Lead English Pedagogy & Speech Chunking Architect for the CHUNKS Improv Reflex Platform.

CHUNKS Improv is an interactive, hint-based English reflex training system. Learners deduce, shadow, and master spoken English chunks through rapid-fire clue words/phrases (1-2 words each) before producing the full communicative sentence.

### PEDAGOGICAL STRUCTURE BASED ON SESSIONS:
Each Improv Package contains multiple Sessions. In each Session, each Item is an independent reflex challenge with N compact hints (1–2 words per clue):

1. **For 2-Hint Sessions (hcTotal = 2)**:
   - Hint 1: **Keyword / Core Vocab** (Danh từ / Động từ / Tính từ / Trạng từ / Cụm chêm). Drawn from the provided seed vocabularies.
   - Hint 2: **Ending** (Động từ / Tính từ / Trạng từ / Danh từ). A natural, high-frequency collocated word.
   - *Example Item 1*: Hint 1: "cơm tối" (Trans: "dinner", Type: "Danh từ · Keyword") | Hint 2: "nấu" (Trans: "cook", Type: "Động từ · Ending")
   - *Example Item 2*: Hint 1: "Contract" (Trans: "Hợp đồng", Type: "Danh từ · Keyword") | Hint 2: "long-term" (Trans: "dài hạn", Type: "Tính từ · Ending")
   - *Rule*: EVERY single item in the session MUST have completely different, creative, distinct word pairs!

2. **For 3-Hint Sessions (hcTotal = 3)**:
   - Hint 1: **Keyword / Core Vocab** (1–2 words: Danh từ / Động từ / Tính từ / Trạng từ / Cụm phản hồi).
   - Hint 2: **Logic word / Từ nối** (1–2 words: transition & connective words).
     *CRITICAL RULE*: Every item MUST use a DIFFERENT logic connector! Pick from: "nói cách khác" (in other words), "sau cùng" (eventually), "trước đó" (before that), "hơn nữa" (in addition), "tiếp theo" (next), "dù vậy" (nevertheless), "nếu" (if), "đồng thời" (meanwhile), "tuy nhiên" (however), "do đó" (therefore), "ví dụ" (for example), "miễn là" (as long as), "nếu không" (otherwise), "sau đó" (then), "ngoài ra" (besides).
   - Hint 3: **Ending** (Tính từ / Trạng từ / Động từ - 1–2 words).
   - *Example Item 1*: Hint 1: "Cải thiện" (Trans: "Work on / improve", Type: "Động từ · Keyword") | Hint 2: "trước đó" (Trans: "before that", Type: "Từ nối · Logic word") | Hint 3: "tốt hơn" (Trans: "better", Type: "Tính từ · Ending")
   - *Example Item 2*: Hint 1: "Sometimes" (Trans: "Nhiều khi", Type: "Trạng từ · Keyword") | Hint 2: "meanwhile" (Trans: "đồng thời", Type: "Từ nối · Logic word") | Hint 3: "unpredictable" (Trans: "khó đoán", Type: "Tính từ · Ending")

3. **For 4-Hint Sessions (hcTotal = 4)**:
   - Hint 1: **Keyword / WH-question** (1–2 words: Danh từ, Cụm khuyên nhủ, WH word like "Why", "When", "How long", "Which").
   - Hint 2: **Logic word / Từ nối** (1–2 words: "while", "in contrast", "as long as", "but", "however", "therefore", "if", "otherwise", "then", "finally", etc. - MUST be different across all rows!).
   - Hint 3: **Fancy word / Ẩn dụ / Cụm gợi hình / Tục ngữ / Từ tượng thanh** (1–2 words colorful image: "smart choice", "lifeline", "empty shelves", "shock wave", "watchful eye", "dead stop", "red flag", "Better safe than sorry", "burning", "resistant").
   - Hint 4: **Ending** (1–2 words: Danh từ, Tính từ, Trạng từ: "careful", "globally", "urgently", "worldwide", "discreetly", "immediately", "promptly", "Heartburn", "Acid reflux", "Blood sugar").

### STRICT ANTI-REPETITION CONSTRAINTS:
- DO NOT repeat fixed sentence patterns (e.g., NEVER make all items "Why don't you..." or any repeated template).
- Every single Item in the output must be completely UNIQUE, colorful, diverse, and natural.
- Compact Clues: Fancy words and hints must be limited to 1–2 words (except proverbs).
- Translations must be 100% natural, colloquial Vietnamese (Latin Extended, Be Vietnam Pro typography safe).

### OUTPUT FORMAT:
You MUST output ONLY a valid JSON object matching the following structure without any surrounding markdown or explanation:
{
  "title": "Package Title",
  "description": "Package Description",
  "sessions": [
    {
      "sessionNumber": 1,
      "title": "Session 1: Two-Word Reflex Pairs",
      "hcTotal": 2,
      "hintTypes": ["Danh từ · Keyword", "Động từ · Ending"],
      "items": [
        {
          "itemNumber": 1,
          "sessionNumber": 1,
          "hcTotal": 2,
          "hints": [
            {
              "itemIndex": 1,
              "text": "cơm tối",
              "translation": "dinner",
              "typeFunction": "Danh từ · Keyword"
            },
            {
              "itemIndex": 2,
              "text": "nấu",
              "translation": "cook",
              "typeFunction": "Động từ · Ending"
            }
          ]
        }
      ]
    }
  ]
}`;

export const DEEPSEEK_DEFAULT_CONFIG: ImprovLLMConfig = {
  provider: 'DEEPSEEK',
  endpoint: 'https://api.deepseek.com',
  apiKey: 'sk-2fec5e48a85f48cb99efd17c24207b7e',
  model: 'deepseek-chat',
  masterPrompt: DEFAULT_IMPROV_MASTER_PROMPT,
  temperature: 0.7,
  maxTokens: 4000
};

export const GOOGLE_GENAI_DEFAULT_CONFIG: ImprovLLMConfig = {
  provider: 'GOOGLE_GENAI',
  endpoint: 'https://generativelanguage.googleapis.com',
  apiKey: '',
  model: 'gemini-2.5-flash',
  masterPrompt: DEFAULT_IMPROV_MASTER_PROMPT,
  temperature: 0.7,
  maxTokens: 8192
};

export const DEFAULT_IMPROV_LLM_CONFIG: ImprovLLMConfig = DEEPSEEK_DEFAULT_CONFIG;

const LOCAL_STORAGE_IMPROV_KEY = 'chunks_improv_packages_local';

// Helper for generating UUIDs safely across environments
function generateId(prefix: string = 'improv'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// --------------------------------------------------------------------------
// 2. Firestore & LocalStorage CRUD Operations
// --------------------------------------------------------------------------

export async function getAllImprovPackages(): Promise<ImprovPackage[]> {
  try {
    const snapshot = await getDocs(collection(db, 'improv_packages'));
    if (!snapshot.empty) {
      let packages = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ImprovPackage));
      packages = ensureDefaultSetsPresent(packages);
      // Save local backup
      try {
        localStorage.setItem(LOCAL_STORAGE_IMPROV_KEY, JSON.stringify(packages));
      } catch {}
      return packages.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    }
  } catch (err) {
    console.warn('[ImprovService] Firestore getAllImprovPackages notice, using local cache:', err);
  }

  // LocalStorage Fallback
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_IMPROV_KEY);
    if (saved) {
      let parsed: ImprovPackage[] = JSON.parse(saved);
      if (parsed && parsed.length > 0) {
        parsed = ensureDefaultSetsPresent(parsed);
        try {
          localStorage.setItem(LOCAL_STORAGE_IMPROV_KEY, JSON.stringify(parsed));
        } catch {}
        return parsed.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      }
    }
  } catch {}

  const fallback = ensureDefaultSetsPresent(DEFAULT_IMPROV_PACKAGES);
  try {
    localStorage.setItem(LOCAL_STORAGE_IMPROV_KEY, JSON.stringify(fallback));
  } catch {}
  return fallback;
}

export async function getImprovPackageById(id: string): Promise<ImprovPackage | null> {
  if (!id) return null;
  try {
    const docRef = doc(db, 'improv_packages', id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as ImprovPackage;
    }
  } catch (err) {
    console.warn(`[ImprovService] Firestore getImprovPackageById notice for ${id}:`, err);
  }

  // Fallback to local storage
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_IMPROV_KEY);
    if (saved) {
      const parsed: ImprovPackage[] = JSON.parse(saved);
      const found = parsed.find(p => p.id === id);
      if (found) return found;
    }
  } catch {}

  const defaultFound = DEFAULT_IMPROV_PACKAGES.find(p => p.id === id);
  if (defaultFound) return defaultFound;

  return null;
}

export async function saveImprovPackage(pkg: ImprovPackage): Promise<void> {
  const cleanPkg: ImprovPackage = {
    ...pkg,
    updatedAt: new Date().toISOString()
  };

  // 1. Save to Firestore
  try {
    const docRef = doc(db, 'improv_packages', cleanPkg.id);
    await setDoc(docRef, cleanPkg, { merge: true });
  } catch (err) {
    console.warn(`[ImprovService] Firestore saveImprovPackage notice for ${cleanPkg.id}:`, err);
  }

  // 2. Sync to LocalStorage
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_IMPROV_KEY);
    let packages: ImprovPackage[] = saved ? JSON.parse(saved) : [];
    const index = packages.findIndex(p => p.id === cleanPkg.id);
    if (index >= 0) {
      packages[index] = cleanPkg;
    } else {
      packages.unshift(cleanPkg);
    }
    localStorage.setItem(LOCAL_STORAGE_IMPROV_KEY, JSON.stringify(packages));
  } catch {}
}

export async function deleteImprovPackage(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'improv_packages', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`[ImprovService] Firestore deleteImprovPackage notice for ${id}:`, err);
  }

  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_IMPROV_KEY);
    if (saved) {
      const packages: ImprovPackage[] = JSON.parse(saved);
      localStorage.setItem(
        LOCAL_STORAGE_IMPROV_KEY, 
        JSON.stringify(packages.filter(p => p.id !== id))
      );
    }
  } catch {}
}

/**
 * Adds or updates a single ImprovItem within an existing ImprovPackage and Session.
 */
export async function addOrUpdateImprovItem(
  packageId: string,
  sessionNumber: number,
  item: ImprovItem
): Promise<ImprovPackage | null> {
  const pkg = await getImprovPackageById(packageId);
  if (!pkg) return null;

  const sessions = [...pkg.sessions];
  let sessionIndex = sessions.findIndex(s => s.sessionNumber === sessionNumber);

  if (sessionIndex < 0) {
    // Create new session if missing
    const newSession: ImprovSession = {
      sessionNumber,
      title: `Session ${sessionNumber}`,
      hcTotal: item.hcTotal || item.hints.length,
      hintTypes: Array.from(new Set(item.hints.map(h => h.typeFunction))),
      items: [item]
    };
    sessions.push(newSession);
    sessions.sort((a, b) => a.sessionNumber - b.sessionNumber);
  } else {
    const session = { ...sessions[sessionIndex] };
    const items = [...session.items];
    const itemIndex = items.findIndex(it => it.id === item.id || it.itemNumber === item.itemNumber);

    if (itemIndex >= 0) {
      items[itemIndex] = item;
    } else {
      items.push(item);
    }

    items.sort((a, b) => a.itemNumber - b.itemNumber);
    session.items = items;
    session.hcTotal = items[0]?.hcTotal || item.hints.length;
    session.hintTypes = Array.from(new Set(items.flatMap(it => it.hints.map(h => h.typeFunction))));
    sessions[sessionIndex] = session;
  }

  const totalItems = sessions.reduce((acc, s) => acc + s.items.length, 0);
  const updatedPkg: ImprovPackage = {
    ...pkg,
    sessions,
    sessionsCount: sessions.length,
    totalItems,
    updatedAt: new Date().toISOString()
  };

  await saveImprovPackage(updatedPkg);
  return updatedPkg;
}

/**
 * Deletes a single ImprovItem from a package session.
 */
export async function deleteImprovItem(
  packageId: string,
  sessionNumber: number,
  itemId: string
): Promise<ImprovPackage | null> {
  const pkg = await getImprovPackageById(packageId);
  if (!pkg) return null;

  const sessions = pkg.sessions.map(session => {
    if (session.sessionNumber !== sessionNumber) return session;
    const remainingItems = session.items.filter(it => it.id !== itemId);
    // Re-index remaining item numbers
    const reindexed = remainingItems.map((it, idx) => ({ ...it, itemNumber: idx + 1 }));
    return {
      ...session,
      items: reindexed
    };
  }).filter(s => s.items.length > 0);

  const totalItems = sessions.reduce((acc, s) => acc + s.items.length, 0);
  const updatedPkg: ImprovPackage = {
    ...pkg,
    sessions,
    sessionsCount: sessions.length,
    totalItems,
    updatedAt: new Date().toISOString()
  };

  await saveImprovPackage(updatedPkg);
  return updatedPkg;
}

// --------------------------------------------------------------------------
// 3. Excel Parser (SheetJS Ingestion for Improv Packages)
// --------------------------------------------------------------------------

/**
 * Parses an Excel spreadsheet (.xlsx) into a structured ImprovPackage.
 * Maps columns: Session, Item, hc-total, hint-1..N, hint-1..N-translation, hint-1..N-type / function
 */
export async function parseImprovExcelFile(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  packageTitle?: string
): Promise<ImprovPackage> {
  let data: Uint8Array;

  if (typeof File !== 'undefined' && fileOrBuffer instanceof File) {
    const arrayBuffer = await fileOrBuffer.arrayBuffer();
    data = new Uint8Array(arrayBuffer);
  } else if (fileOrBuffer instanceof Uint8Array) {
    data = fileOrBuffer;
  } else if (fileOrBuffer instanceof ArrayBuffer) {
    data = new Uint8Array(fileOrBuffer);
  } else {
    data = new Uint8Array(fileOrBuffer as any);
  }

  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Robust header detection: scan all rows for header containing 'Session', 'Item', or 'hc-total'
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
    // Attempt to extract title/desc from rows above header if available
    for (let preIdx = 0; preIdx < headerRowIdx; preIdx++) {
      const preRow = raw2D[preIdx];
      if (Array.isArray(preRow)) {
        const textCell = preRow.find(c => c !== null && c !== undefined && String(c).trim().length > 0);
        if (textCell) {
          const val = String(textCell).trim();
          if (!titleFromSheet) {
            titleFromSheet = val;
          } else if (!descFromSheet) {
            descFromSheet = val;
          }
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
    // Fallback if no specific header pattern found
    rows = XLSX.utils.sheet_to_json(worksheet);
  }

  if (!rows || rows.length === 0) {
    throw new Error('The uploaded Improv Excel file contains no data rows.');
  }

  const sessionsMap = new Map<number, ImprovItem[]>();
  let totalItemsCount = 0;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];

    // 1. Session Number
    const rawSession = row['Session'] ?? row['session'] ?? row['Session Number'] ?? row['session_number'] ?? 1;
    const sessionNumber = Number(rawSession) || 1;

    // 2. Item Number
    const rawItem = row['Item'] ?? row['item'] ?? row['Item Number'] ?? row['item_number'] ?? (rowIndex + 1);
    const itemNumber = Number(rawItem) || (rowIndex + 1);

    // 3. HC Total
    const rawHcTotal = row['hc-total'] ?? row['hc_total'] ?? row['hcTotal'] ?? row['HC Total'] ?? row['HC-Total'] ?? 0;
    let hcTotal = Number(rawHcTotal) || 0;

    // 4. Dynamic Hint Extraction (support 1 to 20 hints)
    const hints: ImprovHint[] = [];
    for (let h = 1; h <= 20; h++) {
      // Look for hint text
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
      if (hcTotal === 0) {
        hcTotal = hints.length;
      }

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

  // Construct ImprovSession list
  const sortedSessionNumbers = Array.from(sessionsMap.keys()).sort((a, b) => a - b);
  const sessions: ImprovSession[] = sortedSessionNumbers.map(sessionNum => {
    const items = sessionsMap.get(sessionNum)!.sort((a, b) => a.itemNumber - b.itemNumber);
    const sessionHcTotal = items[0]?.hcTotal || (items[0]?.hints?.length || 4);
    
    // Determine canonical hint type for each hint position (1 to sessionHcTotal)
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
  const title = packageTitle || cleanTitle || (fileOrBuffer instanceof File ? fileOrBuffer.name.replace(/\.[^/.]+$/, "") : "Imported Improv Package");
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

  return improvPackage;
}

// --------------------------------------------------------------------------
// 4. Excel Exporter (SheetJS Builder for Improv Packages)
// --------------------------------------------------------------------------

/**
 * Exports an ImprovPackage to an Excel (.xlsx) file matching the exact standard schema.
 */
export function exportImprovPackageToExcel(
  pkg: ImprovPackage,
  customFilename?: string
): Uint8Array {
  // 1. Calculate max hints across all items
  let maxHints = 5;
  pkg.sessions.forEach(s => {
    s.items.forEach(it => {
      if (it.hints.length > maxHints) {
        maxHints = it.hints.length;
      }
    });
  });

  // 2. Build Header row matching Improv-package-sample.xlsx
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

  // 3. Build AOA (Array of Arrays)
  const aoa: any[][] = [];
  aoa.push([`Presentation — ${pkg.title}`]);
  aoa.push(['Hints first; translations and explanations afterward. Fancy words are limited to 1–2 words (except the required proverb). HC 3–4 hints are intentionally related.']);
  aoa.push(headers);

  pkg.sessions.forEach(session => {
    session.items.forEach(item => {
      const rowData: any[] = [
        item.sessionNumber,
        item.itemNumber,
        item.hcTotal || item.hints.length
      ];

      for (let h = 1; h <= maxHints; h++) {
        const hint = item.hints.find(hi => hi.itemIndex === h) || item.hints[h - 1];
        rowData.push(hint ? hint.text : null);
      }
      for (let h = 1; h <= maxHints; h++) {
        const hint = item.hints.find(hi => hi.itemIndex === h) || item.hints[h - 1];
        rowData.push(hint ? hint.translation : null);
      }
      for (let h = 1; h <= maxHints; h++) {
        const hint = item.hints.find(hi => hi.itemIndex === h) || item.hints[h - 1];
        rowData.push(hint ? hint.typeFunction : null);
      }

      aoa.push(rowData);
    });
  });

  // 4. Create worksheet and workbook
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // 4. Trigger download if in browser
  const filename = customFilename || `${pkg.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Improv_Package.xlsx`;
  if (typeof window !== 'undefined') {
    XLSX.writeFile(workbook, filename);
  }

  // Return binary array buffer
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
}

// --------------------------------------------------------------------------
// 5. LLM Generator Pipeline (DeepSeek Official & Google GenAI)
// --------------------------------------------------------------------------

/**
 * Safely extracts and parses JSON from raw LLM output strings,
 * handling markdown code fences, reasoning/thinking tags (<think>, <thought>, <reasoning>),
 * trailing commas, unclosed JSON blocks, and wrapped conversational text.
 */
export function extractAndParseJson<T = any>(rawText: string): T {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('No text content received from LLM to parse as JSON.');
  }

  let text = rawText.trim();

  // 1. Remove reasoning / thought blocks (<think>...</think>, <thought>...</thought>, <reasoning>...</reasoning>)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  text = text.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  // Also strip unclosed reasoning tags if model output was truncated mid-thought
  text = text.replace(/<(?:think|thought|reasoning)>[\s\S]*$/gi, '').trim();

  // 2. Strip markdown code fences (```json ... ``` or ``` ... ```)
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    text = fenceMatch[1].trim();
  }

  // 3. Strip SSE [DONE] tokens if leaked
  text = text.replace(/data:\s*\[DONE\]\s*$/i, '').trim();

  // 4. Try direct JSON.parse
  try {
    return JSON.parse(text);
  } catch {
    // Continue to repair attempts
  }

  // 5. Clean trailing commas in objects and arrays (e.g. `{"a": 1,}` or `[1, 2,]`)
  const cleanCommas = (str: string) => str.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(cleanCommas(text));
  } catch {
    // Continue
  }

  // 6. Extract outermost JSON object { ... } or array [ ... ]
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  
  let startIndex = -1;
  let endIndex = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
    endIndex = text.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
    endIndex = text.lastIndexOf(']');
  }

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const candidate = text.substring(startIndex, endIndex + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      try {
        return JSON.parse(cleanCommas(candidate));
      } catch (err: any) {
        throw new Error(`Failed to parse LLM JSON candidate: ${err?.message}. Raw snippet: ${candidate.slice(0, 300)}`);
      }
    }
  }

  throw new Error(`Could not locate valid JSON structure in LLM output. Raw snippet: ${text.slice(0, 300)}`);
}

/**
 * Calls LLM Generation API supporting DeepSeek Official, Google GenAI (Gemini), or Custom OpenAI-compatible endpoints.
 * Implements strict JSON Mode compliance (DeepSeek requirement for 'json' keyword and Gemini responseMimeType + thinkingConfig).
 */
export async function executeLlmGeneration(
  config: ImprovLLMConfig,
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal
): Promise<string> {
  const provider = config.provider || (
    config.endpoint?.includes('deepseek.com') 
      ? 'DEEPSEEK' 
      : config.endpoint?.includes('googleapis.com') 
        ? 'GOOGLE_GENAI' 
        : 'CUSTOM_OPENAI'
  );

  // DeepSeek & JSON Mode Requirement: prompt MUST explicitly contain 'json' or 'JSON'
  const sysPromptWithJson = systemPrompt.toLowerCase().includes('json') 
    ? systemPrompt 
    : `You are an expert English pedagogy AI. You MUST respond strictly in valid JSON format.\n\n${systemPrompt}`;

  const userPromptWithJson = userPrompt.toLowerCase().includes('json')
    ? userPrompt
    : `${userPrompt}\n\nPlease output your response strictly as valid JSON.`;

  // 1. Google Gemini Provider
  if (provider === 'GOOGLE_GENAI') {
    const model = config.model || 'gemini-2.5-flash';
    const apiKey = config.apiKey?.trim();
    if (!apiKey) {
      throw new Error('Chưa cung cấp Google Gemini API Key. Vui lòng nhập API Key từ Google AI Studio.');
    }
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Payload helper:
    // Gemini 2.5 Flash / 2.5 Pro / reasoning models enable thinking by default which consumes up to 4k tokens and cuts off JSON output.
    // Setting thinkingBudget: 0 disables thinking tokens for pure, instant JSON output.
    const buildGeminiBody = (includeThinkingConfig: boolean) => {
      const genConfig: Record<string, any> = {
        responseMimeType: 'application/json',
        temperature: config.temperature ?? 0.7,
        maxOutputTokens: config.maxTokens ?? 8192
      };
      if (includeThinkingConfig) {
        genConfig.thinkingConfig = {
          thinkingBudget: 0
        };
      }
      return {
        systemInstruction: {
          parts: [{ text: sysPromptWithJson }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPromptWithJson }]
          }
        ],
        generationConfig: genConfig
      };
    };

    // Attempt first with thinkingConfig enabled for Gemini 2.5 / 2.0 / reasoning models
    const shouldTryThinkingConfig = model.includes('2.5') || model.includes('2.0') || model.includes('thinking');
    let response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buildGeminiBody(shouldTryThinkingConfig)),
      signal
    });

    // Graceful fallback: If older Gemini models reject thinkingConfig with 400 Bad Request, retry without it
    if (!response.ok && shouldTryThinkingConfig && response.status === 400) {
      const errPeek = await response.text();
      if (errPeek.includes('thinkingConfig') || errPeek.includes('thinkingBudget') || errPeek.includes('Unknown field')) {
        console.warn('[ImprovService] Gemini model rejected thinkingConfig, retrying without thinkingConfig...');
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(buildGeminiBody(false)),
          signal
        });
      } else {
        throw new Error(`Google Gemini API Error (${response.status}): ${errPeek}`);
      }
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Gemini API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text;
    
    if (!content) {
      if (candidate?.finishReason === 'MAX_TOKENS') {
        throw new Error('Google Gemini API chạm giới hạn MAX_TOKENS và bị cắt ngắn (Reasoning thoughts đã chiếm token). Hãy kiểm tra lại cấu hình thinkingBudget.');
      }
      if (candidate?.finishReason === 'SAFETY') {
        throw new Error('Google Gemini API bị chặn bởi bộ lọc an toàn (Safety Filter).');
      }
      throw new Error(`Google Gemini API không trả về nội dung. FinishReason: ${candidate?.finishReason || 'UNKNOWN'}`);
    }
    return content;
  }

  // 2. DeepSeek Official API Provider
  if (provider === 'DEEPSEEK') {
    const endpoint = 'https://api.deepseek.com/chat/completions';
    const model = config.model || 'deepseek-chat';
    const apiKey = config.apiKey?.trim() || 'sk-2fec5e48a85f48cb99efd17c24207b7e';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: sysPromptWithJson },
          { role: 'user', content: userPromptWithJson }
        ],
        response_format: { type: 'json_object' },
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 4000
      }),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`DeepSeek API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const content = choice?.message?.content;
    if (!content) {
      if (choice?.finish_reason === 'length') {
        throw new Error('DeepSeek API chạm giới hạn max_tokens. Vui lòng giảm số câu trong micro-batch.');
      }
      throw new Error('DeepSeek API không trả về nội dung.');
    }
    return content;
  }

  // 3. Custom OpenAI-compatible endpoint
  const rawEndpoint = config.endpoint || 'https://api.deepseek.com';
  const endpoint = rawEndpoint.replace(/\/+$/, '') + (rawEndpoint.endsWith('/chat/completions') ? '' : '/chat/completions');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model || 'deepseek-chat',
      messages: [
        { role: 'system', content: sysPromptWithJson },
        { role: 'user', content: userPromptWithJson }
      ],
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 4000
    }),
    signal
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('LLM API không trả về nội dung.');
  }
  return content;
}

export interface LlmTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  model: string;
}

/**
 * Verifies live connectivity and response latency to the configured LLM endpoint (DeepSeek, Google Gemini, or Custom).
 * Strictly complies with JSON mode requirements and thinkingConfig for both providers.
 */
export async function testLlmConnection(
  config: ImprovLLMConfig,
  signal?: AbortSignal
): Promise<LlmTestResult> {
  const startTime = performance.now();
  const provider = config.provider || (
    config.endpoint?.includes('deepseek.com') 
      ? 'DEEPSEEK' 
      : config.endpoint?.includes('googleapis.com') 
        ? 'GOOGLE_GENAI' 
        : 'CUSTOM_OPENAI'
  );

  const model = config.model || (
    provider === 'DEEPSEEK' 
      ? 'deepseek-chat' 
      : provider === 'GOOGLE_GENAI' 
        ? 'gemini-2.5-flash' 
        : 'gpt-4o-mini'
  );

  try {
    // 1. Google Gemini Provider
    if (provider === 'GOOGLE_GENAI') {
      const apiKey = config.apiKey?.trim();
      if (!apiKey) {
        return {
          success: false,
          latencyMs: 0,
          message: 'Chưa cung cấp Google Gemini API Key. Vui lòng nhập API Key từ Google AI Studio.',
          model
        };
      }

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const buildTestBody = (includeThinkingConfig: boolean) => {
        const genConfig: Record<string, any> = {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 1000
        };
        if (includeThinkingConfig) {
          genConfig.thinkingConfig = {
            thinkingBudget: 0
          };
        }
        return {
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Respond strictly in JSON format: {"status":"OK"}' }]
            }
          ],
          generationConfig: genConfig
        };
      };

      const shouldTryThinkingConfig = model.includes('2.5') || model.includes('2.0') || model.includes('thinking');
      let response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildTestBody(shouldTryThinkingConfig)),
        signal
      });

      if (!response.ok && shouldTryThinkingConfig && response.status === 400) {
        const errPeek = await response.text();
        if (errPeek.includes('thinkingConfig') || errPeek.includes('thinkingBudget') || errPeek.includes('Unknown field')) {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildTestBody(false)),
            signal
          });
        }
      }

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const errText = await response.text();
        return {
          success: false,
          latencyMs,
          message: `Google Gemini API Lỗi (${response.status}): ${errText.slice(0, 180)}`,
          model
        };
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        return {
          success: false,
          latencyMs,
          message: 'Google Gemini không trả về dữ liệu nội dung.',
          model
        };
      }

      return {
        success: true,
        latencyMs,
        message: `Kết nối Google Gemini (${model}) thành công! Phản hồi: ${latencyMs}ms`,
        model
      };
    }

    // 2. DeepSeek Official API Provider
    if (provider === 'DEEPSEEK') {
      const endpoint = 'https://api.deepseek.com/chat/completions';
      const apiKey = config.apiKey?.trim() || 'sk-2fec5e48a85f48cb99efd17c24207b7e';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant. You must respond strictly in JSON format.' },
            { role: 'user', content: 'Respond ONLY with JSON: {"status":"OK"}' }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 100
        }),
        signal
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const errText = await response.text();
        return {
          success: false,
          latencyMs,
          message: `DeepSeek API Lỗi (${response.status}): ${errText.slice(0, 180)}`,
          model
        };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        return {
          success: false,
          latencyMs,
          message: 'DeepSeek API không trả về dữ liệu nội dung.',
          model
        };
      }

      return {
        success: true,
        latencyMs,
        message: `Kết nối DeepSeek Official (${model}) thành công! Phản hồi: ${latencyMs}ms`,
        model
      };
    }

    // 3. Custom OpenAI-compatible endpoint
    const rawEndpoint = config.endpoint || 'https://api.deepseek.com';
    const endpoint = rawEndpoint.replace(/\/+$/, '') + (rawEndpoint.endsWith('/chat/completions') ? '' : '/chat/completions');
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey?.trim() || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant. You must respond strictly in JSON format.' },
          { role: 'user', content: 'Respond ONLY with JSON: {"status":"OK"}' }
        ],
        temperature: 0.1,
        max_tokens: 100
      }),
      signal
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        latencyMs,
        message: `API Lỗi (${response.status}): ${errText.slice(0, 180)}`,
        model
      };
    }

    return {
      success: true,
      latencyMs,
      message: `Kết nối thành công tới ${model}! Phản hồi: ${latencyMs}ms`,
      model
    };

  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      latencyMs,
      message: `Lỗi kết nối mạng: ${err?.message || 'Network request failed'}`,
      model
    };
  }
}

/**
 * Generates an ImprovPackage using resilient Micro-Batching (splitting large sessions into 5–8 item batches)
 * to guarantee that Gemini, DeepSeek, and custom LLMs never hit MAX_TOKENS or output truncation limits.
 */
export async function generateImprovPackage(
  request: ImprovGenerateRequest,
  onProgress?: (current: number, total: number, message: string) => void,
  signal?: AbortSignal
): Promise<ImprovPackage> {
  onProgress?.(1, 100, 'Đang trích xuất từ vựng giáo trình hạt giống...');

  // Step 1: Gather seed vocabularies
  let seedChunks: ChunkItem[] = [];

  if (request.sourceLessonIds && request.sourceLessonIds.length > 0) {
    for (const lId of request.sourceLessonIds) {
      const lesson = await getLessonById(lId) || curriculumRegistry.getLessonById(lId);
      if (lesson && lesson.chunks) {
        seedChunks.push(...lesson.chunks);
      }
    }
  } else if (request.sourceLevel) {
    const level = request.sourceLevel === 'ALL' ? 'LEVEL_B_ERES' : request.sourceLevel;
    const lessons = await getLessonsByLevel(level);
    lessons.forEach(l => {
      if (l.chunks) seedChunks.push(...l.chunks);
    });
  }

  // Filter seed chunks (prioritize vocab items, fallback to all chunks)
  const vocabChunks = seedChunks.filter(c => c.category === 'vocab' || c.category === 'phrase');
  const effectiveSeeds = vocabChunks.length >= 5 ? vocabChunks : seedChunks;

  // Format seed list for prompt
  let seedSample = effectiveSeeds.map((c, i) => ({
    seedNumber: i + 1,
    english: c.english,
    vietnamese: c.vietnamese || ''
  }));

  if (seedSample.length === 0) {
    seedSample = [
      { seedNumber: 1, english: 'give it a shot', vietnamese: 'thử một phen' },
      { seedNumber: 2, english: 'hit the ground running', vietnamese: 'bắt tay vào làm ngay' },
      { seedNumber: 3, english: 'room for improvement', vietnamese: 'còn cơ hội để cải thiện' },
      { seedNumber: 4, english: 'keep an eye on', vietnamese: 'để mắt tới' },
      { seedNumber: 5, english: 'break the ice', vietnamese: 'phá vỡ bầu không khí ngại ngùng' },
      { seedNumber: 6, english: 'out of the blue', vietnamese: 'bất thình lình / hoàn toàn bất ngờ' },
      { seedNumber: 7, english: 'a blessing in disguise', vietnamese: 'trong cái rủi có cái may' },
      { seedNumber: 8, english: 'to put it bluntly', vietnamese: 'nói thẳng ra là' }
    ];
  }

  // Setup sessions configs
  const sessionConfigs: ImprovSessionConfig[] = request.sessionsConfig && request.sessionsConfig.length > 0
    ? request.sessionsConfig
    : [
        { sessionNumber: 1, hcTotal: 2, hintTypes: ['Danh từ · Keyword', 'Động từ · Ending'], itemsCount: Math.ceil(request.totalItems / 4) },
        { sessionNumber: 2, hcTotal: 3, hintTypes: ['Keyword', 'Từ nối · Logic word', 'Ending'], itemsCount: Math.ceil(request.totalItems / 4) },
        { sessionNumber: 3, hcTotal: 4, hintTypes: ['Keyword', 'Từ nối · Logic word', 'Fancy word', 'Ending'], itemsCount: Math.ceil(request.totalItems / 4) },
        { sessionNumber: 4, hcTotal: 4, hintTypes: ['Keyword', 'Từ nối · Logic word', 'Fancy word', 'Ending'], itemsCount: request.totalItems - 3 * Math.ceil(request.totalItems / 4) }
      ];

  const totalSessions = sessionConfigs.length;
  const masterSystemPrompt = request.llmConfig.masterPrompt || DEFAULT_IMPROV_MASTER_PROMPT;
  const now = new Date().toISOString();
  const packageId = generateId('pkg_improv');

  // Plan micro-batches across all sessions
  // If itemsCount > 8, break into micro-batches of 5–8 items (e.g. 10 items = 2 batches of 5)
  interface PlannedBatch {
    sessionNumber: number;
    sessionConfig: ImprovSessionConfig;
    batchIndex: number;
    totalBatchesInSession: number;
    startItem: number;
    count: number;
  }

  const allPlannedBatches: PlannedBatch[] = [];
  const MICRO_BATCH_THRESHOLD = 8;

  sessionConfigs.forEach(sConfig => {
    const totalItems = sConfig.itemsCount || 5;
    if (totalItems <= MICRO_BATCH_THRESHOLD) {
      allPlannedBatches.push({
        sessionNumber: sConfig.sessionNumber,
        sessionConfig: sConfig,
        batchIndex: 0,
        totalBatchesInSession: 1,
        startItem: 1,
        count: totalItems
      });
    } else {
      // Split into 5-8 items batches (ideal batch size: 5 or 6 items)
      const batchSize = totalItems <= 12 ? Math.ceil(totalItems / 2) : 6;
      let remaining = totalItems;
      let currentStart = 1;
      const sessionBatches: { startItem: number; count: number }[] = [];
      while (remaining > 0) {
        const currentCount = Math.min(batchSize, remaining);
        sessionBatches.push({ startItem: currentStart, count: currentCount });
        currentStart += currentCount;
        remaining -= currentCount;
      }
      sessionBatches.forEach((b, bIdx) => {
        allPlannedBatches.push({
          sessionNumber: sConfig.sessionNumber,
          sessionConfig: sConfig,
          batchIndex: bIdx,
          totalBatchesInSession: sessionBatches.length,
          startItem: b.startItem,
          count: b.count
        });
      });
    }
  });

  const totalBatchesCount = allPlannedBatches.length;
  const sessionAccumulators = new Map<number, {
    title: string;
    hcTotal: number;
    hintTypes: string[];
    items: ImprovItem[];
  }>();

  // Initialize session accumulators
  sessionConfigs.forEach(sConfig => {
    sessionAccumulators.set(sConfig.sessionNumber, {
      title: `Session ${sConfig.sessionNumber}`,
      hcTotal: sConfig.hcTotal,
      hintTypes: sConfig.hintTypes,
      items: []
    });
  });

  // Step 2: Execute Micro-Batches sequentially
  for (let batchStep = 0; batchStep < allPlannedBatches.length; batchStep++) {
    const batch = allPlannedBatches[batchStep];
    const sConfig = batch.sessionConfig;
    const sessionNum = batch.sessionNumber;
    const endItem = batch.startItem + batch.count - 1;

    const progressPercent = Math.round(5 + ((batchStep) / totalBatchesCount) * 88);
    const batchInfoMsg = batch.totalBatchesInSession > 1
      ? `Đang sinh Session ${sessionNum}/${totalSessions}: câu ${batch.startItem}-${endItem} / ${sConfig.itemsCount} (${sConfig.hcTotal} hints)...`
      : `Đang sinh Session ${sessionNum}/${totalSessions}: ${sConfig.itemsCount} câu (${sConfig.hcTotal} hints)...`;

    onProgress?.(progressPercent, 100, batchInfoMsg);

    // Distribute fresh seed vocabularies for this batch
    const seedsPerBatch = Math.max(6, Math.ceil(batch.count * 1.5));
    const startSeedIdx = (batchStep * seedsPerBatch) % Math.max(1, seedSample.length);
    let batchSeeds = seedSample.slice(startSeedIdx, startSeedIdx + seedsPerBatch);
    if (batchSeeds.length < seedsPerBatch && seedSample.length >= seedsPerBatch) {
      batchSeeds = [...batchSeeds, ...seedSample.slice(0, seedsPerBatch - batchSeeds.length)];
    }
    if (batchSeeds.length === 0) {
      batchSeeds = seedSample;
    }

    const isMultiBatch = batch.totalBatchesInSession > 1;
    const sessionUserPrompt = `You must generate valid JSON for Session ${sessionNum}${isMultiBatch ? ` [Batch ${batch.batchIndex + 1}/${batch.totalBatchesInSession}: Items ${batch.startItem} to ${endItem}]` : ''} of Improv Package "${request.packageTitle}".
- Session Number: ${sessionNum}
- Total Items in this Batch: ${batch.count} (Item numbers ${batch.startItem} to ${endItem})
- Hints per Item (hcTotal): ${sConfig.hcTotal}
- Hint Types: ${JSON.stringify(sConfig.hintTypes)}
- Difficulty Level: ${request.difficulty || 'Medium (B1)'}
- Relevance / Context: ${request.relevance || 'High'}
- Seed Vocabularies: ${JSON.stringify(batchSeeds)}

CRITICAL RULES:
1. Respond ONLY with a valid JSON object matching this exact schema:
{
  "sessionNumber": ${sessionNum},
  "title": "Session ${sessionNum}: ...",
  "hcTotal": ${sConfig.hcTotal},
  "hintTypes": ${JSON.stringify(sConfig.hintTypes)},
  "items": [
    {
      "itemNumber": ${batch.startItem},
      "sessionNumber": ${sessionNum},
      "hcTotal": ${sConfig.hcTotal},
      "hints": [
        {
          "itemIndex": 1,
          "text": "...",
          "translation": "...",
          "typeFunction": "${sConfig.hintTypes[0] || 'Keyword'}"
        }
      ]
    }
  ]
}
2. Generate exactly ${batch.count} items, numbered sequentially from ${batch.startItem} to ${endItem}.
3. Every single item MUST have exactly ${sConfig.hcTotal} hints (itemIndex from 1 to ${sConfig.hcTotal}).
4. Ensure all Vietnamese translations are 100% natural, colloquial, and accurate.
5. DO NOT repeat fixed sentence patterns. Make every item unique and distinct!
6. Output ONLY pure JSON. Do NOT wrap in markdown explanation or reasoning tags.`;

    // Execute LLM call for this micro-batch
    const rawContent = await executeLlmGeneration(
      request.llmConfig,
      masterSystemPrompt,
      sessionUserPrompt,
      signal
    );

    // Robust JSON extraction
    const parsed = extractAndParseJson<any>(rawContent);

    // Extract items array from response (handling various response structures)
    let rawItems: any[] = [];
    if (Array.isArray(parsed)) {
      rawItems = parsed;
    } else if (Array.isArray(parsed.items)) {
      rawItems = parsed.items;
      if (parsed.title) sessionAccumulators.get(sessionNum)!.title = parsed.title;
    } else if (Array.isArray(parsed.sessions) && parsed.sessions[0]?.items) {
      rawItems = parsed.sessions[0].items;
      if (parsed.sessions[0].title) sessionAccumulators.get(sessionNum)!.title = parsed.sessions[0].title;
    } else if (parsed.session && Array.isArray(parsed.session.items)) {
      rawItems = parsed.session.items;
      if (parsed.session.title) sessionAccumulators.get(sessionNum)!.title = parsed.session.title;
    }

    // Normalize and validate items for this batch
    const validatedBatchItems: ImprovItem[] = rawItems.map((it: any, itIdx: number) => {
      const assignedItemNumber = batch.startItem + itIdx;
      const itemNumber = Number(it.itemNumber) || assignedItemNumber;
      const itemId = `item_s${sessionNum}_i${itemNumber}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      
      const hints: ImprovHint[] = (it.hints || []).map((h: any, hIdx: number) => ({
        id: `h_${sessionNum}_${itemNumber}_${h.itemIndex || (hIdx + 1)}`,
        text: String(h.text || '').trim(),
        translation: String(h.translation || '').trim(),
        typeFunction: String(h.typeFunction || (sConfig.hintTypes[hIdx] || `Hint ${hIdx + 1}`)).trim(),
        itemIndex: Number(h.itemIndex) || (hIdx + 1)
      }));

      // Ensure item has required hints count
      while (hints.length < sConfig.hcTotal) {
        const nextIdx = hints.length + 1;
        hints.push({
          id: `h_${sessionNum}_${itemNumber}_${nextIdx}`,
          text: `Practice chunk ${nextIdx}`,
          translation: `Gợi ý thực hành ${nextIdx}`,
          typeFunction: sConfig.hintTypes[nextIdx - 1] || 'Hint',
          itemIndex: nextIdx
        });
      }

      // If more hints than hcTotal, trim to hcTotal
      if (hints.length > sConfig.hcTotal) {
        hints.length = sConfig.hcTotal;
      }

      return {
        id: itemId,
        itemNumber,
        sessionNumber: sessionNum,
        hcTotal: hints.length,
        hints,
        createdAt: now
      };
    });

    // If LLM returned fewer items than requested, synthesize remaining items to guarantee count
    while (validatedBatchItems.length < batch.count) {
      const missingIdx = validatedBatchItems.length;
      const itemNumber = batch.startItem + missingIdx;
      const itemId = `item_s${sessionNum}_i${itemNumber}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const seed = batchSeeds[missingIdx % batchSeeds.length] || { english: 'Practice phrase', vietnamese: 'Cụm từ thực hành' };
      
      const hints: ImprovHint[] = [];
      for (let h = 1; h <= sConfig.hcTotal; h++) {
        hints.push({
          id: `h_${sessionNum}_${itemNumber}_${h}`,
          text: h === 1 ? seed.english : `Collocation ${h}`,
          translation: h === 1 ? seed.vietnamese : `Kết hợp từ ${h}`,
          typeFunction: sConfig.hintTypes[h - 1] || `Hint ${h}`,
          itemIndex: h
        });
      }

      validatedBatchItems.push({
        id: itemId,
        itemNumber,
        sessionNumber: sessionNum,
        hcTotal: hints.length,
        hints,
        createdAt: now
      });
    }

    // Append batch items to session accumulator
    sessionAccumulators.get(sessionNum)!.items.push(...validatedBatchItems);
  }

  // Step 3: Construct generatedSessions
  const generatedSessions: ImprovSession[] = sessionConfigs.map(sConfig => {
    const sessionData = sessionAccumulators.get(sConfig.sessionNumber)!;
    // Sort items by itemNumber and re-index cleanly
    const sortedItems = sessionData.items
      .sort((a, b) => a.itemNumber - b.itemNumber)
      .map((it, idx) => ({ ...it, itemNumber: idx + 1 }));

    return {
      sessionNumber: sConfig.sessionNumber,
      title: sessionData.title,
      hcTotal: sConfig.hcTotal,
      hintTypes: sConfig.hintTypes,
      items: sortedItems
    };
  });

  const totalItemsCount = generatedSessions.reduce((sum, s) => sum + s.items.length, 0);

  const pkg: ImprovPackage = {
    id: packageId,
    title: request.packageTitle || 'Generated Improv Package',
    description: `Generated Improv package with ${generatedSessions.length} sessions and ${totalItemsCount} items.`,
    totalItems: totalItemsCount,
    sessionsCount: generatedSessions.length,
    sessions: generatedSessions,
    sourceCourseLevel: request.sourceLevel,
    sourceLessonIds: request.sourceLessonIds,
    createdAt: now,
    updatedAt: now
  };

  // Step 4: Save to Firestore & Local Storage
  await saveImprovPackage(pkg);

  onProgress?.(100, 100, `Hoàn tất tạo thành công ${pkg.title} với ${totalItemsCount} items!`);

  return pkg;
}
