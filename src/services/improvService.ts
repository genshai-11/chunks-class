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
import { modelRegistryService, getSafeGeminiKey } from './modelRegistryService';
import { 
  ImprovPackage, 
  ImprovSession, 
  ImprovItem, 
  ImprovHint, 
  ImprovLLMConfig, 
  ImprovSessionConfig,
  ImprovGenerateRequest,
  ImprovBatchGenerationStatus,
  ImprovGenerateProgressDetail,
  ChunkItem
} from '../types';
import { DEFAULT_IMPROV_PACKAGES } from '../data/defaultImprovPackages';
import { IMPROV_SET_01, IMPROV_SET_02 } from '../data/improvSet01And02';

export function loadDefaultPresets(): ImprovPackage[] {
  return [IMPROV_SET_01, IMPROV_SET_02];
}

export const LOCAL_STORAGE_DELETED_IMPROV_KEY = 'chunks_improv_deleted_packages';

export function getDeletedPackageIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_IMPROV_KEY);
    const legacyRaw = localStorage.getItem('chunks_improv_deleted_package_ids');
    const ids = new Set<string>();
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) parsed.forEach((id: string) => ids.add(id));
    }
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw);
      if (Array.isArray(legacyParsed)) legacyParsed.forEach((id: string) => ids.add(id));
    }
    return ids;
  } catch {
    return new Set();
  }
}

export function markPackageDeleted(id: string): void {
  try {
    const ids = getDeletedPackageIds();
    ids.add(id);
    const arr = Array.from(ids);
    localStorage.setItem(LOCAL_STORAGE_DELETED_IMPROV_KEY, JSON.stringify(arr));
    localStorage.setItem('chunks_improv_deleted_package_ids', JSON.stringify(arr));
  } catch {}
}

export function ensureDefaultSetsPresent(packages: ImprovPackage[]): ImprovPackage[] {
  const deletedIds = getDeletedPackageIds();
  const result = [...packages];
  const existingIds = new Set(result.map(p => p.id));

  // If IMPROV_SET_02 is missing, prepend it (only if not deleted)
  if (!existingIds.has(IMPROV_SET_02.id) && !deletedIds.has(IMPROV_SET_02.id)) {
    result.unshift(IMPROV_SET_02);
  }

  // If IMPROV_SET_01 is missing, prepend it (so Set 01 comes first, only if not deleted)
  if (!existingIds.has(IMPROV_SET_01.id) && !deletedIds.has(IMPROV_SET_01.id)) {
    result.unshift(IMPROV_SET_01);
  }

  return result;
}

// --------------------------------------------------------------------------
// 1. Default Master System Prompt & LLM Configuration
// --------------------------------------------------------------------------

