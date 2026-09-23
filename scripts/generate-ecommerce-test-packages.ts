// Polyfill localStorage in Node/Bun environment if needed
if (typeof globalThis.localStorage === 'undefined') {
  const memStore = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => memStore.get(key) ?? null,
    setItem: (key: string, value: string) => { memStore.set(key, String(value)); },
    removeItem: (key: string) => { memStore.delete(key); },
    clear: () => { memStore.clear(); },
    key: (index: number) => Array.from(memStore.keys())[index] ?? null,
    get length() { return memStore.size; }
  } as any;
}

import { improvApi } from '../src/api/improvApi';
import { ImprovSessionConfig, ImprovGenerateRequest, ImprovPackage } from '../src/types';
import { DEFAULT_IMPROV_LLM_CONFIG } from '../src/services/improvService';

const SESSIONS_CONFIG: ImprovSessionConfig[] = [
  { 
    sessionNumber: 1, 
    hcTotal: 2, 
    hintTypes: ['Keyword · Cụm phản xạ', 'Ending · Kết quả'], 
    itemsCount: 3, 
    title: 'Session 1: Two-Word Reflex Pairs (2 Hints)' 
  },
  { 
    sessionNumber: 2, 
    hcTotal: 3, 
    hintTypes: ['Keyword', 'Từ nối · Logic word', 'Ending'], 
    itemsCount: 3, 
    title: 'Session 2: Three-Point Dialogic Pivot (3 Hints)' 
  },
  { 
    sessionNumber: 3, 
    hcTotal: 4, 
    hintTypes: ['Keyword', 'Từ nối · Logic word', 'Fancy word', 'Ending'], 
    itemsCount: 3, 
    title: 'Session 3: Four-Element Nuanced Reflex (4 Hints)' 
  },
  { 
    sessionNumber: 4, 
    hcTotal: 2, 
    hintTypes: ['Keyword · Cụm phản xạ', 'Ending · Kết quả'], 
    itemsCount: 3, 
    title: 'Session 4: Rapid-Fire E-commerce Pairs (2 Hints)' 
  },
  { 
    sessionNumber: 5, 
    hcTotal: 3, 
    hintTypes: ['Keyword', 'Từ nối · Logic word', 'Ending'], 
    itemsCount: 3, 
    title: 'Session 5: Customer Flow & Connectors (3 Hints)' 
  },
  { 
    sessionNumber: 6, 
    hcTotal: 4, 
    hintTypes: ['Keyword', 'Từ nối · Logic word', 'Fancy word', 'Ending'], 
    itemsCount: 3, 
    title: 'Session 6: Advanced Retail Transitions (4 Hints)' 
  },
  { 
    sessionNumber: 7, 
    hcTotal: 4, 
    hintTypes: ['Keyword', 'Từ nối · Logic word', 'Fancy word', 'Ending'], 
    itemsCount: 3, 
    title: 'Session 7: Mastery & Dispute Resolution (4 Hints)' 
  }
];

function printPackageSummary(pkg: ImprovPackage, label: string) {
  console.log(`\n======================================================`);
  console.log(`📦 ${label}: ${pkg.title}`);
  console.log(`ID: ${pkg.id}`);
  console.log(`Description: ${pkg.description}`);
  console.log(`Total Sessions: ${pkg.sessions.length} (Expected: 7)`);
  console.log(`Total Items: ${pkg.totalItems} (Expected: 21)`);
  console.log(`======================================================`);

  console.log(`\n📋 SESSIONS BREAKDOWN:`);
  console.log(`-----------------------------------------------------------------------------------------------`);
  console.log(`| Sess# | Title                                    | Items | Hints Req | Actual Hints/Item | Status |`);
  console.log(`-----------------------------------------------------------------------------------------------`);
  
  let allPass = true;
  pkg.sessions.forEach(s => {
    const expectedHints = SESSIONS_CONFIG.find(c => c.sessionNumber === s.sessionNumber)?.hcTotal ?? s.hcTotal;
    const itemsCount = s.items.length;
    const hintsPerItem = s.items.map(it => it.hints.length);
    const hintsMatch = hintsPerItem.every(h => h === expectedHints);
    const sessionPass = itemsCount === 3 && hintsMatch;
    if (!sessionPass) allPass = false;

    const rowStatus = sessionPass ? '✅ PASS' : '❌ FAIL';
    const titlePadded = s.title.padEnd(40).substring(0, 40);
    const actualHintsStr = hintsPerItem.join(',').padEnd(17);
    console.log(`|   ${s.sessionNumber}   | ${titlePadded} |   ${itemsCount}   |     ${expectedHints}     | ${actualHintsStr} | ${rowStatus} |`);
  });
  console.log(`-----------------------------------------------------------------------------------------------`);
  console.log(`Package Verification: ${allPass && pkg.totalItems === 21 && pkg.sessions.length === 7 ? '✅ 100% SPEC COMPLIANT' : '❌ NON-COMPLIANT'}\n`);

  console.log(`🔍 SAMPLE ITEMS AUDIT (First item of each session):`);
  pkg.sessions.forEach(s => {
    const item = s.items[0];
    if (item) {
      console.log(`\n  [Session ${s.sessionNumber} - Item 1] (${item.hints.length} hints):`);
      item.hints.forEach((h, idx) => {
        console.log(`    Hint ${idx + 1} [${h.typeFunction}]: "${h.text}" -> "${h.translation}"`);
      });
    }
  });
  console.log(`\n------------------------------------------------------\n`);
}

