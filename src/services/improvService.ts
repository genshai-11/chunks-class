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
  ImprovGenerateRequest,
  ChunkItem
} from '../types';
import { DEFAULT_IMPROV_PACKAGES } from '../data/defaultImprovPackages';

// --------------------------------------------------------------------------
// 1. Default Master System Prompt & LLM Configuration
// --------------------------------------------------------------------------

export const DEFAULT_IMPROV_MASTER_PROMPT = `You are the Lead English Pedagogy & Speech Chunking Architect for the CHUNKS Improv Reflex Platform.

CHUNKS Improv is an interactive, hint-based English reflex training system. Learners deduce, shadow, and master spoken English chunks through progressive deduction clues (hints) for each target item.

### INSTRUCTIONS:
1. You will be given a target package title, difficulty level, relevance level, session configuration (number of sessions, items count per session, hcTotal per item, hintTypes), and a pool of seed vocabulary chunks from the CHUNKS curriculum.
2. For each Session, create the specified number of items.
3. For each Item, Hint 1 MUST be the target core vocabulary/chunk (or seed chunk). Subsequent hints (Hint 2, Hint 3, Hint 4, etc.) must follow the progressive hint types specified in the session config:
   - Core Meaning / Seed Chunk: Target English chunk with accurate Vietnamese translation.
   - Collocation / Syntactic Slot: Natural word partner or phrase extension.
   - Contextual Example / Situation: Real-world everyday or workplace context sentence.
   - Contrast / Antonym / Trap: Distinguishing nuances or common learner pitfalls.
   - Reflex Dialogue / Reaction: Rapid-fire conversational turn or question-and-answer reflex.
4. Vietnamese translations must be 100% natural, colloquial Vietnamese (Latin Extended, Be Vietnam Pro typography safe).
5. Adjust difficulty and relevance according to the requested settings:
   - Difficulty:
     * EASY: High-frequency conversational chunks, straightforward hints, direct clues.
     * MEDIUM: Workplace & social nuances, collocations, idiomatic phrasing.
     * HARD: Deep emotional reflexes, abstract collocations, subtle contrast traps.
   - Relevance:
     * LOW: Creative, diverse general life situations.
     * MEDIUM: Practical daily conversation & travel scenarios.
     * HIGH: High-priority workplace, professional, and core communication situations.

### OUTPUT FORMAT:
You MUST output ONLY a valid JSON object matching the following structure without any surrounding text or explanation:
{
  "title": "Package Title",
  "description": "Package Description",
  "sessions": [
    {
      "sessionNumber": 1,
      "title": "Session 1: Workplace Reflexes",
      "hcTotal": 4,
      "hintTypes": ["Core Meaning", "Collocation", "Context Example", "Reflex Dialogue"],
      "items": [
        {
          "itemNumber": 1,
          "sessionNumber": 1,
          "hcTotal": 4,
          "hints": [
            {
              "itemIndex": 1,
              "text": "give it a shot",
              "translation": "thử làm xem sao / thử một phen",
              "typeFunction": "Core Meaning"
            },
            {
              "itemIndex": 2,
              "text": "why don't you give it a shot",
              "translation": "sao bạn không thử làm một phen xem",
              "typeFunction": "Collocation"
            },
            {
              "itemIndex": 3,
              "text": "If you're not sure about the new project, just give it a shot.",
              "translation": "Nếu bạn chưa chắc về dự án mới, cứ thử làm một phen xem sao.",
              "typeFunction": "Context Example"
            },
            {
              "itemIndex": 4,
              "text": "Should I apply for the position? - Definitely, give it a shot!",
              "translation": "Tôi có nên nộp đơn ứng tuyển không? - Chắc chắn rồi, cứ thử đi!",
              "typeFunction": "Reflex Dialogue"
            }
          ]
        }
      ]
    }
  ]
}`;

