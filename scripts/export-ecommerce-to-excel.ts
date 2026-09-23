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

import * as fs from 'fs';
import * as path from 'path';
import { improvApi } from '../src/api/improvApi';
import { ImprovPackage } from '../src/types';

const OUTPUT_DIR = path.resolve('C:/Users/gensh/Desktop/CHUNKS/PROJECT/Chunks-LMS/outputs/test-package-review-20260921');
const TARGET_FILE_1 = path.join(OUTPUT_DIR, 'CHUNKS-Improv-Ecommerce-Set1-21Q.xlsx');
const TARGET_FILE_2 = path.join(OUTPUT_DIR, 'CHUNKS-Improv-Ecommerce-Set2-21Q.xlsx');

const CANDIDATE_IDS_SET1 = [
  'pkg_improv_f0860bf4-df3a-420c-ab63-04bfbb9b4517',
  'pkg_improv_b740b58a-c277-4bbe-bec7-d2df96cb3be1'
];

const CANDIDATE_IDS_SET2 = [
  'pkg_improv_3d437006-f195-4941-9293-9d5338535a9f',
  'pkg_improv_c162fa2d-9857-4604-b97b-b9618db76544'
];

async function main() {
  console.log(`======================================================`);
  console.log(`🚀 Starting Improv E-commerce Excel Export...`);
  console.log(`📁 Target Directory: ${OUTPUT_DIR}`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }

  console.log(`📡 Fetching all Improv packages from Firestore...`);
  const allPackages = await improvApi.getAllPackages();
  console.log(`📦 Retrieved ${allPackages.length} packages total from store.`);

  // Find Set 1
  let pkg1 = allPackages.find(p => 
    p.title.includes('E-commerce & Retail Reflex (Set 1)') ||
    CANDIDATE_IDS_SET1.includes(p.id)
  );

  // If not found in list, attempt direct fetch by ID
  if (!pkg1) {
    console.log(`⚠️ Set 1 not found in getAllPackages(), attempting direct getPackageById...`);
    for (const id of CANDIDATE_IDS_SET1) {
      const fetched = await improvApi.getPackageById(id);
      if (fetched) {
        pkg1 = fetched;
        console.log(`✅ Direct fetch succeeded for Set 1 (ID: ${id})`);
        break;
      }
    }
  }

  // Find Set 2
  let pkg2 = allPackages.find(p => 
    p.title.includes('Online Shopping & Orders Reflex (Set 2)') ||
    CANDIDATE_IDS_SET2.includes(p.id)
  );

  // If not found in list, attempt direct fetch by ID
  if (!pkg2) {
    console.log(`⚠️ Set 2 not found in getAllPackages(), attempting direct getPackageById...`);
    for (const id of CANDIDATE_IDS_SET2) {
      const fetched = await improvApi.getPackageById(id);
      if (fetched) {
        pkg2 = fetched;
        console.log(`✅ Direct fetch succeeded for Set 2 (ID: ${id})`);
        break;
      }
    }
  }

  if (!pkg1) {
    throw new Error('❌ Could not locate E-commerce & Retail Reflex (Set 1) package!');
  }
  if (!pkg2) {
    throw new Error('❌ Could not locate Online Shopping & Orders Reflex (Set 2) package!');
  }

  console.log(`\n------------------------------------------------------`);
  console.log(`📦 Package 1 Identified:`);
  console.log(`   ID: ${pkg1.id}`);
  console.log(`   Title: ${pkg1.title}`);
  console.log(`   Sessions: ${pkg1.sessions.length}`);
  console.log(`   Total Items: ${pkg1.totalItems || pkg1.sessions.reduce((acc, s) => acc + s.items.length, 0)}`);
  console.log(`   Level: ${pkg1.level}, Target Audience: ${pkg1.targetAudience}`);

  console.log(`\n📦 Package 2 Identified:`);
  console.log(`   ID: ${pkg2.id}`);
  console.log(`   Title: ${pkg2.title}`);
  console.log(`   Sessions: ${pkg2.sessions.length}`);
  console.log(`   Total Items: ${pkg2.totalItems || pkg2.sessions.reduce((acc, s) => acc + s.items.length, 0)}`);
  console.log(`   Level: ${pkg2.level}, Target Audience: ${pkg2.targetAudience}`);
  console.log(`------------------------------------------------------\n`);

  // Export Package 1
  console.log(`📊 Exporting Package 1 to Excel buffer via improvApi.exportToExcel...`);
  const buffer1 = improvApi.exportToExcel(pkg1, 'CHUNKS-Improv-Ecommerce-Set1-21Q.xlsx');
  fs.writeFileSync(TARGET_FILE_1, Buffer.from(buffer1));
  const stats1 = fs.statSync(TARGET_FILE_1);
  console.log(`💾 Saved: ${TARGET_FILE_1}`);
  console.log(`   File Size: ${stats1.size} bytes (${(stats1.size / 1024).toFixed(2)} KB)`);

  // Export Package 2
  console.log(`\n📊 Exporting Package 2 to Excel buffer via improvApi.exportToExcel...`);
  const buffer2 = improvApi.exportToExcel(pkg2, 'CHUNKS-Improv-Ecommerce-Set2-21Q.xlsx');
  fs.writeFileSync(TARGET_FILE_2, Buffer.from(buffer2));
  const stats2 = fs.statSync(TARGET_FILE_2);
  console.log(`💾 Saved: ${TARGET_FILE_2}`);
  console.log(`   File Size: ${stats2.size} bytes (${(stats2.size / 1024).toFixed(2)} KB)`);

  // Verification checks
  console.log(`\n======================================================`);
  console.log(`🔍 VERIFICATION AUDIT`);
  console.log(`======================================================`);
  const valid1 = fs.existsSync(TARGET_FILE_1) && stats1.size > 10240;
  const valid2 = fs.existsSync(TARGET_FILE_2) && stats2.size > 10240;

  console.log(`File 1 exists & >10KB: ${valid1 ? '✅ PASS' : '❌ FAIL'} (${stats1.size} bytes)`);
  console.log(`File 2 exists & >10KB: ${valid2 ? '✅ PASS' : '❌ FAIL'} (${stats2.size} bytes)`);

  if (!valid1 || !valid2) {
    throw new Error('❌ Verification failed: Output files are missing or below 10KB threshold!');
  }

  console.log(`\n🎉 Excel Export completed successfully with 100% verification!`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(`💥 Execution failed:`, err);
    process.exit(1);
  });
