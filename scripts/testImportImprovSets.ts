import fs from 'fs';
import path from 'path';
import { IMPROV_SET_01, IMPROV_SET_02 } from '../src/data/improvSet01And02';
import { DEFAULT_IMPROV_PACKAGES } from '../src/data/defaultImprovPackages';
import { ImprovPackage } from '../src/types/improv';

console.log('=== Step 1: Exporting JSON to public/data ===');
const publicDataDir = path.resolve(process.cwd(), 'public/data');
if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
}

const set01JsonPath = path.join(publicDataDir, 'improv_set_01.json');
const set02JsonPath = path.join(publicDataDir, 'improv_set_02.json');

fs.writeFileSync(set01JsonPath, JSON.stringify(IMPROV_SET_01, null, 2), 'utf-8');
console.log(`Exported Set 01 to ${set01JsonPath}`);

fs.writeFileSync(set02JsonPath, JSON.stringify(IMPROV_SET_02, null, 2), 'utf-8');
console.log(`Exported Set 02 to ${set02JsonPath}`);

console.log('\n=== Step 2: Validating Structure & Contracts ===');

function validatePackage(pkg: ImprovPackage, label: string) {
  console.log(`\nValidating ${label} [${pkg.id}]...`);
  
  if (!pkg.id) throw new Error(`${label}: Missing id`);
  if (!pkg.title) throw new Error(`${label}: Missing title`);
  if (!pkg.description) throw new Error(`${label}: Missing description`);
  if (pkg.totalItems !== 60) throw new Error(`${label}: totalItems must be 60, got ${pkg.totalItems}`);
  if (pkg.sessionsCount !== 4) throw new Error(`${label}: sessionsCount must be 4, got ${pkg.sessionsCount}`);
  if (pkg.sessions.length !== 4) throw new Error(`${label}: sessions length must be 4, got ${pkg.sessions.length}`);

  const itemIds = new Set<string>();
  const hintIds = new Set<string>();
  let totalCalculatedItems = 0;

  const expectedHintCountPerSession = [2, 3, 4, 5];

  pkg.sessions.forEach((session, sIdx) => {
    const expectedHc = expectedHintCountPerSession[sIdx];
    if (session.sessionNumber !== sIdx + 1) {
      throw new Error(`${label} S${sIdx + 1}: sessionNumber must be ${sIdx + 1}`);
    }
    if (session.hcTotal !== expectedHc) {
      throw new Error(`${label} S${sIdx + 1}: hcTotal must be ${expectedHc}, got ${session.hcTotal}`);
    }
    if (session.items.length !== 15) {
      throw new Error(`${label} S${sIdx + 1}: items count must be 15, got ${session.items.length}`);
    }
    if (session.hintTypes.length !== expectedHc) {
      throw new Error(`${label} S${sIdx + 1}: hintTypes length must be ${expectedHc}, got ${session.hintTypes.length}`);
    }

    session.items.forEach((item, iIdx) => {
      totalCalculatedItems++;
      if (item.itemNumber !== iIdx + 1) {
        throw new Error(`${label} S${session.sessionNumber} I${iIdx + 1}: itemNumber must be ${iIdx + 1}`);
      }
      if (item.sessionNumber !== session.sessionNumber) {
        throw new Error(`${label} Item ${item.id}: sessionNumber mismatch`);
      }
      if (item.hcTotal !== expectedHc) {
        throw new Error(`${label} Item ${item.id}: hcTotal mismatch`);
      }
      if (itemIds.has(item.id)) {
        throw new Error(`${label}: Duplicate item id ${item.id}`);
      }
      itemIds.add(item.id);

      if (item.hints.length !== expectedHc) {
        throw new Error(`${label} Item ${item.id}: hints length must be ${expectedHc}, got ${item.hints.length}`);
      }

      item.hints.forEach((hint, hIdx) => {
        if (!hint.id) throw new Error(`${label} Item ${item.id} Hint ${hIdx}: Missing id`);
        if (!hint.text) throw new Error(`${label} Item ${item.id} Hint ${hIdx}: Missing text`);
        if (!hint.translation) throw new Error(`${label} Item ${item.id} Hint ${hIdx}: Missing translation`);
        if (!hint.typeFunction) throw new Error(`${label} Item ${item.id} Hint ${hIdx}: Missing typeFunction`);
        if (hint.itemIndex !== hIdx + 1) {
          throw new Error(`${label} Item ${item.id} Hint ${hint.id}: itemIndex must be ${hIdx + 1}, got ${hint.itemIndex}`);
        }
        if (hintIds.has(hint.id)) {
          throw new Error(`${label}: Duplicate hint id ${hint.id}`);
        }
        hintIds.add(hint.id);
      });
    });
  });

  if (totalCalculatedItems !== 60) {
    throw new Error(`${label}: total items counted is ${totalCalculatedItems}, expected 60`);
  }

  console.log(`✅ ${label}: Passed all checks! (60 items, 4 sessions, unique IDs verified)`);
}

// 1. Validate Set 01 & Set 02 from improvSet01And02.ts
validatePackage(IMPROV_SET_01, 'IMPROV_SET_01 (improvSet01And02.ts)');
validatePackage(IMPROV_SET_02, 'IMPROV_SET_02 (improvSet01And02.ts)');

// 2. Validate DEFAULT_IMPROV_PACKAGES
console.log('\nValidating DEFAULT_IMPROV_PACKAGES...');
const foundSet01 = DEFAULT_IMPROV_PACKAGES.find(p => p.id === 'improv_set_01_wandering_souls');
const foundSet02 = DEFAULT_IMPROV_PACKAGES.find(p => p.id === 'improv_set_02_tell_me_about_yourself');

if (!foundSet01) throw new Error('improv_set_01_wandering_souls not found in DEFAULT_IMPROV_PACKAGES');
if (!foundSet02) throw new Error('improv_set_02_tell_me_about_yourself not found in DEFAULT_IMPROV_PACKAGES');

validatePackage(foundSet01, 'DEFAULT_IMPROV_PACKAGES[Set 01]');
validatePackage(foundSet02, 'DEFAULT_IMPROV_PACKAGES[Set 02]');

// 3. Validate JSON files on disk
console.log('\nValidating JSON files on disk...');
const loadedSet01: ImprovPackage = JSON.parse(fs.readFileSync(set01JsonPath, 'utf-8'));
const loadedSet02: ImprovPackage = JSON.parse(fs.readFileSync(set02JsonPath, 'utf-8'));

validatePackage(loadedSet01, 'public/data/improv_set_01.json');
validatePackage(loadedSet02, 'public/data/improv_set_02.json');

console.log('\n🎉 ALL VALIDATIONS PASSED PERFECTLY!');
