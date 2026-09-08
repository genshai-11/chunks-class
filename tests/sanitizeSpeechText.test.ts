import { describe, it, expect } from "bun:test";
import { sanitizeSpeechText } from "../src/services/deepgramTtsService";

describe("sanitizeSpeechText with Trailing Pause Comma Enhancement", () => {
  describe("Trailing Pause Comma", () => {
    it("appends trailing comma to a short word ('improve')", () => {
      expect(sanitizeSpeechText("improve")).toBe("improve, ");
    });

    it("appends trailing comma to multi-word text ('wake up')", () => {
      expect(sanitizeSpeechText("wake up")).toBe("wake up, ");
    });

    it("appends trailing comma to a phrase ('Here\\'s the deal')", () => {
      expect(sanitizeSpeechText("Here's the deal")).toBe("Here's the deal, ");
    });

    it("converts trailing period to soft comma pause ('I didn\\'t do anything.')", () => {
      expect(sanitizeSpeechText("I didn't do anything.")).toBe("I didn't do anything, ");
    });

    it("preserves question mark and appends comma pause ('Sounds familiar?')", () => {
      expect(sanitizeSpeechText("Sounds familiar?")).toBe("Sounds familiar?, ");
    });

    it("preserves exclamation mark and appends comma pause ('Why not!')", () => {
      expect(sanitizeSpeechText("Why not!")).toBe("Why not!, ");
    });

    it("preserves combined punctuation marks ('Really?!')", () => {
      expect(sanitizeSpeechText("Really?!")).toBe("Really?!, ");
    });

    it("normalizes text already ending in a comma ('Hello,')", () => {
      expect(sanitizeSpeechText("Hello,")).toBe("Hello, ");
    });

    it("normalizes text ending with ellipsis and comma ('Let\\'s see,...')", () => {
      expect(sanitizeSpeechText("Let's see,...")).toBe("Let's see, ");
    });

    it("normalizes multiple trailing commas ('word,,')", () => {
      expect(sanitizeSpeechText("word,,")).toBe("word, ");
    });
  });

  describe("Beat Pauses and Prosody", () => {
    it("converts beat markers '//' to comma pause and appends trailing pause", () => {
      expect(sanitizeSpeechText("Wake up // early")).toBe("Wake up, early, ");
    });

    it("handles pipe '|' as comma pause and appends trailing pause", () => {
      expect(sanitizeSpeechText("Hello | world")).toBe("Hello, world, ");
    });

    it("preserves sentence-ending pause after beat markers and appends trailing comma", () => {
      expect(sanitizeSpeechText("Hello. // World")).toBe("Hello. World, ");
      expect(sanitizeSpeechText("Are you sure? // Yes.")).toBe("Are you sure? Yes, ");
      expect(sanitizeSpeechText("Wait here! // Listen?")).toBe("Wait here! Listen?, ");
    });
  });

  describe("Synonym Slashes", () => {
    it("takes only the first option when single slashes exist and appends trailing pause", () => {
      expect(sanitizeSpeechText("Partner / Mate / spouse")).toBe("Partner, ");
      expect(sanitizeSpeechText("A / B / C")).toBe("A, ");
    });
  });

  describe("Pedagogical Clutter and Speaker Prefix Stripping", () => {
    it("strips 'A. Teamwork B. Emotion assessment EMOTION ' prompt", () => {
      expect(
        sanitizeSpeechText("A. Teamwork B. Emotion assessment EMOTION Let's see how Ducky reacts")
      ).toBe("Let's see how Ducky reacts, ");
    });

    it("strips 'REFLEXES A. Context mp3 B. Back & Forth ' prompt", () => {
      expect(
        sanitizeSpeechText("REFLEXES A. Context mp3 B. Back & Forth Linda is ready")
      ).toBe("Linda is ready, ");
    });

    it("strips 'Speaker A:' and 'Speaker B:' prefixes", () => {
      expect(sanitizeSpeechText("Speaker A: Good morning everyone")).toBe("Good morning everyone, ");
      expect(sanitizeSpeechText("Speaker B: How's it going?")).toBe("How's it going?, ");
    });

    it("strips 'A - ' and 'B - ' dialogue prefixes", () => {
      expect(sanitizeSpeechText("A - Nice to meet you")).toBe("Nice to meet you, ");
      expect(sanitizeSpeechText("B: Glad to hear that")).toBe("Glad to hear that, ");
      expect(sanitizeSpeechText("A – Absolutely")).toBe("Absolutely, ");
    });

    it("does not affect synonym slashes like 'A / B / C'", () => {
      expect(sanitizeSpeechText("A / B / C")).toBe("A, ");
    });
  });

  describe("Normalization and Edge Cases", () => {
    it("handles empty or falsy text returning empty string", () => {
      expect(sanitizeSpeechText("")).toBe("");
      // @ts-expect-error testing null input
      expect(sanitizeSpeechText(null)).toBe("");
      // @ts-expect-error testing undefined input
      expect(sanitizeSpeechText(undefined)).toBe("");
      expect(sanitizeSpeechText("   ")).toBe("");
      expect(sanitizeSpeechText("...")).toBe("");
      expect(sanitizeSpeechText(",,,   ")).toBe("");
    });

    it("normalizes semicolons to comma pauses with trailing comma", () => {
      expect(sanitizeSpeechText("One; two")).toBe("One, two, ");
    });

    it("normalizes multiple spaces and commas properly", () => {
      expect(sanitizeSpeechText("one, , two,")).toBe("one, two, ");
      expect(sanitizeSpeechText("  hello    world   ")).toBe("hello world, ");
    });
  });
});