export const DEFAULT_IMPROV_MASTER_PROMPT = `You are the Lead English Pedagogy & Speech Chunking Architect for the CHUNKS Improv Reflex Platform.

CHUNKS Improv is an interactive, hint-based English reflex training system. Learners deduce, shadow, and master spoken English chunks through rapid-fire clue words/phrases (1-2 words each) before producing the full communicative sentence.

### AUTHORITATIVE ARCHITECTURAL SPECIFICATIONS OF THE 3 PEDAGOGICAL DIMENSIONS:

1. **Dimension 1: Pedagogy Difficulty (Độ khó)**:
   - **Easy (A1-A2) - Elementary & Pre-intermediate Spoken Foundations**:
     * Target: CEFR A1-A2. 100% high-frequency, everyday words ('wake up', 'grab a coffee', 'heavy rain', 'feel tired', 'miss the bus', 'wait a minute', 'call a friend', 'delicious food', 'stay home', 'be late', 'good idea', 'pack a bag', 'buy a ticket').
     * STRICT FORBIDDEN IN EASY: Absolutely NO B2-C1 literary or academic words (specifically ban words like: 'meticulous', 'nostalgic', 'fierce', 'catastrophic', 'sophisticated', 'unprecedented', 'scrutiny', 'paradox', 'dilemma', 'reluctance', 'contemplate', 'intricate', 'resilience', 'nuance'). Absolutely NO advanced native idioms ('bite the bullet', 'devil's advocate', 'spill the beans', 'elephant in the room', 'par for the course', 'hit the ground running', 'double-edged sword').
     * Lateral / Random Association Rule for Easy: If Relevance is Low (Lateral/Brainstorming ngẫu nhiên), creative contrast MUST come from simple everyday objects or daily situations (e.g. 'alarm clock' vs 'heavy rain', 'coffee cup' vs 'umbrella'), NEVER by pulling in rare, complex, or literary vocabulary!
   - **Medium (B1) - Conversational Collocations & Phrasal Verbs**:
     * Everyday workplace and social fluency ('figure out', 'run out of', 'get along with', 'tight deadline', 'make up one's mind', 'have a point', 'keep in touch', 'look forward to', 'deal with', 'run into', 'make a living'). Balanced natural English. Avoid hyper-basic baby words, but also avoid obscure C1 idioms and rare academic words.
   - **Hard (B2-C1) - Idioms, Colloquial Metaphors & Nuanced Reflexes**:
     * Native-level spoken mastery ('play devil's advocate', 'bite the bullet', 'double-edged sword', 'silver lining', 'hit the ground running', 'burn the midnight oil', 'fierce competition', 'meticulous detail', 'par for the course'). Strictly ban simplistic A1 filler words.

2. **Dimension 2: Relevance / Association Context (Mức độ liên tưởng)**:
   - **Thấp / Low (Brainstorming ngẫu nhiên - Lateral Association)**:
     * Wide semantic distance, unexpected cross-domain juxtaposition forcing spontaneous sentence assembly.
     * Strict negative constraint: Never pair textbook clichés ('doctor'-'hospital', 'dinner'-'cook', 'contract'-'sign'). For Easy, contrast simple daily items; for Hard, bridge distant abstract concepts.
   - **Vừa / Medium (Tương quan ngữ cảnh - Conversational Collocations)**:
     * Authentic conversational collocations, natural dialogue pivots, realistic everyday communication scenarios.
   - **Cao / High (Gắn kết câu chuyện logic - Narrative Cohesion)**:
     * Tight narrative continuity, clear cause-and-effect transitions, chronological story progression.

3. **Dimension 3: Course Level Focus (Khóa học)**:
   - **LEVEL_B_ERES**: English Reflexes Enhancement for Speaking — conversational banter, oral hesitation elimination, dialogic reactions, emotional tone shifts, natural discourse markers.
   - **LEVEL_B_EREL**: English Reflexes Enhancement for Listening — acoustic assimilation, connected speech, reductions, listening comprehension cues.
   - **LEVEL_A**: Foundation chunking, basic sentence frames, high-frequency SVO patterns.

---

### PEDAGOGICAL STRUCTURE BASED ON SESSIONS (DUAL-LEVEL EXAMPLES):
Each Improv Package contains multiple Sessions. In each Session, each Item is an independent reflex challenge with N compact hints (1–2 words per clue):

1. **For 2-Hint Sessions (hcTotal = 2)**:
   - Hint 1: **Keyword / Core Vocab** (1–2 words: Danh từ / Động từ / Tính từ / Cụm từ).
   - Hint 2: **Ending** (1–2 words: Động từ / Tính từ / Trạng từ / Danh từ). A colorful, non-obvious collocated word or unexpected outcome.
   - *Example (Easy / A1-A2)*: Hint 1: "Wake up" (Trans: "Thức dậy", Type: "Cụm động từ · Keyword") | Hint 2: "heavy rain" (Trans: "mưa lớn", Type: "Danh từ · Ending")
   - *Example (Hard / B2-C1)*: Hint 1: "Devil's advocate" (Trans: "Người phản biện", Type: "Collocation · Keyword") | Hint 2: "fierce debate" (Trans: "tranh luận nảy lửa", Type: "Danh từ · Ending")
   - *Rule*: EVERY single item in the session MUST have completely different, creative, distinct word pairs!

2. **For 3-Hint Sessions (hcTotal = 3)**:
   - Hint 1: **Keyword / Core Vocab** (1–2 words: Phrasal verb / Cụm đàm thoại / Phản hồi cảm xúc).
   - Hint 2: **Logic word / Từ nối** (1–2 words: transition & connective words).
     *CRITICAL RULE*: Every item MUST use a DIFFERENT logic connector! Pick from: "nói cách khác" (in other words), "sau cùng" (eventually), "trước đó" (before that), "hơn nữa" (in addition), "tiếp theo" (next), "dù vậy" (nevertheless), "nếu" (if), "đồng thời" (meanwhile), "tuy nhiên" (however), "do đó" (therefore), "ví dụ" (for example), "miễn là" (as long as), "nếu không" (otherwise), "sau đó" (then), "ngoài ra" (besides).
   - Hint 3: **Ending** (Tính từ / Trạng từ / Động từ - 1–2 words).
   - *Example (Easy / A1-A2)*: Hint 1: "Miss the bus" (Trans: "Lỡ xe buýt", Type: "Keyword") | Hint 2: "do đó" (Trans: "therefore", Type: "Từ nối · Logic word") | Hint 3: "be late" (Trans: "đi trễ", Type: "Ending")
   - *Example (Hard / B2-C1)*: Hint 1: "Spill the beans" (Trans: "Bật mí bí mật", Type: "Keyword") | Hint 2: "sau cùng" (Trans: "eventually", Type: "Từ nối · Logic word") | Hint 3: "catastrophic" (Trans: "thảm họa", Type: "Ending")

3. **For 4-Hint Sessions (hcTotal = 4)**:
   - Hint 1: **Keyword / WH-question** (1–2 words: Danh từ, Cụm khuyên nhủ, WH word like "Why", "When", "How long", "Which").
   - Hint 2: **Logic word / Từ nối** (1–2 words: "while", "in contrast", "as long as", "but", "however", "therefore", "if", "otherwise", "then", "finally", etc. - MUST be different across all rows!).
   - Hint 3: **Fancy word / Ẩn dụ / Cụm gợi hình / Tục ngữ / Từ tượng thanh** (1–2 words colorful image: for Easy use simple vivid words like "rainy day", "warm cup", "fresh air", "bright light"; for Hard use idioms/collocations like "watchful eye", "shock wave", "Better safe than sorry", "red flag").
   - Hint 4: **Ending** (1–2 words: Danh từ, Tính từ, Trạng từ).
   - *Example (Easy / A1-A2)*: Hint 1: "Grab a coffee" | Hint 2: "trước khi" (before) | Hint 3: "rainy day" (ngày mưa) | Hint 4: "feel warm" (cảm thấy ấm áp)
   - *Example (Hard / B2-C1)*: Hint 1: "Elephant in the room" | Hint 2: "dù vậy" (nevertheless) | Hint 3: "watchful eye" (ánh mắt dò xét) | Hint 4: "unaddressed" (chưa giải quyết)

### STRICT PEDAGOGICAL NEGATIVE CONSTRAINTS:
- NEVER output obvious, pedestrian, textbook clichés (e.g. NEVER pair 'doctor' with 'hospital', 'dinner' with 'cook', 'contract' with 'sign', 'car' with 'drive', 'book' with 'read', 'teacher' with 'school').
- When Difficulty is EASY, you MUST STRICTLY OBEY the CEFR A1-A2 vocabulary ceiling. NEVER include B2/C1 words ('meticulous', 'nostalgic', 'fierce', 'catastrophic', 'dilemma', etc.) or C1 idioms.
- DO NOT repeat fixed sentence patterns (e.g., NEVER make all items "Why don't you..." or any repeated template).
- Every single Item in the output must be completely UNIQUE, colorful, diverse, and natural.
- Compact Clues: Hints must be limited to 1–2 words (except short proverbs/phrases).
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
      "hintTypes": ["Keyword · Cụm phản xạ", "Ending · Kết quả"],
      "items": [
        {
          "itemNumber": 1,
          "sessionNumber": 1,
          "hcTotal": 2,
          "hints": [
            {
              "itemIndex": 1,
              "text": "Wake up",
              "translation": "Thức dậy",
              "typeFunction": "Keyword · Cụm phản xạ"
            },
            {
              "itemIndex": 2,
              "text": "heavy rain",
              "translation": "mưa lớn",
              "typeFunction": "Ending · Kết quả"
            }
          ]
        }
      ]
    }
  ]
}`;

