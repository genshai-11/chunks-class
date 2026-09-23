import { describe, it, expect } from "bun:test";
import { improvApi, default as improvApiDefault } from "../src/api/improvApi";
import type {
  ImprovGenerateRequest,
  ImprovPackage,
  ImprovSession,
  ImprovItem,
  ImprovHint
} from "../src/types";

describe("improvApi Test Suite", () => {
  // ==========================================================================
  // 1. API Object Contracts
  // ==========================================================================
  describe("1. improvApi Object Contracts", () => {
    it("exports improvApi as named export and default export", () => {
      expect(improvApi).toBeDefined();
      expect(improvApiDefault).toBeDefined();
      expect(improvApi).toBe(improvApiDefault);
    });

    it("defines all required API methods on improvApi", () => {
      const requiredMethods: (keyof typeof improvApi)[] = [
        "generatePackage",
        "generateSingleSession",
        "testLlmConnection",
        "getAllPackages",
        "getPackageById",
        "savePackage",
        "deletePackage",
        "exportToExcel",
        "parseFromExcel",
        "sanitizePackageLanguage",
        "generateOfflineFallbackPackage"
      ];

      for (const method of requiredMethods) {
        expect(typeof improvApi[method]).toBe("function");
      }
    });
  });

  // ==========================================================================
  // 2. generateOfflineFallbackPackage
  // ==========================================================================
  describe("2. generateOfflineFallbackPackage", () => {
    it("strictly respects individual per-session itemsCount and sums to pkg.totalItems", () => {
      const request: ImprovGenerateRequest = {
        packageTitle: "Custom Reflex Multi-Session Drill",
        packageDescription: "Testing exact per-session itemsCount allocation",
        totalItems: 999, // Should be overridden by the sum of sessionsConfig itemsCount (15)
        sourceLevel: "LEVEL_B_ERES",
        sourceLessonIds: [],
        difficulty: "MEDIUM",
        relevance: "MEDIUM",
        topic: "Workplace Emergency Scenarios",
        targetGrammar: "Conditional Sentences (Type 2 & 3)",
        conversationalTone: "Professional & Dynamic",
        pedagogicalNotes: "Emphasize fast transition reflex with logical connectors",
        sessionsConfig: [
          {
            sessionNumber: 1,
            title: "Session 1: Pair Reflexes",
            itemsCount: 4,
            hcTotal: 2,
            hintTypes: ["Keyword", "Ending"]
          },
          {
            sessionNumber: 2,
            title: "Session 2: Triplet Logic Reflexes",
            itemsCount: 6,
            hcTotal: 3,
            hintTypes: ["Keyword", "Logic word", "Ending"]
          },
          {
            sessionNumber: 3,
            title: "Session 3: Four-Way Deep Synthesis",
            itemsCount: 5,
            hcTotal: 4,
            hintTypes: ["Keyword", "Logic word", "Fancy word", "Ending"]
          }
        ],
        llmConfig: {
          endpoint: "https://api.test.example/v1",
          apiKey: "test-key",
          model: "gemini-2.5-flash",
          masterPrompt: "Test master prompt",
          temperature: 0.7,
          maxTokens: 2048
        }
      };

      const pkg = improvApi.generateOfflineFallbackPackage(request);

      // Verify overall package structure
      expect(pkg).toBeDefined();
      expect(pkg.title).toBe("Custom Reflex Multi-Session Drill");
      expect(pkg.sessions.length).toBe(3);
      expect(pkg.sessionsCount).toBe(3);

      // Verify strictly respected individual itemsCount per session
      expect(pkg.sessions[0].items.length).toBe(4);
      expect(pkg.sessions[1].items.length).toBe(6);
      expect(pkg.sessions[2].items.length).toBe(5);

      // Verify totalItems is exactly the summation (4 + 6 + 5 = 15)
      expect(pkg.totalItems).toBe(15);

      // Verify Session 1 items contracts
      const s1 = pkg.sessions[0];
      expect(s1.sessionNumber).toBe(1);
      expect(s1.hcTotal).toBe(2);
      expect(s1.hintTypes).toEqual(["Keyword", "Ending"]);
      s1.items.forEach((item, idx) => {
        expect(item.sessionNumber).toBe(1);
        expect(item.itemNumber).toBe(idx + 1);
        expect(item.hcTotal).toBe(2);
        expect(item.hints.length).toBe(2);

        expect(item.hints[0].itemIndex).toBe(1);
        expect(item.hints[0].typeFunction).toBe("Keyword");
        expect(item.hints[0].text.length).toBeGreaterThan(0);
        expect(item.hints[0].translation.length).toBeGreaterThan(0);

        expect(item.hints[1].itemIndex).toBe(2);
        expect(item.hints[1].typeFunction).toBe("Ending");
        expect(item.hints[1].text.length).toBeGreaterThan(0);
        expect(item.hints[1].translation.length).toBeGreaterThan(0);
      });

      // Verify Session 2 items contracts
      const s2 = pkg.sessions[1];
      expect(s2.sessionNumber).toBe(2);
      expect(s2.hcTotal).toBe(3);
      expect(s2.hintTypes).toEqual(["Keyword", "Logic word", "Ending"]);
      s2.items.forEach((item, idx) => {
        expect(item.sessionNumber).toBe(2);
        expect(item.itemNumber).toBe(idx + 1);
        expect(item.hcTotal).toBe(3);
        expect(item.hints.length).toBe(3);

        expect(item.hints[0].itemIndex).toBe(1);
        expect(item.hints[0].typeFunction).toBe("Keyword");

        expect(item.hints[1].itemIndex).toBe(2);
        expect(item.hints[1].typeFunction).toBe("Logic word");

        expect(item.hints[2].itemIndex).toBe(3);
        expect(item.hints[2].typeFunction).toBe("Ending");
      });

      // Verify Session 3 items contracts
      const s3 = pkg.sessions[2];
      expect(s3.sessionNumber).toBe(3);
      expect(s3.hcTotal).toBe(4);
      expect(s3.hintTypes).toEqual(["Keyword", "Logic word", "Fancy word", "Ending"]);
      s3.items.forEach((item, idx) => {
        expect(item.sessionNumber).toBe(3);
        expect(item.itemNumber).toBe(idx + 1);
        expect(item.hcTotal).toBe(4);
        expect(item.hints.length).toBe(4);

        expect(item.hints[0].itemIndex).toBe(1);
        expect(item.hints[0].typeFunction).toBe("Keyword");

        expect(item.hints[1].itemIndex).toBe(2);
        expect(item.hints[1].typeFunction).toBe("Logic word");

        expect(item.hints[2].itemIndex).toBe(3);
        expect(item.hints[2].typeFunction).toBe("Fancy word");

        expect(item.hints[3].itemIndex).toBe(4);
        expect(item.hints[3].typeFunction).toBe("Ending");
      });
    });

    it("falls back gracefully when sessionsConfig is empty or omitted", () => {
      const request: ImprovGenerateRequest = {
        packageTitle: "Default 4-Session Fallback",
        totalItems: 20,
        sourceLevel: "LEVEL_A",
        sourceLessonIds: [],
        difficulty: "EASY",
        relevance: "LOW",
        sessionsConfig: [],
        llmConfig: {
          endpoint: "",
          apiKey: "",
          model: "",
          masterPrompt: "",
          temperature: 0.7,
          maxTokens: 2048
        }
      };

      const pkg = improvApi.generateOfflineFallbackPackage(request);
      expect(pkg.sessions.length).toBe(4);
      expect(pkg.totalItems).toBe(20);
      expect(pkg.sessions[0].hcTotal).toBe(2);
      expect(pkg.sessions[1].hcTotal).toBe(3);
      expect(pkg.sessions[2].hcTotal).toBe(4);
      expect(pkg.sessions[3].hcTotal).toBe(4);
    });
  });

  // ==========================================================================
  // 3. sanitizePackageLanguage
  // ==========================================================================
  describe("3. sanitizePackageLanguage", () => {
    it("corrects swapped English text and Vietnamese translations", () => {
      const swappedPackage: ImprovPackage = {
        id: "pkg_test_swapped",
        title: "Swapped Language Test Package",
        description: "Testing language sanitation",
        totalItems: 1,
        sessionsCount: 1,
        createdAt: "2026-09-23T00:00:00.000Z",
        updatedAt: "2026-09-23T00:00:00.000Z",
        sessions: [
          {
            sessionNumber: 1,
            title: "Session 1",
            hcTotal: 2,
            hintTypes: ["Keyword", "Ending"],
            items: [
              {
                id: "item_s1_i1",
                sessionNumber: 1,
                itemNumber: 1,
                hcTotal: 2,
                hints: [
                  {
                    id: "h_1_1_1",
                    itemIndex: 1,
                    typeFunction: "Keyword",
                    // Swapped: Vietnamese in text, English in translation
                    text: "Lỡ chuyến xe buýt",
                    translation: "Miss the bus"
                  },
                  {
                    id: "h_1_1_2",
                    itemIndex: 2,
                    typeFunction: "Ending",
                    // Swapped: Vietnamese in text, English in translation
                    text: "Đi trễ",
                    translation: "Be late"
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = improvApi.sanitizePackageLanguage(swappedPackage);

      expect(result.fixedCount).toBe(2);
      expect(result.issues.length).toBe(2);

      const fixedHints = result.package.sessions[0].items[0].hints;
      expect(fixedHints[0].text).toBe("Miss the bus");
      expect(fixedHints[0].translation).toBe("Lỡ chuyến xe buýt");

      expect(fixedHints[1].text).toBe("Be late");
      expect(fixedHints[1].translation).toBe("Đi trễ");
    });

    it("converts Vietnamese logic connectors in text to English connectors and translates appropriately", () => {
      const viLogicPackage: ImprovPackage = {
        id: "pkg_test_vi_logic",
        title: "Vietnamese Logic Connectors Test",
        description: "Testing logic connector mapping",
        totalItems: 1,
        sessionsCount: 1,
        createdAt: "2026-09-23T00:00:00.000Z",
        updatedAt: "2026-09-23T00:00:00.000Z",
        sessions: [
          {
            sessionNumber: 1,
            title: "Session 1",
            hcTotal: 3,
            hintTypes: ["Keyword", "Logic word", "Ending"],
            items: [
              {
                id: "item_s1_i1",
                sessionNumber: 1,
                itemNumber: 1,
                hcTotal: 3,
                hints: [
                  {
                    id: "h_1_1_1",
                    itemIndex: 1,
                    typeFunction: "Keyword",
                    text: "take a break",
                    translation: "nghỉ ngơi một lát"
                  },
                  {
                    id: "h_1_1_2",
                    itemIndex: 2,
                    typeFunction: "Logic word",
                    // Vietnamese connector in text with Vietnamese translation
                    text: "do đó",
                    translation: "do đó"
                  },
                  {
                    id: "h_1_1_3",
                    itemIndex: 3,
                    typeFunction: "Ending",
                    text: "feel relaxed",
                    translation: "thư giãn"
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = improvApi.sanitizePackageLanguage(viLogicPackage);

      expect(result.fixedCount).toBe(1);
      const fixedLogicHint = result.package.sessions[0].items[0].hints[1];
      expect(fixedLogicHint.text).toBe("therefore");
      expect(fixedLogicHint.translation).toBe("do đó");
      expect(result.issues[0].originalText).toBe("do đó");
      expect(result.issues[0].fixedText).toBe("therefore");
    });

    it("translates English logic words mistakenly placed in translation column to Vietnamese", () => {
      const enInTransPackage: ImprovPackage = {
        id: "pkg_test_en_in_trans",
        title: "English in Translation Test",
        description: "Testing logic translation mapping",
        totalItems: 1,
        sessionsCount: 1,
        createdAt: "2026-09-23T00:00:00.000Z",
        updatedAt: "2026-09-23T00:00:00.000Z",
        sessions: [
          {
            sessionNumber: 1,
            title: "Session 1",
            hcTotal: 3,
            hintTypes: ["Keyword", "Logic word", "Ending"],
            items: [
              {
                id: "item_s1_i1",
                sessionNumber: 1,
                itemNumber: 1,
                hcTotal: 3,
                hints: [
                  {
                    id: "h_1_1_1",
                    itemIndex: 1,
                    typeFunction: "Keyword",
                    text: "sunny day",
                    translation: "ngày nắng đẹp"
                  },
                  {
                    id: "h_1_1_2",
                    itemIndex: 2,
                    typeFunction: "Logic word",
                    text: "however",
                    translation: "however" // English logic word in translation without Vietnamese
                  },
                  {
                    id: "h_1_1_3",
                    itemIndex: 3,
                    typeFunction: "Ending",
                    text: "heavy rain",
                    translation: "mưa lớn"
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = improvApi.sanitizePackageLanguage(enInTransPackage);
      expect(result.fixedCount).toBe(1);
      const fixedHint = result.package.sessions[0].items[0].hints[1];
      expect(fixedHint.text).toBe("however");
      expect(fixedHint.translation).toBe("tuy nhiên");
    });

    it("leaves already-clean packages untouched with fixedCount = 0", () => {
      const cleanPackage: ImprovPackage = {
        id: "pkg_clean",
        title: "Clean Package",
        description: "Already correct",
        totalItems: 1,
        sessionsCount: 1,
        createdAt: "2026-09-23T00:00:00.000Z",
        updatedAt: "2026-09-23T00:00:00.000Z",
        sessions: [
          {
            sessionNumber: 1,
            title: "Session 1",
            hcTotal: 2,
            hintTypes: ["Keyword", "Ending"],
            items: [
              {
                id: "item_clean",
                sessionNumber: 1,
                itemNumber: 1,
                hcTotal: 2,
                hints: [
                  {
                    id: "h_1",
                    itemIndex: 1,
                    typeFunction: "Keyword",
                    text: "wake up early",
                    translation: "thức dậy sớm"
                  },
                  {
                    id: "h_2",
                    itemIndex: 2,
                    typeFunction: "Ending",
                    text: "feel energized",
                    translation: "cảm thấy tràn đầy năng lượng"
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = improvApi.sanitizePackageLanguage(cleanPackage);
      expect(result.fixedCount).toBe(0);
      expect(result.issues.length).toBe(0);
      expect(result.package.sessions[0].items[0].hints[0].text).toBe("wake up early");
    });
  });

  // ==========================================================================
  // 4. Excel Round-Trip (exportToExcel and parseFromExcel)
  // ==========================================================================
  describe("4. Excel Round-Trip (exportToExcel and parseFromExcel)", () => {
    it("exports package to binary Uint8Array and accurately parses back matching session & item counts", async () => {
      // 1. Generate a multi-session fallback package with custom distribution (4, 6, 5 items)
      const request: ImprovGenerateRequest = {
        packageTitle: "Excel Round-Trip Verification Package",
        packageDescription: "Verifying binary serialization and parsing integrity",
        totalItems: 15,
        sourceLevel: "LEVEL_B_ERES",
        sourceLessonIds: [],
        difficulty: "MEDIUM",
        relevance: "HIGH",
        sessionsConfig: [
          {
            sessionNumber: 1,
            title: "Session 1: Two Hints",
            itemsCount: 4,
            hcTotal: 2,
            hintTypes: ["Keyword", "Ending"]
          },
          {
            sessionNumber: 2,
            title: "Session 2: Three Hints",
            itemsCount: 6,
            hcTotal: 3,
            hintTypes: ["Keyword", "Logic word", "Ending"]
          },
          {
            sessionNumber: 3,
            title: "Session 3: Four Hints",
            itemsCount: 5,
            hcTotal: 4,
            hintTypes: ["Keyword", "Logic word", "Fancy word", "Ending"]
          }
        ],
        llmConfig: {
          endpoint: "",
          apiKey: "",
          model: "",
          masterPrompt: "",
          temperature: 0.7,
          maxTokens: 2048
        }
      };

      const originalPkg = improvApi.generateOfflineFallbackPackage(request);

      // Verify original package totals
      expect(originalPkg.sessions.length).toBe(3);
      expect(originalPkg.totalItems).toBe(15);
      expect(originalPkg.sessions[0].items.length).toBe(4);
      expect(originalPkg.sessions[1].items.length).toBe(6);
      expect(originalPkg.sessions[2].items.length).toBe(5);

      // 2. Export package to Excel binary buffer (Uint8Array)
      const excelBuffer = improvApi.exportToExcel(originalPkg, "test_roundtrip.xlsx");
      expect(excelBuffer).toBeDefined();
      expect(excelBuffer instanceof Uint8Array).toBe(true);
      expect(excelBuffer.byteLength).toBeGreaterThan(0);

      // 3. Parse back the Excel buffer using parseFromExcel
      const parsedPkg = await improvApi.parseFromExcel(
        excelBuffer,
        "Excel Round-Trip Verification Package"
      );

      // 4. Assert round-trip session counts and item counts
      expect(parsedPkg).toBeDefined();
      expect(parsedPkg.title).toBe("Excel Round-Trip Verification Package");
      expect(parsedPkg.sessionsCount).toBe(3);
      expect(parsedPkg.sessions.length).toBe(3);
      expect(parsedPkg.totalItems).toBe(15);

      // Session 1: 4 items, hcTotal = 2
      expect(parsedPkg.sessions[0].sessionNumber).toBe(1);
      expect(parsedPkg.sessions[0].items.length).toBe(4);
      expect(parsedPkg.sessions[0].hcTotal).toBe(2);

      // Session 2: 6 items, hcTotal = 3
      expect(parsedPkg.sessions[1].sessionNumber).toBe(2);
      expect(parsedPkg.sessions[1].items.length).toBe(6);
      expect(parsedPkg.sessions[1].hcTotal).toBe(3);

      // Session 3: 5 items, hcTotal = 4
      expect(parsedPkg.sessions[2].sessionNumber).toBe(3);
      expect(parsedPkg.sessions[2].items.length).toBe(5);
      expect(parsedPkg.sessions[2].hcTotal).toBe(4);

      // 5. Verify hint integrity for sample items in each session
      // Session 1, Item 1
      const pS1I1 = parsedPkg.sessions[0].items[0];
      const oS1I1 = originalPkg.sessions[0].items[0];
      expect(pS1I1.hints.length).toBe(2);
      expect(pS1I1.hints[0].text).toBe(oS1I1.hints[0].text);
      expect(pS1I1.hints[0].translation).toBe(oS1I1.hints[0].translation);
      expect(pS1I1.hints[1].text).toBe(oS1I1.hints[1].text);
      expect(pS1I1.hints[1].translation).toBe(oS1I1.hints[1].translation);

      // Session 2, Item 2
      const pS2I2 = parsedPkg.sessions[1].items[1];
      const oS2I2 = originalPkg.sessions[1].items[1];
      expect(pS2I2.hints.length).toBe(3);
      expect(pS2I2.hints[1].text).toBe(oS2I2.hints[1].text);
      expect(pS2I2.hints[1].translation).toBe(oS2I2.hints[1].translation);

      // Session 3, Item 3
      const pS3I3 = parsedPkg.sessions[2].items[2];
      const oS3I3 = originalPkg.sessions[2].items[2];
      expect(pS3I3.hints.length).toBe(4);
      expect(pS3I3.hints[2].text).toBe(oS3I3.hints[2].text);
      expect(pS3I3.hints[2].translation).toBe(oS3I3.hints[2].translation);
    });

    it("parses correctly when passed an ArrayBuffer directly", async () => {
      const request: ImprovGenerateRequest = {
        packageTitle: "ArrayBuffer Parse Test",
        totalItems: 4,
        sourceLevel: "LEVEL_A",
        sourceLessonIds: [],
        difficulty: "EASY",
        relevance: "LOW",
        sessionsConfig: [
          {
            sessionNumber: 1,
            itemsCount: 4,
            hcTotal: 2,
            hintTypes: ["Keyword", "Ending"]
          }
        ],
        llmConfig: {
          endpoint: "",
          apiKey: "",
          model: "",
          masterPrompt: "",
          temperature: 0.7,
          maxTokens: 2048
        }
      };

      const pkg = improvApi.generateOfflineFallbackPackage(request);
      const uint8 = improvApi.exportToExcel(pkg);
      // Pass underlying ArrayBuffer slice
      const arrayBuffer = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);

      const parsed = await improvApi.parseFromExcel(arrayBuffer, "ArrayBuffer Parse Test");
      expect(parsed.sessions.length).toBe(1);
      expect(parsed.totalItems).toBe(4);
      expect(parsed.sessions[0].items.length).toBe(4);
    });
  });
});
