import { describe, test, expect } from 'bun:test';
import {
  generateOfflineFallbackPackage,
  extractAndParseJson,
  getDynamicTemperature,
  getDifficultyDirective,
  getRelevanceDirective
} from '../src/services/improvServerEngine';
import {
  exportToExcel,
  parseFromExcel,
  evaluateAndSanitizeHint,
  evaluateAndSanitizePackage
} from '../src/services/excelServer';
import { ImprovGenerateRequest, ImprovPackage, ImprovHint } from '../src/types';

describe('CHUNKS Serverless Improv Engine Tests', () => {

  // ------------------------------------------------------------------------
  // 1. Algorithmic Fallback Package Generator
  // ------------------------------------------------------------------------
  describe('Offline Fallback Package Generator', () => {
    test('generates valid ImprovPackage with correct sessions, items and hint counts', () => {
      const request: ImprovGenerateRequest = {
        packageTitle: 'Serverless Offline Test Package',
        totalItems: 8,
        difficulty: 'Easy (A1-A2)',
        relevance: 'High',
        sourceLevel: 'LEVEL_A',
        sourceLessonIds: [],
        sessionsConfig: [
          {
            sessionNumber: 1,
            title: 'Session 1: Two-Word Reflex Pairs',
            hcTotal: 2,
            hintTypes: ['Keyword', 'Ending'],
            itemsCount: 4
          },
          {
            sessionNumber: 2,
            title: 'Session 2: Three-Hint Reflex Triples',
            hcTotal: 3,
            hintTypes: ['Keyword', 'Từ nối · Logic word', 'Ending'],
            itemsCount: 4
          }
        ]
      };

      const pkg = generateOfflineFallbackPackage(request);

      expect(pkg).toBeDefined();
      expect(pkg.title).toBe('Serverless Offline Test Package');
      expect(pkg.sessionsCount).toBe(2);
      expect(pkg.sessions.length).toBe(2);
      expect(pkg.totalItems).toBe(8);

      // Session 1 checks
      const s1 = pkg.sessions[0];
      expect(s1.sessionNumber).toBe(1);
      expect(s1.items.length).toBe(4);
      expect(s1.hcTotal).toBe(2);
      s1.items.forEach((item, idx) => {
        expect(item.itemNumber).toBe(idx + 1);
        expect(item.hints.length).toBe(2);
        expect(item.hints[0].text.length).toBeGreaterThan(0);
        expect(item.hints[0].translation.length).toBeGreaterThan(0);
        expect(item.hints[1].text.length).toBeGreaterThan(0);
        expect(item.hints[1].translation.length).toBeGreaterThan(0);
      });

      // Session 2 checks
      const s2 = pkg.sessions[1];
      expect(s2.sessionNumber).toBe(2);
      expect(s2.items.length).toBe(4);
      expect(s2.hcTotal).toBe(3);
      s2.items.forEach((item, idx) => {
        expect(item.itemNumber).toBe(idx + 1);
        expect(item.hints.length).toBe(3);
        // Hint 2 is logic word
        expect(item.hints[1].typeFunction).toContain('Logic');
      });
    });

    test('respects CEFR difficulty directives and temperature', () => {
      expect(getDynamicTemperature('low')).toBe(0.95);
      expect(getDynamicTemperature('medium')).toBe(0.70);
      expect(getDynamicTemperature('high')).toBe(0.45);

      const easyDirective = getDifficultyDirective('Easy');
      expect(easyDirective).toContain('EASY');
      expect(easyDirective).toContain('high-frequency');

      const hardDirective = getDifficultyDirective('Hard');
      expect(hardDirective).toContain('HARD');
      expect(hardDirective.toLowerCase()).toContain('idioms');

      const lowRelDirective = getRelevanceDirective('low');
      expect(lowRelDirective).toContain('LOW');
    });
  });

  // ------------------------------------------------------------------------
  // 2. JSON Extraction and Repair
  // ------------------------------------------------------------------------
  describe('LLM JSON Extraction and Repair', () => {
    test('extracts JSON wrapped in markdown fences and think tags', () => {
      const raw = `
<think>
We need to generate session 1 with 2 items.
Thinking budget is zero.
</think>
\`\`\`json
{
  "title": "Clean Title",
  "count": 42
}
\`\`\`
`;
      const parsed = extractAndParseJson<{ title: string; count: number }>(raw);
      expect(parsed.title).toBe('Clean Title');
      expect(parsed.count).toBe(42);
    });

    test('repairs trailing commas in objects and arrays', () => {
      const raw = `{
        "items": [
          {"id": 1, "text": "hello",},
          {"id": 2, "text": "world",},
        ],
      }`;
      const parsed = extractAndParseJson<{ items: { id: number; text: string }[] }>(raw);
      expect(parsed.items.length).toBe(2);
      expect(parsed.items[0].text).toBe('hello');
      expect(parsed.items[1].text).toBe('world');
    });
  });

  // ------------------------------------------------------------------------
  // 3. Language Evaluation & Auto-Sanitization
  // ------------------------------------------------------------------------
  describe('Language Evaluation & Auto-Sanitization', () => {
    test('fixes swapped Vietnamese and English fields', () => {
      const corruptHint: ImprovHint = {
        id: 'h1',
        text: 'Thức dậy',
        translation: 'Wake up',
        typeFunction: 'Keyword',
        itemIndex: 1
      };

      const { hint: fixed, wasFixed } = evaluateAndSanitizeHint(corruptHint);
      expect(wasFixed).toBe(true);
      expect(fixed.text).toBe('Wake up');
      expect(fixed.translation).toBe('Thức dậy');
    });

    test('converts Vietnamese logic connectors in text to English', () => {
      const corruptHint: ImprovHint = {
        id: 'h2',
        text: 'do đó',
        translation: 'do đó',
        typeFunction: 'Logic word',
        itemIndex: 2
      };

      const { hint: fixed, wasFixed } = evaluateAndSanitizeHint(corruptHint);
      expect(wasFixed).toBe(true);
      expect(fixed.text).toBe('therefore');
      expect(fixed.translation).toBe('do đó');
    });

    test('sanitizes full package and reports fixedCount', () => {
      const pkgWithIssues: ImprovPackage = {
        id: 'pkg_test',
        title: 'Corrupt Test',
        description: 'Testing sanitization',
        totalItems: 1,
        sessionsCount: 1,
        sessions: [
          {
            sessionNumber: 1,
            title: 'Session 1',
            hcTotal: 2,
            hintTypes: ['Keyword', 'Ending'],
            items: [
              {
                id: 'it1',
                itemNumber: 1,
                sessionNumber: 1,
                hcTotal: 2,
                hints: [
                  {
                    id: 'h1',
                    text: 'Lỡ xe buýt',
                    translation: 'Miss the bus',
                    typeFunction: 'Keyword',
                    itemIndex: 1
                  },
                  {
                    id: 'h2',
                    text: 'be late',
                    translation: 'đi trễ',
                    typeFunction: 'Ending',
                    itemIndex: 2
                  }
                ]
              }
            ]
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { package: cleanPkg, fixedCount, issues } = evaluateAndSanitizePackage(pkgWithIssues);
      expect(fixedCount).toBe(1);
      expect(issues.length).toBe(1);
      expect(cleanPkg.sessions[0].items[0].hints[0].text).toBe('Miss the bus');
      expect(cleanPkg.sessions[0].items[0].hints[0].translation).toBe('Lỡ xe buýt');
    });
  });

  // ------------------------------------------------------------------------
  // 4. Excel Export & Ingestion Roundtrip
  // ------------------------------------------------------------------------
  describe('Excel Export and Ingestion Roundtrip', () => {
    test('exports package to Excel buffer and parses it back accurately', () => {
      const originalPkg = generateOfflineFallbackPackage({
        packageTitle: 'Excel Roundtrip Test',
        totalItems: 4,
        difficulty: 'Medium',
        relevance: 'High',
        sourceLevel: 'LEVEL_B_ERES',
        sourceLessonIds: [],
        sessionsConfig: [
          {
            sessionNumber: 1,
            title: 'Session 1: Fast Reflexes',
            hcTotal: 3,
            hintTypes: ['Keyword', 'Từ nối', 'Ending'],
            itemsCount: 4
          }
        ]
      });

      // 1. Export to Excel Buffer
      const excelBuffer = exportToExcel(originalPkg);
      expect(Buffer.isBuffer(excelBuffer)).toBe(true);
      expect(excelBuffer.length).toBeGreaterThan(100);

      // 2. Parse from Excel Buffer
      const parsedPkg = parseFromExcel(excelBuffer, 'Excel Roundtrip Test');
      expect(parsedPkg).toBeDefined();
      expect(parsedPkg.title).toBe('Excel Roundtrip Test');
      expect(parsedPkg.sessionsCount).toBe(1);
      expect(parsedPkg.sessions[0].items.length).toBe(4);
      expect(parsedPkg.sessions[0].items[0].hints.length).toBe(3);

      // Check text integrity
      const origItem1 = originalPkg.sessions[0].items[0];
      const parsedItem1 = parsedPkg.sessions[0].items[0];
      expect(parsedItem1.hints[0].text).toBe(origItem1.hints[0].text);
      expect(parsedItem1.hints[0].translation).toBe(origItem1.hints[0].translation);
    });
  });
});