export const DEFAULT_IMPROV_LLM_CONFIG: ImprovLLMConfig = {
  endpoint: 'http://34.56.142.97:20128/v1',
  apiKey: 'sk-ba04304581f3081e-z78xn9-2f401106',
  model: 'ds/deepseek-v4-flash',
  masterPrompt: DEFAULT_IMPROV_MASTER_PROMPT,
  temperature: 0.7,
  maxTokens: 4000
};

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
      const packages = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ImprovPackage));
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
      const parsed: ImprovPackage[] = JSON.parse(saved);
      if (parsed && parsed.length > 0) {
        return parsed.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      }
    }
  } catch {}

  return DEFAULT_IMPROV_PACKAGES;
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

// --------------------------------------------------------------------------
// 3. Excel Parser (SheetJS Ingestion for Improv Packages)
// --------------------------------------------------------------------------

/**
 * Parses an Excel spreadsheet (.xlsx) into a structured ImprovPackage.
 * Maps columns: Session, Item, hc-total, hint-1..N, hint-1..N-translation, hint-1..N-type / function
 */
export async function parseImprovExcelFile(
  fileOrBuffer: File | ArrayBuffer,
  packageTitle?: string
): Promise<ImprovPackage> {
  let arrayBuffer: ArrayBuffer;

  if (fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    arrayBuffer = fileOrBuffer;
  }

  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

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
    
    // Collect distinct hint types in this session
    const hintTypeSet = new Set<string>();
    items.forEach(it => it.hints.forEach(h => {
      if (h.typeFunction) hintTypeSet.add(h.typeFunction);
    }));

    return {
      sessionNumber: sessionNum,
      title: `Session ${sessionNum}`,
      hcTotal: sessionHcTotal,
      hintTypes: Array.from(hintTypeSet),
      items
    };
  });

  const title = packageTitle || (fileOrBuffer instanceof File ? fileOrBuffer.name.replace(/\.[^/.]+$/, "") : "Imported Improv Package");
  const now = new Date().toISOString();

  const improvPackage: ImprovPackage = {
    id: generateId('pkg_improv'),
    title,
    description: `Imported Improv package containing ${sessions.length} sessions and ${totalItemsCount} practice items.`,
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
  let maxHints = 4;
  pkg.sessions.forEach(s => {
    s.items.forEach(it => {
      if (it.hints.length > maxHints) {
        maxHints = it.hints.length;
      }
    });
  });

  // 2. Build rows
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

  // 3. Create worksheet and workbook
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Improv_Package');

  // 4. Trigger download if in browser
  const filename = customFilename || `${pkg.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Improv_Package.xlsx`;
  if (typeof window !== 'undefined') {
    XLSX.writeFile(workbook, filename);
  }

  // Return binary array buffer
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
}

// --------------------------------------------------------------------------
// 5. LLM Generator Pipeline
// --------------------------------------------------------------------------

/**
 * Generates an ImprovPackage using DeepSeek / LLM API based on the request parameters.
 */