export const GOOGLE_GENAI_DEFAULT_CONFIG: ImprovLLMConfig = {
  provider: 'GOOGLE_GENAI',
  endpoint: 'https://generativelanguage.googleapis.com',
  apiKey: getSafeGeminiKey(),
  model: 'gemini-2.5-flash',
  masterPrompt: DEFAULT_IMPROV_MASTER_PROMPT,
  temperature: 0.7,
  maxTokens: 8192,
  webClientId: '918426218910-3o6ed7m94u6clst7ae0d19s2rrasrekf.apps.googleusercontent.com'
};

export const DEFAULT_IMPROV_LLM_CONFIG: ImprovLLMConfig = GOOGLE_GENAI_DEFAULT_CONFIG;

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

export function getLocalCachedImprovPackages(): ImprovPackage[] {
  const deletedIds = getDeletedPackageIds();
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_IMPROV_KEY);
    if (saved) {
      let parsed: ImprovPackage[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed = parsed.filter(p => !deletedIds.has(p.id));
        parsed = ensureDefaultSetsPresent(parsed);
        return parsed.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      }
    }
  } catch {}

  const fallback = ensureDefaultSetsPresent(DEFAULT_IMPROV_PACKAGES.filter(p => !deletedIds.has(p.id)));
  try {
    localStorage.setItem(LOCAL_STORAGE_IMPROV_KEY, JSON.stringify(fallback));
  } catch {}
  return fallback;
}