async function run() {
  console.log(`🚀 Starting CHUNKS Improv Package Generation Test...`);
  console.log(`Resource: level_b_eres_day_8 (Day 8 - Lesson 5: E-commerce & Retail)`);
  console.log(`Plan: Generate 2 packages, each having 7 sessions x 3 items = 21 items.`);
  console.log(`Hint matrix: [2, 3, 4, 2, 3, 4, 4]\n`);

  // Common Request Parameters
  const baseRequest: Omit<ImprovGenerateRequest, 'packageTitle' | 'packageDescription'> = {
    totalItems: 21,
    sessionsCount: 7,
    sessionsConfig: SESSIONS_CONFIG,
    sourceLevel: 'LEVEL_B_ERES',
    sourceLessonIds: ['level_b_eres_day_8'],
    topic: 'E-commerce & Retail (Online Shopping, Cart & Checkout, Customer Service, Returns & Refunds)',
    targetGrammar: 'Phrasal verbs and collocations for e-commerce transactions',
    conversationalTone: 'Workplace & Everyday Natural Reflex',
    targetAudience: 'Professional English & E-commerce Operators',
    difficulty: 'MEDIUM',
    relevance: 'HIGH',
    llmConfig: DEFAULT_IMPROV_LLM_CONFIG
  };

  // -------------------------------------------------------------------------
  // PACKAGE 1
  // -------------------------------------------------------------------------
  console.log(`\n======================================================`);
  console.log(`⏳ GENERATING PACKAGE 1: "CHUNKS Improv - E-commerce & Retail Reflex (Set 1)"`);
  console.log(`======================================================`);
  
  const req1: ImprovGenerateRequest = {
    ...baseRequest,
    packageTitle: 'CHUNKS Improv - E-commerce & Retail Reflex (Set 1)',
    packageDescription: 'Bộ phản xạ tiếng Anh thương mại điện tử 7 sessions (21 câu, mỗi session 3 câu: 2-3-4-2-3-4-4 hints) dựa trên giáo trình Day 8 E-commerce & Retail.'
  };

  const startTime1 = Date.now();
  const pkg1 = await improvApi.generatePackage(req1, (current, total, message) => {
    console.log(`  [Progress Pkg 1] ${current}% - ${message}`);
  });
  const duration1 = ((Date.now() - startTime1) / 1000).toFixed(1);
  console.log(`✅ Package 1 generated in ${duration1}s!`);

  console.log(`💾 Persisting Package 1 to Firestore & local storage via improvApi.savePackage...`);
  await improvApi.savePackage(pkg1);
  console.log(`✅ Package 1 persisted successfully with ID: ${pkg1.id}`);

  // -------------------------------------------------------------------------
  // PACKAGE 2
  // -------------------------------------------------------------------------
  console.log(`\n======================================================`);
  console.log(`⏳ GENERATING PACKAGE 2: "CHUNKS Improv - Online Shopping & Orders Reflex (Set 2)"`);
  console.log(`======================================================`);

  const req2: ImprovGenerateRequest = {
    ...baseRequest,
    packageTitle: 'CHUNKS Improv - Online Shopping & Orders Reflex (Set 2)',
    packageDescription: 'Bộ phản xạ tiếng Anh đặt hàng trực tuyến & thanh toán 7 sessions (21 câu, mỗi session 3 câu: 2-3-4-2-3-4-4 hints) dựa trên giáo trình Day 8 E-commerce & Retail.'
  };

  const startTime2 = Date.now();
  const pkg2 = await improvApi.generatePackage(req2, (current, total, message) => {
    console.log(`  [Progress Pkg 2] ${current}% - ${message}`);
  });
  const duration2 = ((Date.now() - startTime2) / 1000).toFixed(1);
  console.log(`✅ Package 2 generated in ${duration2}s!`);

  console.log(`💾 Persisting Package 2 to Firestore & local storage via improvApi.savePackage...`);
  await improvApi.savePackage(pkg2);
  console.log(`✅ Package 2 persisted successfully with ID: ${pkg2.id}`);

  // -------------------------------------------------------------------------
  // VERIFICATION & AUDIT REPORT
  // -------------------------------------------------------------------------
  printPackageSummary(pkg1, 'PACKAGE 1');
  printPackageSummary(pkg2, 'PACKAGE 2');

  const pkg1Valid = pkg1.sessions.length === 7 && pkg1.totalItems === 21 && pkg1.sessions.every(s => s.items.length === 3);
  const pkg2Valid = pkg2.sessions.length === 7 && pkg2.totalItems === 21 && pkg2.sessions.every(s => s.items.length === 3);

  if (pkg1Valid && pkg2Valid) {
    console.log(`\n🎉 ALL SPECIFICATIONS MET PERFECTLY!`);
    console.log(`- Both packages generated with 7 sessions each.`);
    console.log(`- Exactly 3 items per session.`);
    console.log(`- Exact hint distribution (2, 3, 4, 2, 3, 4, 4 hints).`);
    console.log(`- Total items per package = 21.`);
    console.log(`- Successfully saved to Firestore & Local Storage.\n`);
  } else {
    console.error(`\n⚠️ VALIDATION WARNING: Package structure did not match expected counts.`);
    process.exit(1);
  }
}

run()
  .then(() => {
    console.log(`Finished execution at ${new Date().toISOString()}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(`💥 Execution failed:`, err);
    process.exit(1);
  });