export async function generateImprovPackage(
  request: ImprovGenerateRequest,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<ImprovPackage> {
  onProgress?.(1, 10, 'Gathering seed curriculum vocabularies...');

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
  const seedSample = effectiveSeeds.slice(0, 40).map((c, i) => ({
    seedNumber: i + 1,
    english: c.english,
    vietnamese: c.vietnamese
  }));

  onProgress?.(3, 10, 'Compiling LLM generation prompt...');

  // Step 2: Prepare LLM Prompt
  const userPrompt = JSON.stringify({
    task: "GENERATE_IMPROV_PACKAGE",
    packageTitle: request.packageTitle,
    difficulty: request.difficulty,
    relevance: request.relevance,
    totalItems: request.totalItems,
    sessionsConfig: request.sessionsConfig,
    seedVocabulariesCount: seedSample.length,
    seedVocabularies: seedSample
  }, null, 2);

  const systemPrompt = request.llmConfig.masterPrompt || DEFAULT_IMPROV_MASTER_PROMPT;

  onProgress?.(5, 10, `Sending request to DeepSeek LLM (${request.llmConfig.model})...`);

  // Step 3: Call OpenAI-compatible LLM endpoint
  const endpoint = request.llmConfig.endpoint.replace(/\/+$/, '') + '/chat/completions';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${request.llmConfig.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: request.llmConfig.model || 'ds/deepseek-v4-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please generate the Improv package based on this configuration:\n\n${userPrompt}` }
      ],
      temperature: request.llmConfig.temperature ?? 0.7,
      max_tokens: request.llmConfig.maxTokens ?? 4000
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API Generation Error (${response.status}): ${errText}`);
  }

  onProgress?.(7, 10, 'Parsing LLM response...');

  const responseData = await response.json();
  const rawContent = responseData.choices?.[0]?.message?.content || '';

  if (!rawContent) {
    throw new Error('LLM returned an empty response.');
  }

  // Step 4: Clean up and parse JSON
  let cleanedJson = rawContent.trim();
  
  // Strip markdown code fences if present
  if (cleanedJson.startsWith('```json')) {
    cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanedJson.startsWith('```')) {
    cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Strip trailing SSE [DONE] if leaked
  cleanedJson = cleanedJson.replace(/data:\s*\[DONE\]\s*$/, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleanedJson);
  } catch (jsonErr: any) {
    // Try to locate JSON object within output
    const firstBrace = cleanedJson.indexOf('{');
    const lastBrace = cleanedJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        parsed = JSON.parse(cleanedJson.substring(firstBrace, lastBrace + 1));
      } catch (innerErr) {
        throw new Error(`Failed to parse LLM JSON output: ${jsonErr?.message}. Raw output snippet: ${cleanedJson.slice(0, 300)}`);
      }
    } else {
      throw new Error(`Invalid JSON returned by LLM: ${jsonErr?.message}`);
    }
  }

  onProgress?.(9, 10, 'Building and persisting ImprovPackage entity...');

  // Step 5: Construct ImprovPackage entity
  const packageId = generateId('pkg_improv');
  const now = new Date().toISOString();

  const generatedSessions: ImprovSession[] = (parsed.sessions || []).map((s: any, sIdx: number) => {
    const sessionNum = s.sessionNumber || (sIdx + 1);
    const sessionTitle = s.title || `Session ${sessionNum}`;
    const hcTotal = s.hcTotal || 4;
    const hintTypes: string[] = Array.isArray(s.hintTypes) ? s.hintTypes : [];

    const items: ImprovItem[] = (s.items || []).map((it: any, itIdx: number) => {
      const itemNumber = it.itemNumber || (itIdx + 1);
      const itemHcTotal = it.hcTotal || hcTotal;
      const itemId = `item_s${sessionNum}_i${itemNumber}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const hints: ImprovHint[] = (it.hints || []).map((h: any, hIdx: number) => ({
        id: `h_${sessionNum}_${itemNumber}_${h.itemIndex || (hIdx + 1)}`,
        text: String(h.text || '').trim(),
        translation: String(h.translation || '').trim(),
        typeFunction: String(h.typeFunction || `Hint ${hIdx + 1}`).trim(),
        itemIndex: h.itemIndex || (hIdx + 1)
      }));

      return {
        id: itemId,
        itemNumber,
        sessionNumber: sessionNum,
        hcTotal: itemHcTotal,
        hints,
        createdAt: now
      };
    });

    return {
      sessionNumber: sessionNum,
      title: sessionTitle,
      hcTotal,
      hintTypes,
      items
    };
  });

  const totalItems = generatedSessions.reduce((sum, s) => sum + s.items.length, 0);

  const pkg: ImprovPackage = {
    id: packageId,
    title: parsed.title || request.packageTitle || 'Generated Improv Package',
    description: parsed.description || `Generated package with ${generatedSessions.length} sessions and ${totalItems} items.`,
    totalItems,
    sessionsCount: generatedSessions.length,
    sessions: generatedSessions,
    createdAt: now,
    updatedAt: now,
    sourceCourseLevel: request.sourceLevel,
    sourceLessonIds: request.sourceLessonIds
  };

  // Step 6: Save to Firestore & Local Storage
  await saveImprovPackage(pkg);

  onProgress?.(10, 10, `Successfully generated ${pkg.title} with ${totalItems} items!`);

  return pkg;
}