export async function getAllImprovPackages(): Promise<ImprovPackage[]> {
  const deletedIds = getDeletedPackageIds();
  try {
    const fetchPromise = getDocs(collection(db, 'improv_packages'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout (2500ms)')), 2500)
    );
    const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
    if (!snapshot.empty) {
      let packages = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ImprovPackage));
      packages = packages.filter(p => !deletedIds.has(p.id));
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

  return getLocalCachedImprovPackages();
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
  markPackageDeleted(id);
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
 * Updates an existing ImprovPackage metadata (title, description, sourceCourseLevel).
 */
export async function updateImprovPackageMetadata(
  packageId: string,
  updates: { title?: string; description?: string; sourceCourseLevel?: string }
): Promise<ImprovPackage> {
  const pkg = await getImprovPackageById(packageId);
  if (!pkg) {
    throw new Error(`Không tìm thấy Improv Package có ID: ${packageId}`);
  }

  const updatedPkg: ImprovPackage = {
    ...pkg,
    title: updates.title !== undefined ? updates.title.trim() : pkg.title,
    description: updates.description !== undefined ? updates.description.trim() : pkg.description,
    sourceCourseLevel: updates.sourceCourseLevel !== undefined ? updates.sourceCourseLevel : pkg.sourceCourseLevel,
    updatedAt: new Date().toISOString()
  };

  await saveImprovPackage(updatedPkg);
  return updatedPkg;
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
 * Calls LLM Generation API supporting Google GenAI (Gemini) or Custom OpenAI-compatible endpoints.
 * Implements strict JSON Mode compliance (Gemini responseMimeType + thinkingConfig).
 */
export async function executeLlmGeneration(
  config: ImprovLLMConfig,
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal
): Promise<string> {
  const aiConfig = modelRegistryService.getAiConfig();
  const provider = config.provider || (
    config.endpoint && !config.endpoint.includes('googleapis.com')
      ? 'CUSTOM_OPENAI'
      : 'GOOGLE_GENAI'
  );

  const effectiveApiKey = config.apiKey?.trim() 
    || aiConfig.apiKey?.trim() 
    || GOOGLE_GENAI_DEFAULT_CONFIG.apiKey;

  // JSON Mode Requirement: prompt MUST explicitly contain 'json' or 'JSON'
  const sysPromptWithJson = systemPrompt.toLowerCase().includes('json') 
    ? systemPrompt 
    : `You are an expert English pedagogy AI. You MUST respond strictly in valid JSON format.\n\n${systemPrompt}`;

  const userPromptWithJson = userPrompt.toLowerCase().includes('json')
    ? userPrompt
    : `${userPrompt}\n\nPlease output your response strictly as valid JSON.`;

  // 1. Google Gemini Provider
  if (provider === 'GOOGLE_GENAI') {
    const model = config.model || aiConfig.model || 'gemini-2.5-flash';
    const apiKey = effectiveApiKey;
    if (!apiKey) {
      throw new Error('Chưa cung cấp Google Gemini API Key. Vui lòng cấu hình API Key từ Google AI Studio.');
    }
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Payload helper:
    // Gemini 2.5 Flash / 2.5 Pro / reasoning models enable thinking by default which consumes up to 4k tokens and cuts off JSON output.
    // Setting thinkingBudget: 0 disables thinking tokens for pure, instant JSON output.
    const buildGeminiBody = (includeThinkingConfig: boolean) => {
      const genConfig: Record<string, any> = {
        responseMimeType: 'application/json',
        temperature: config.temperature ?? 0.7,
        maxOutputTokens: config.maxTokens ?? 16384
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

    if (candidate?.finishReason === 'MAX_TOKENS') {
      if (content) {
        try {
          extractAndParseJson(content);
        } catch {
          throw new Error('Google Gemini API chạm giới hạn token (finishReason: MAX_TOKENS). Dữ liệu JSON bị cắt ngắn giữa chừng.');
        }
      } else {
        throw new Error('Google Gemini API chạm giới hạn token (finishReason: MAX_TOKENS). Dữ liệu JSON bị cắt ngắn giữa chừng.');
      }
    }

    if (candidate?.finishReason === 'SAFETY') {
      throw new Error('Google Gemini API bị chặn bởi bộ lọc an toàn (Safety Filter).');
    }
    
    if (!content) {
      throw new Error(`Google Gemini API không trả về nội dung. FinishReason: ${candidate?.finishReason || 'UNKNOWN'}`);
    }
    return content;
  }

  // 2. Custom OpenAI-compatible endpoint
  const rawEndpoint = config.endpoint || 'https://api.openai.com/v1';
  const endpoint = rawEndpoint.replace(/\/+$/, '') + (rawEndpoint.endsWith('/chat/completions') ? '' : '/chat/completions');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${effectiveApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
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
 * Verifies live connectivity and response latency to the configured LLM endpoint (Google Gemini or Custom).
 */
export async function testLlmConnection(
  config: ImprovLLMConfig,
  signal?: AbortSignal
): Promise<LlmTestResult> {
  const aiConfig = modelRegistryService.getAiConfig();
  const provider = config.provider || (
    config.endpoint && !config.endpoint.includes('googleapis.com')
      ? 'CUSTOM_OPENAI'
      : 'GOOGLE_GENAI'
  );

  const effectiveApiKey = config.apiKey?.trim() 
    || aiConfig.apiKey?.trim() 
    || GOOGLE_GENAI_DEFAULT_CONFIG.apiKey;
  const model = config.model || aiConfig.model || (provider === 'GOOGLE_GENAI' ? 'gemini-2.5-flash' : 'gpt-4o-mini');

  const testResult = await modelRegistryService.testAiConnection({
    provider,
    model,
    apiKey: effectiveApiKey,
    endpoint: config.endpoint,
    webClientId: config.webClientId || aiConfig.webClientId
  });

  return {
    success: testResult.success,
    latencyMs: testResult.latencyMs,
    message: testResult.message,
    model: testResult.model
  };
}

export const testLlmConnectivity = testLlmConnection;

// --------------------------------------------------------------------------
// Dynamic Directives & Temperature Tuning for Improv Generation
// --------------------------------------------------------------------------

export function getDynamicTemperature(relevance: string = ''): number {
  const rel = relevance.toLowerCase();
  if (rel === 'low' || rel.includes('thấp') || rel.includes('ngẫu nhiên')) {
    return 0.88;
  }
  if (rel === 'high' || rel.includes('cao') || rel.includes('gắn kết')) {
    return 0.50;
  }
  return 0.70;
}

export function getRelevanceDirective(relevance: string = ''): string {
  const rel = relevance.toLowerCase();
  if (rel === 'low' || rel.includes('thấp') || rel.includes('ngẫu nhiên')) {
    return `★★★ LATERAL ASSOCIATION & HIGH CREATIVE CONTRAST (Thấp - Brainstorming ngẫu nhiên) ★★★
STRICT NEGATIVE CONSTRAINT: DO NOT pair obvious literal synonyms, textbook collocations, or immediate thematic associates (e.g. NEVER pair 'doctor' with 'hospital', 'dinner' with 'cook', 'contract' with 'sign', 'car' with 'drive', 'book' with 'read', 'teacher' with 'school').
INSTEAD: Forge UNEXPECTED, CROSS-DOMAIN, LATERAL bridges! Juxtapose unexpected situations or ideas that act as surprising cognitive springboards forcing the learner's brain to construct a creative, spontaneous communicative sentence.
DIFFICULTY ALIGNMENT FOR LATERAL CONTRAST: If Difficulty is Easy (A1-A2), lateral contrast MUST be created using simple everyday objects and daily situations (e.g., 'alarm clock' vs 'heavy rain', 'coffee cup' vs 'umbrella'), NEVER by introducing rare, complex, or literary vocabulary! Every clue must be effortlessly understood and spoken by an A1-A2 beginner!
SEMANTIC DISTANCE: Maximize semantic diversity across items. Every single item in this session must portray a completely different, unexpected situation and emotional setting!`;
  }
  if (rel === 'high' || rel.includes('cao') || rel.includes('gắn kết')) {
    return `★★★ TIGHT LOGICAL COHESION (Cao - Gắn kết câu chuyện logic) ★★★
Enforce tight narrative continuity, clear cause-and-effect transitions, chronological story progression, and cohesive thematic alignment across hints. Clues should form a logical chain leading directly to the communicative payoff.`;
  }
  return `★★★ BALANCED CONTEXTUAL RELEVANCE (Vừa - Tương quan ngữ cảnh) ★★★
Create authentic conversational collocations, natural dialogue pivots, and realistic everyday communication scenarios. Words should feel naturally connected in spoken English without being overly trivial.`;
}

export function getDifficultyDirective(difficulty: string = ''): string {
  const diff = difficulty.toLowerCase();
  if (diff === 'hard' || diff.includes('hard') || diff.includes('b2-c1') || diff.includes('khó') || diff.includes('nâng cao')) {
    return `★★★ PEDAGOGY DIFFICULTY: HARD (B2-C1) - IDIOMS, PHRASAL VERBS & ADVANCED STRUCTURES ★★★
MANDATORY: Use advanced colloquial idioms, multi-word verbs, metaphorical expressions, and C1 collocations (e.g., 'call it a day', 'on the fence', 'spill the beans', 'elephant in the room', 'play devil's advocate', 'bite the bullet', 'double-edged sword', 'silver lining', 'dead set on', 'par for the course', 'hit the ground running', 'burn the midnight oil', 'touch and go', 'cut corners', 'fierce competition', 'meticulous detail').
STRICT BAN: Absolutely NO basic A1-A2 filler words (e.g., 'good', 'bad', 'happy', 'sad', 'big', 'small', 'go', 'come', 'eat', 'sleep', 'nice', 'like') unless paired in an advanced idiomatic or ironic sense!
Hints must challenge upper-intermediate and advanced learners to synthesize sophisticated oral expressions with nuanced emotional tones.`;
  }
  if (diff === 'easy' || diff.includes('easy') || diff.includes('a1-a2') || diff.includes('dễ') || diff.includes('đơn giản')) {
    return `★★★ PEDAGOGY DIFFICULTY: EASY (A1-A2) - 100% ELEMENTARY & PRE-INTERMEDIATE SPOKEN VOCABULARY ★★★
ABSOLUTE VOCABULARY CEILING: Every word MUST be high-frequency CEFR A1-A2 daily spoken English (e.g., 'wake up', 'grab a coffee', 'heavy rain', 'feel tired', 'miss the bus', 'wait a minute', 'call a friend', 'good news', 'delicious food', 'stay home', 'be late', 'pack a bag', 'save money', 'order food', 'clean the house', 'take an umbrella').
STRICT NEGATIVE CONSTRAINTS & BANS:
1. STRICTLY FORBIDDEN: NEVER use advanced C1/B2 literary or academic words such as: 'meticulous', 'nostalgic', 'fierce', 'catastrophic', 'sophisticated', 'unprecedented', 'scrutiny', 'paradox', 'dilemma', 'reluctance', 'contemplate', 'intricate', 'resilience', 'nuance'.
2. STRICTLY FORBIDDEN: NEVER use native C1 idioms (e.g., 'bite the bullet', 'devil's advocate', 'spill the beans', 'elephant in the room', 'par for the course', 'hit the ground running', 'double-edged sword').
3. SEED ADAPTATION MANDATE: If any seed vocabulary provided below contains B2/C1 advanced idioms or formal words, you MUST downscale or adapt them into simple A1-A2 everyday expressions!
4. RELEVANCE ALIGNMENT: If Relevance is Low (Lateral/Brainstorming ngẫu nhiên), create contrast using SIMPLE daily objects and situations (e.g., 'alarm clock' vs 'heavy rain', 'umbrella' vs 'sunny day'), NEVER by introducing complex or literary vocabulary! Every clue must be effortlessly understood and spoken by an A1-A2 beginner!`;
  }
  return `★★★ PEDAGOGY DIFFICULTY: MEDIUM (B1) - CONVERSATIONAL COLLOCATIONS & PHRASAL VERBS ★★★
Focus on natural spoken English, practical phrasal verbs, workplace and social collocations, and common spoken discourse markers (e.g., 'figure out', 'run out of', 'get along with', 'tight deadline', 'make up my mind', 'have a point', 'keep in touch', 'look forward to', 'run into', 'make a living', 'deal with', 'come up with').
AVOID BOTH EXTREMES: DO NOT use hyper-basic baby words exclusively, and DO NOT use obscure C1/C2 idioms or rare academic words (specifically avoid words like 'meticulous', 'paradox', 'reluctance', 'unprecedented', 'catastrophic').`;
}

export function getCourseLevelDirective(sourceLevel: string = ''): string {
  const lvl = String(sourceLevel).toUpperCase();
  if (lvl.includes('LEVEL_B_ERES') || lvl.includes('ERES')) {
    return `★★★ PEDAGOGICAL COURSE FOCUS: LEVEL B - ERES (English Reflexes Enhancement for Speaking) ★★★
Focus strictly on SPOKEN fluency, natural conversational pivots, oral hesitation elimination, dynamic dialogic reactions, dialogue banter, emotional tone shifts, and authentic spoken speech markers (e.g., 'Well, honestly...', 'Look, the thing is...', 'To be fair...', 'You know what?'). Avoid stiff written or formal academic phrasing!`;
  }
  if (lvl.includes('LEVEL_B_EREL') || lvl.includes('EREL')) {
    return `★★★ PEDAGOGICAL COURSE FOCUS: LEVEL B - EREL (English Reflexes Enhancement for Listening) ★★★
Focus on listening comprehension, acoustic blends, connected speech cues, reduction markers, and auditory reflex challenges. Clues should prepare learners for rapid native speech assimilation.`;
  }
  if (lvl.includes('LEVEL_A')) {
    return `★★★ PEDAGOGICAL COURSE FOCUS: LEVEL A - FOUNDATION REFLEXES ★★★
Focus on core syntactic chunking, subject-verb-object automaticity, and essential daily situational vocabulary.`;
  }
  return `★★★ PEDAGOGICAL COURSE FOCUS: COMPREHENSIVE SPOKEN REFLEXES ★★★
Focus on natural conversational agility, authentic native spoken chunking, and spontaneous sentence assembly.`;
}

function synthesizeFallbackBatchItems(
  batch: { startItem: number; count: number; sessionNumber: number },
  sConfig: ImprovSessionConfig,
  batchSeeds: { english: string; vietnamese: string }[],
  now: string
): ImprovItem[] {
  const items: ImprovItem[] = [];
  for (let itIdx = 0; itIdx < batch.count; itIdx++) {
    const itemNumber = batch.startItem + itIdx;
    const itemId = `item_s${batch.sessionNumber}_i${itemNumber}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const seed = batchSeeds[itIdx % Math.max(1, batchSeeds.length)] || { english: 'Practice phrase', vietnamese: 'Cụm từ thực hành' };
    const hints: ImprovHint[] = [];
    for (let h = 1; h <= sConfig.hcTotal; h++) {
      hints.push({
        id: `h_${batch.sessionNumber}_${itemNumber}_${h}`,
        text: h === 1 ? seed.english : `Reflex chunk ${h}`,
        translation: h === 1 ? seed.vietnamese : `Gợi ý phản xạ ${h}`,
        typeFunction: sConfig.hintTypes[h - 1] || (h === 1 ? 'Keyword' : h === sConfig.hcTotal ? 'Ending' : 'Logic word'),
        itemIndex: h
      });
    }
    items.push({
      id: itemId,
      itemNumber,
      sessionNumber: batch.sessionNumber,
      hcTotal: hints.length,
      hints,
      createdAt: now
    });
  }
  return items;
}

/**
 * Generates an ImprovPackage using resilient Micro-Batching (splitting large sessions into 5–8 item batches)
 * to guarantee that Gemini, DeepSeek, and custom LLMs never hit MAX_TOKENS or output truncation limits.
 */
export async function generateImprovPackage(
  request: ImprovGenerateRequest,
  onProgress?: (
    current: number, 
    total: number, 
    message: string, 
    detail?: ImprovGenerateProgressDetail
  ) => void,
  signal?: AbortSignal
): Promise<ImprovPackage> {
  // Extract dynamic directives and temperature
  const dynamicTemperature = getDynamicTemperature(request.relevance);
  const relevanceDirective = getRelevanceDirective(request.relevance);
  const difficultyDirective = getDifficultyDirective(request.difficulty);
  const courseLevelDirective = getCourseLevelDirective(request.sourceLevel);

  // Read AI config from ModelRegistryService if apiKey or provider is not specified
  const aiConfig = modelRegistryService.getAiConfig();
  const effectiveLlmConfig: ImprovLLMConfig = {
    ...GOOGLE_GENAI_DEFAULT_CONFIG,
    ...request.llmConfig,
    temperature: dynamicTemperature,
    provider: request.llmConfig?.provider || aiConfig.provider || 'GOOGLE_GENAI',
    apiKey: request.llmConfig?.apiKey?.trim() || aiConfig.apiKey?.trim() || GOOGLE_GENAI_DEFAULT_CONFIG.apiKey,
    model: request.llmConfig?.model || aiConfig.model || GOOGLE_GENAI_DEFAULT_CONFIG.model,
    endpoint: request.llmConfig?.endpoint || aiConfig.endpoint || GOOGLE_GENAI_DEFAULT_CONFIG.endpoint,
    webClientId: request.llmConfig?.webClientId || aiConfig.webClientId || GOOGLE_GENAI_DEFAULT_CONFIG.webClientId
  };

  // Step 1: Gather seed vocabularies (Dynamic Firestore support first)
  let seedChunks: ChunkItem[] = [];

  // If specific sourceLessonIds provided, fetch each lesson (Firestore first, fallback to curriculumRegistry)
  if (request.sourceLessonIds && request.sourceLessonIds.length > 0) {
    for (const lId of request.sourceLessonIds) {
      const lesson = await getLessonById(lId) || curriculumRegistry.getLessonById(lId);
      if (lesson && lesson.chunks) {
        seedChunks.push(...lesson.chunks);
      }
    }
  }

  // When sourceLessonIds or sourceLevel is provided, also load lessons dynamically using getLessonsByLevel(request.sourceLevel) from Firestore
  if (request.sourceLevel) {
    const level = request.sourceLevel === 'ALL' ? 'LEVEL_B_ERES' : request.sourceLevel;
    const dynamicLessons = await getLessonsByLevel(level);
    dynamicLessons.forEach(l => {
      if (l.chunks) {
        if (!request.sourceLessonIds || request.sourceLessonIds.length === 0) {
          seedChunks.push(...l.chunks);
        } else if (seedChunks.length < 15) {
          // Supplement seed chunks if selected lesson pool is small
          seedChunks.push(...l.chunks);
        }
      }
    });
  }

  // Deduplicate chunks by chunk_id
  const seenChunkIds = new Set<string>();
  seedChunks = seedChunks.filter(c => {
    const cid = c.chunk_id || (c as any).id;
    if (!cid || seenChunkIds.has(cid)) return false;
    seenChunkIds.add(cid);
    return true;
  });

  // If specific vocab IDs were selected by the teacher, prioritize them
  if (request.selectedVocabIds && request.selectedVocabIds.length > 0) {
    const selectedIdSet = new Set(request.selectedVocabIds);
    const prioritizedSeeds = seedChunks.filter(c => selectedIdSet.has(c.chunk_id) || selectedIdSet.has((c as any).id));
    if (prioritizedSeeds.length > 0) {
      seedChunks = prioritizedSeeds;
    }
  }

  // Filter seed chunks (prioritize vocab items, fallback to all chunks)
  const vocabChunks = seedChunks.filter(c => c.category === 'vocab' || c.category === 'phrase');
  const effectiveSeeds = vocabChunks.length >= 5 ? vocabChunks : seedChunks;

  // Format seed list for prompt
  let seedSample = effectiveSeeds.map((c, i) => {
    const eng = (c.english || (c as any).en || (c as any).text || '').trim();
    const vie = (c.vietnamese || (c as any).vi || (c as any).translation || (c as any).meaning || '').trim();
    return {
      seedNumber: i + 1,
      english: eng,
      vietnamese: vie
    };
  }).filter(s => s.english.length > 0);

  const isEasy = (request.difficulty || '').toLowerCase().includes('easy') || (request.difficulty || '').toLowerCase().includes('a1-a2') || (request.difficulty || '').toLowerCase().includes('dễ');
  if (seedSample.length === 0) {
    if (isEasy) {
      seedSample = [
        { seedNumber: 1, english: 'wake up early', vietnamese: 'thức dậy sớm' },
        { seedNumber: 2, english: 'take a break', vietnamese: 'nghỉ ngơi một lát' },
        { seedNumber: 3, english: 'heavy rain', vietnamese: 'mưa lớn' },
        { seedNumber: 4, english: 'grab a coffee', vietnamese: 'mua cốc cà phê' },
        { seedNumber: 5, english: 'call a friend', vietnamese: 'gọi điện cho bạn bè' },
        { seedNumber: 6, english: 'miss the bus', vietnamese: 'lỡ chuyến xe buýt' },
        { seedNumber: 7, english: 'feel tired', vietnamese: 'cảm thấy mệt mỏi' },
        { seedNumber: 8, english: 'good idea', vietnamese: 'ý kiến hay' }
      ];
    } else {
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
  }

  // Setup sessions configs
  const sessionConfigs: ImprovSessionConfig[] = request.sessionsConfig && request.sessionsConfig.length > 0
    ? request.sessionsConfig
    : [
        { sessionNumber: 1, hcTotal: 2, hintTypes: ['Keyword · Cụm phản xạ', 'Ending · Kết quả'], itemsCount: Math.ceil(request.totalItems / 4) },
        { sessionNumber: 2, hcTotal: 3, hintTypes: ['Keyword', 'Từ nối · Logic word', 'Ending'], itemsCount: Math.ceil(request.totalItems / 4) },
        { sessionNumber: 3, hcTotal: 4, hintTypes: ['Keyword', 'Từ nối · Logic word', 'Fancy word', 'Ending'], itemsCount: Math.ceil(request.totalItems / 4) },
        { sessionNumber: 4, hcTotal: 4, hintTypes: ['Keyword', 'Từ nối · Logic word', 'Fancy word', 'Ending'], itemsCount: request.totalItems - 3 * Math.ceil(request.totalItems / 4) }
      ];

  const totalSessions = sessionConfigs.length;
  const masterSystemPrompt = effectiveLlmConfig.masterPrompt || DEFAULT_IMPROV_MASTER_PROMPT;
  const now = new Date().toISOString();
  const packageId = generateId('pkg_improv');

  // Plan micro-batches across all sessions
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

  // Pre-populate batch tracking status
  const allPlannedBatchesStatus: ImprovBatchGenerationStatus[] = allPlannedBatches.map((b, idx) => ({
    batchIndex: idx,
    totalBatches: totalBatchesCount,
    sessionNumber: b.sessionNumber,
    itemsRange: `Câu ${b.startItem}-${b.startItem + b.count - 1}`,
    itemRange: [b.startItem, b.startItem + b.count - 1],
    batchId: `batch_${b.sessionNumber}_${idx}`,
    count: b.count,
    itemsCount: b.count,
    status: 'pending' as const,
    modelName: effectiveLlmConfig.model || 'gemini-2.5-flash'
  }));

  let successBatchesCount = 0;
  let failedBatchesCount = 0;

  onProgress?.(1, 100, 'Đang trích xuất từ vựng giáo trình hạt giống...', {
    batchIndex: 0,
    totalBatches: totalBatchesCount,
    batches: [...allPlannedBatchesStatus],
    successBatches: 0,
    failedBatches: 0
  });

  // Step 2: Execute Micro-Batches sequentially
  for (let batchStep = 0; batchStep < allPlannedBatches.length; batchStep++) {
    const batch = allPlannedBatches[batchStep];
    const sConfig = batch.sessionConfig;
    const sessionNum = batch.sessionNumber;
    const endItem = batch.startItem + batch.count - 1;

    allPlannedBatchesStatus[batchStep].status = 'generating';
    const batchStartTime = Date.now();

    const progressPercent = Math.round(5 + ((batchStep) / totalBatchesCount) * 88);
    const batchInfoMsg = batch.totalBatchesInSession > 1
      ? `Đang sinh Session ${sessionNum}/${totalSessions}: câu ${batch.startItem}-${endItem} / ${sConfig.itemsCount} (${sConfig.hcTotal} hints)...`
      : `Đang sinh Session ${sessionNum}/${totalSessions}: ${sConfig.itemsCount} câu (${sConfig.hcTotal} hints)...`;

    onProgress?.(progressPercent, 100, batchInfoMsg, {
      batchIndex: batchStep,
      totalBatches: totalBatchesCount,
      batches: [...allPlannedBatchesStatus],
      successBatches: successBatchesCount,
      failedBatches: failedBatchesCount
    });

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

${courseLevelDirective}

${difficultyDirective}

${relevanceDirective}

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
4. Ensure all Vietnamese translations are 100% natural, colloquial, and accurate (Latin Extended, Be Vietnam Pro typography safe).
5. STRICT ANTI-CLICHÉ RULE: Obey all negative constraints. Never pair trivial associations like dinner-cook or doctor-hospital.
6. CRITICAL DIFFICULTY COMPLIANCE: You MUST strictly conform to the Difficulty Level ('${request.difficulty || 'Medium (B1)'}'). If Difficulty is Easy, you are strictly forbidden from using words like 'meticulous', 'nostalgic', 'fierce' or C1 idioms; use only high-frequency A1-A2 daily vocabulary!
7. Output ONLY pure JSON. Do NOT wrap in markdown explanation or reasoning tags.`;

    let validatedBatchItems: ImprovItem[] = [];
    try {
      // Execute LLM call for this micro-batch
      const rawContent = await executeLlmGeneration(
        effectiveLlmConfig,
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
      validatedBatchItems = rawItems.map((it: any, itIdx: number) => {
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

      allPlannedBatchesStatus[batchStep].status = 'success';
      allPlannedBatchesStatus[batchStep].itemsCount = validatedBatchItems.length;
      allPlannedBatchesStatus[batchStep].durationMs = Date.now() - batchStartTime;
      successBatchesCount++;
    } catch (batchErr: any) {
      if (signal?.aborted) {
        throw batchErr;
      }
      console.error(`[generateImprovPackage] Error in batch ${batchStep + 1}/${totalBatchesCount}:`, batchErr);
      allPlannedBatchesStatus[batchStep].status = 'failed';
      allPlannedBatchesStatus[batchStep].error = batchErr?.message || 'Lỗi không xác định';
      allPlannedBatchesStatus[batchStep].durationMs = Date.now() - batchStartTime;
      failedBatchesCount++;

      // Use fallback synthesis for this batch so generation proceeds reliably
      validatedBatchItems = synthesizeFallbackBatchItems(batch, sConfig, batchSeeds, now);
      allPlannedBatchesStatus[batchStep].itemsCount = validatedBatchItems.length;
    }

    // Append batch items to session accumulator
    sessionAccumulators.get(sessionNum)!.items.push(...validatedBatchItems);

    onProgress?.(
      Math.round(5 + ((batchStep + 1) / totalBatchesCount) * 88),
      100,
      `Hoàn thành Session ${sessionNum}: câu ${batch.startItem}-${endItem} (${allPlannedBatchesStatus[batchStep].status === 'success' ? 'Thành công' : 'Đã dùng fallback do lỗi LLM'})`,
      {
        batchIndex: batchStep,
        totalBatches: totalBatchesCount,
        batches: [...allPlannedBatchesStatus],
        successBatches: successBatchesCount,
        failedBatches: failedBatchesCount
      }
    );
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
    description: request.packageDescription || `Generated Improv package with ${generatedSessions.length} sessions and ${totalItemsCount} items.`,
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

  onProgress?.(
    100, 
    100, 
    `Hoàn tất tạo thành công ${pkg.title} với ${totalItemsCount} items!`,
    {
      batchIndex: totalBatchesCount - 1,
      totalBatches: totalBatchesCount,
      batches: [...allPlannedBatchesStatus],
      successBatches: successBatchesCount,
      failedBatches: failedBatchesCount
    }
  );

  return pkg;
}
