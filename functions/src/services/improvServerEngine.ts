import {
  ImprovPackage,
  ImprovSession,
  ImprovItem,
  ImprovHint,
  ImprovSessionConfig,
  ImprovGenerateRequest,
  ImprovLLMConfig,
  ChunkItem
} from '../types';
import { evaluateAndSanitizeHint, evaluateAndSanitizePackage } from './excelServer';
import { getLessonById, getLessonsByLevel } from './firestoreAdmin';

// --------------------------------------------------------------------------
// 1. Default Master Prompt & Directives
// --------------------------------------------------------------------------

export const DEFAULT_IMPROV_MASTER_PROMPT = `You are the Lead English Pedagogy & Speech Chunking Architect for the CHUNKS Improv Reflex Platform.

CHUNKS Improv is an interactive, hint-based English reflex training system. Learners deduce, shadow, and master spoken English chunks through rapid-fire clue words/phrases (1-2 words each) before producing the full communicative sentence.

### AUTHORITATIVE ARCHITECTURAL SPECIFICATIONS OF THE 3 PEDAGOGICAL DIMENSIONS:

1. **Dimension 1: Pedagogy Difficulty (Độ khó)**:
   - **Easy (A1-A2) - Elementary & Pre-intermediate Spoken Foundations**:
     * Target: CEFR A1-A2. 100% high-frequency, everyday words ('wake up', 'grab a coffee', 'heavy rain', 'feel tired', 'miss the bus', 'wait a minute', 'call a friend', 'delicious food', 'stay home', 'be late', 'good idea', 'pack a bag', 'buy a ticket').
     * STRICT FORBIDDEN IN EASY: Absolutely NO B2-C1 literary or academic words (specifically ban words like: 'meticulous', 'nostalgic', 'fierce', 'catastrophic', 'sophisticated', 'unprecedented', 'scrutiny', 'paradox', 'dilemma', 'reluctance', 'contemplate', 'intricate', 'resilience', 'nuance'). Absolutely NO advanced native idioms ('bite the bullet', 'devil\\'s advocate', 'spill the beans', 'elephant in the room', 'par for the course', 'hit the ground running', 'double-edged sword').
     * Lateral / Random Association Rule for Easy: If Relevance is Low (Lateral/Brainstorming ngẫu nhiên), creative contrast MUST come from simple everyday objects or daily situations (e.g. 'alarm clock' vs 'heavy rain', 'coffee cup' vs 'umbrella'), NEVER by pulling in rare, complex, or literary vocabulary!
   - **Medium (B1) - Conversational Collocations & Phrasal Verbs**:
     * Everyday workplace and social fluency ('figure out', 'run out of', 'get along with', 'tight deadline', 'make up one\\'s mind', 'have a point', 'keep in touch', 'look forward to', 'deal with', 'run into', 'make a living'). Balanced natural English. Avoid hyper-basic baby words, but also avoid obscure C1 idioms and rare academic words.
   - **Hard (B2-C1) - Idioms, Colloquial Metaphors & Nuanced Reflexes**:
     * Native-level spoken mastery ('play devil\\'s advocate', 'bite the bullet', 'double-edged sword', 'silver lining', 'hit the ground running', 'burn the midnight oil', 'fierce competition', 'meticulous detail', 'par for the course'). Strictly ban simplistic A1 filler words.

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

### PEDAGOGICAL STRUCTURE BASED ON SESSIONS:
Each Improv Package contains multiple Sessions. In each Session, each Item is an independent reflex challenge with N compact hints (1–2 words per clue):

1. **For 2-Hint Sessions (hcTotal = 2)**:
   - Hint 1: **Keyword / Core Vocab** (1–2 words: Danh từ / Động từ / Tính từ / Cụm từ).
   - Hint 2: **Ending** (1–2 words: Động từ / Tính từ / Trạng từ / Danh từ). A colorful, non-obvious collocated word or unexpected outcome.
   - *Example (Easy / A1-A2)*: Hint 1: "Wake up" (Trans: "Thức dậy", Type: "Cụm động từ · Keyword") | Hint 2: "heavy rain" (Trans: "mưa lớn", Type: "Danh từ · Ending")
   - *Rule*: EVERY single item in the session MUST have completely different, creative, distinct word pairs!

2. **For 3-Hint Sessions (hcTotal = 3)**:
   - Hint 1: **Keyword / Core Vocab** (1–2 words: Phrasal verb / Cụm đàm thoại / Phản hồi cảm xúc).
   - Hint 2: **Logic word / Từ nối** (1–2 words: transition & connective words in ENGLISH).
     *CRITICAL RULE*: Every item MUST use a DIFFERENT logic connector! Pick from: "otherwise" (nếu không), "therefore" (do đó), "eventually" (sau cùng), "before that" (trước đó), "moreover" (hơn nữa), "next" (tiếp theo), "nevertheless" (dù vậy), "meanwhile" (đồng thời), "however" (tuy nhiên), "for example" (ví dụ), "as long as" (miễn là), "besides" (ngoài ra), "after that" (sau đó), "on the other hand" (mặt khác), "as a result" (kết quả là), "even though" (mặc dù).
   - Hint 3: **Ending** (Tính từ / Trạng từ / Động từ - 1–2 words).

3. **For 4-Hint Sessions (hcTotal = 4)**:
   - Hint 1: **Keyword / WH-question** (1–2 words).
   - Hint 2: **Logic word / Từ nối** (1–2 words: MUST be different across all rows!).
   - Hint 3: **Fancy word / Ẩn dụ / Cụm gợi hình** (1–2 words colorful image).
   - Hint 4: **Ending** (1–2 words: Danh từ, Tính từ, Trạng từ).

### CRITICAL LANGUAGE INTEGRITY RULES:
- "text": MUST BE 100% ENGLISH. ABSOLUTELY NEVER put Vietnamese or Vietnamese diacritics in "text"!
- "translation": MUST BE 100% VIETNAMESE with proper accents/diacritics. ABSOLUTELY NEVER put English in "translation"!
- NEVER output the same string in both "text" and "translation"!

### OUTPUT FORMAT:
You MUST output ONLY a valid JSON object matching the requested schema without any markdown wrapping or explanation.`;

function generateId(prefix: string = 'improv'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function getDynamicTemperature(relevance?: string): number {
  const rel = (relevance || '').toLowerCase();
  if (rel.includes('low') || rel.includes('thấp')) return 0.95;
  if (rel.includes('medium') || rel.includes('vừa')) return 0.70;
  return 0.45; // High / Cao
}

export function getRelevanceDirective(relevance?: string): string {
  const rel = (relevance || '').toLowerCase();
  if (rel.includes('low') || rel.includes('thấp')) {
    return 'RELEVANCE LEVEL: LOW (Brainstorming ngẫu nhiên / Lateral Association). Maximize semantic surprise, unexpected cross-domain pairs.';
  }
  if (rel.includes('medium') || rel.includes('vừa')) {
    return 'RELEVANCE LEVEL: MEDIUM (Conversational Collocations). Natural everyday conversational pairings and realistic pivots.';
  }
  return 'RELEVANCE LEVEL: HIGH (Gắn kết câu chuyện logic). Tight narrative and logical continuity between hints.';
}

export function getDifficultyDirective(difficulty?: string): string {
  const diff = (difficulty || '').toLowerCase();
  if (diff.includes('easy') || diff.includes('dễ') || diff.includes('a1-a2')) {
    return 'DIFFICULTY: EASY (A1-A2). STRICT RULE: Use only top high-frequency daily words. Absolutely no B2-C1 words or complex idioms.';
  }
  if (diff.includes('hard') || diff.includes('khó') || diff.includes('b2-c1')) {
    return 'DIFFICULTY: HARD (B2-C1). Rich idioms, colloquial metaphors, sophisticated professional nuances. Ban trivial A1 filler.';
  }
  return 'DIFFICULTY: MEDIUM (B1). Everyday workplace & social collocations, phrasal verbs, balanced fluency.';
}

export function getCourseLevelDirective(level?: string): string {
  if (level === 'LEVEL_B_ERES') {
    return 'COURSE TARGET: LEVEL_B_ERES (Speaking Reflexes). Focus on spoken reactions, conversational banter, emotion shifts.';
  }
  if (level === 'LEVEL_B_EREL') {
    return 'COURSE TARGET: LEVEL_B_EREL (Listening Reflexes). Focus on acoustic assimilation, connected speech cues, natural comprehension.';
  }
  if (level === 'LEVEL_A') {
    return 'COURSE TARGET: LEVEL_A (Foundation Chunking). High-frequency sentence frames, core vocabulary.';
  }
  return 'COURSE TARGET: GENERAL CHUNKS REFLEXES.';
}

// --------------------------------------------------------------------------
// 2. Robust JSON Extraction & Repair
// --------------------------------------------------------------------------

export function extractAndParseJson<T = any>(rawText: string): T {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('No text content received from LLM to parse as JSON.');
  }

  let text = rawText.trim();
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  text = text.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  text = text.replace(/<(?:think|thought|reasoning)>[\s\S]*$/gi, '').trim();

  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    text = fenceMatch[1].trim();
  }

  text = text.replace(/data:\s*\[DONE\]\s*$/i, '').trim();

  try {
    return JSON.parse(text);
  } catch {}

  const cleanCommas = (str: string) => str.replace(/,\s*([}\]])/g, '$1');
  try {
    return JSON.parse(cleanCommas(text));
  } catch {}

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
        throw new Error(`Failed to parse LLM JSON candidate: ${err?.message}. Raw: ${candidate.slice(0, 200)}`);
      }
    }
  }

  throw new Error(`Could not locate valid JSON structure in LLM output. Raw snippet: ${text.slice(0, 200)}`);
}

// --------------------------------------------------------------------------
// 3. Server LLM Execution with Gemini Fallback Chain
// --------------------------------------------------------------------------

export async function executeLlmGeneration(
  config: ImprovLLMConfig,
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal
): Promise<string> {
  const cleanApiKey = (
    config.apiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ''
  ).trim();

  if (!cleanApiKey) {
    throw new Error('Chưa cung cấp Gemini API Key (qua request llmConfig hoặc biến môi trường GEMINI_API_KEY).');
  }

  const baseEndpoint = (config.endpoint || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');
  const primaryModel = (config.model || 'gemini-2.5-flash').trim();
  const fallbackModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  const modelChain = [primaryModel, ...fallbackModels.filter(m => m !== primaryModel)];

  const sysPromptWithJson = systemPrompt.toLowerCase().includes('json')
    ? systemPrompt
    : `You are an expert English pedagogy AI. You MUST respond strictly in valid JSON format.\n\n${systemPrompt}`;

  const userPromptWithJson = userPrompt.toLowerCase().includes('json')
    ? userPrompt
    : `${userPrompt}\n\nPlease output your response strictly as valid JSON.`;

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

  let lastError: Error | null = null;

  for (let mIdx = 0; mIdx < modelChain.length; mIdx++) {
    const currentModel = modelChain[mIdx];
    const isLastModel = mIdx === modelChain.length - 1;
    const url = baseEndpoint.includes('/v1beta') || baseEndpoint.includes('/v1')
      ? `${baseEndpoint}/models/${currentModel}:generateContent?key=${cleanApiKey}`
      : `${baseEndpoint}/v1beta/models/${currentModel}:generateContent?key=${cleanApiKey}`;

    const shouldTryThinkingConfig = currentModel.includes('2.5') || currentModel.includes('2.0') || currentModel.includes('thinking');

    try {
      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(buildGeminiBody(shouldTryThinkingConfig)),
        signal
      });

      // If older Gemini models reject thinkingConfig with 400 Bad Request, retry without it
      if (!response.ok && shouldTryThinkingConfig && response.status === 400) {
        const errPeek = await response.text();
        if (errPeek.includes('thinkingConfig') || errPeek.includes('thinkingBudget') || errPeek.includes('Unknown field')) {
          console.warn(`[improvServerEngine] Model ${currentModel} rejected thinkingConfig, retrying without thinkingConfig...`);
          response = await fetch(url, {
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
        if ((response.status === 404 || response.status === 503 || response.status === 429) && !isLastModel) {
          console.warn(`[improvServerEngine] Gemini model ${currentModel} returned ${response.status}. Retrying with ${modelChain[mIdx + 1]}...`);
          lastError = new Error(`Gemini API Error (${response.status}): ${errText}`);
          continue;
        }
        throw new Error(`Google Gemini API Error (${response.status}): ${errText}`);
      }

      const data = await response.json() as any;
      const candidate = data.candidates?.[0];
      const content = candidate?.content?.parts?.[0]?.text;

      if (candidate?.finishReason === 'MAX_TOKENS') {
        if (content) {
          try {
            extractAndParseJson(content);
          } catch {
            throw new Error('Google Gemini API reached token ceiling (finishReason: MAX_TOKENS).');
          }
        } else {
          throw new Error('Google Gemini API reached token ceiling (finishReason: MAX_TOKENS).');
        }
      }

      if (candidate?.finishReason === 'SAFETY') {
        throw new Error('Google Gemini API request was blocked by safety filters.');
      }

      if (!content) {
        throw new Error(`Google Gemini API returned empty content. FinishReason: ${candidate?.finishReason || 'UNKNOWN'}`);
      }

      return content;
    } catch (err: any) {
      if (signal?.aborted) throw err;
      if (!isLastModel) {
        console.warn(`[improvServerEngine] Model ${currentModel} failed (${err.message}). Retrying with ${modelChain[mIdx + 1]}...`);
        lastError = err;
        continue;
      }
      throw lastError || err;
    }
  }

  throw lastError || new Error('All fallback models failed to generate content.');
}

// --------------------------------------------------------------------------
// 4. Server-Side Algorithmic Fallback Generator (Zero-Fail Resilience)
// --------------------------------------------------------------------------

export function generateOfflineFallbackPackage(request: ImprovGenerateRequest): ImprovPackage {
  const isEasy = (request.difficulty || '').toLowerCase().includes('easy') ||
                 (request.difficulty || '').toLowerCase().includes('a1-a2') ||
                 (request.difficulty || '').toLowerCase().includes('dễ');

  const defaultEasySeeds = [
    { english: 'wake up early', vietnamese: 'thức dậy sớm' },
    { english: 'grab a coffee', vietnamese: 'mua cốc cà phê' },
    { english: 'take a break', vietnamese: 'nghỉ ngơi một lát' },
    { english: 'miss the bus', vietnamese: 'lỡ chuyến xe buýt' },
    { english: 'call a friend', vietnamese: 'gọi điện cho bạn bè' },
    { english: 'heavy rain', vietnamese: 'mưa lớn' },
    { english: 'feel tired', vietnamese: 'cảm thấy mệt mỏi' },
    { english: 'stay at home', vietnamese: 'ở nhà' },
    { english: 'pack a bag', vietnamese: 'chuẩn bị hành lý' },
    { english: 'good idea', vietnamese: 'ý kiến hay' },
    { english: 'order lunch', vietnamese: 'gọi bữa trưa' },
    { english: 'save money', vietnamese: 'tiết kiệm tiền' },
    { english: 'wait a minute', vietnamese: 'chờ một chút' },
    { english: 'fresh air', vietnamese: 'không khí trong lành' },
    { english: 'sunny day', vietnamese: 'ngày nắng đẹp' },
    { english: 'buy a ticket', vietnamese: 'mua một chiếc vé' }
  ];

  const defaultAdvancedSeeds = [
    { english: 'hit the ground running', vietnamese: 'bắt tay vào làm ngay' },
    { english: 'give it a shot', vietnamese: 'thử một phen' },
    { english: 'room for improvement', vietnamese: 'còn cơ hội để cải thiện' },
    { english: 'keep an eye on', vietnamese: 'để mắt tới' },
    { english: 'break the ice', vietnamese: 'phá vỡ bầu không khí ngại ngùng' },
    { english: 'out of the blue', vietnamese: 'bất thình lình' },
    { english: 'a blessing in disguise', vietnamese: 'trong cái rủi có cái may' },
    { english: 'bite the bullet', vietnamese: 'cắn răng chịu đựng' },
    { english: 'play devil\'s advocate', vietnamese: 'đóng vai người phản biện' },
    { english: 'burn the midnight oil', vietnamese: 'thức khuya làm việc' },
    { english: 'touch and go', vietnamese: 'bấp bênh khó đoán' },
    { english: 'on the fence', vietnamese: 'chưa thể quyết định' },
    { english: 'silver lining', vietnamese: 'tia hy vọng tích cực' },
    { english: 'spill the beans', vietnamese: 'bật mí bí mật' }
  ];

  const effectiveSeeds = isEasy ? defaultEasySeeds : defaultAdvancedSeeds;

  const defaultConnectors = [
    { english: 'therefore', vietnamese: 'do đó' },
    { english: 'however', vietnamese: 'tuy nhiên' },
    { english: 'eventually', vietnamese: 'sau cùng' },
    { english: 'before that', vietnamese: 'trước đó' },
    { english: 'meanwhile', vietnamese: 'đồng thời' },
    { english: 'moreover', vietnamese: 'hơn nữa' },
    { english: 'besides', vietnamese: 'ngoài ra' },
    { english: 'otherwise', vietnamese: 'nếu không' },
    { english: 'as a result', vietnamese: 'kết quả là' },
    { english: 'after that', vietnamese: 'sau đó' },
    { english: 'nevertheless', vietnamese: 'dù vậy' },
    { english: 'as long as', vietnamese: 'miễn là' }
  ];

  const defaultEasyEndings = [
    { english: 'be late', vietnamese: 'đi trễ' },
    { english: 'feel happy', vietnamese: 'cảm thấy vui vẻ' },
    { english: 'stay safe', vietnamese: 'giữ an toàn' },
    { english: 'have fun', vietnamese: 'vui chơi thoải mái' },
    { english: 'feel relaxed', vietnamese: 'thư giãn' },
    { english: 'good outcome', vietnamese: 'kết quả tốt' },
    { english: 'arrive on time', vietnamese: 'đến đúng giờ' },
    { english: 'solve it', vietnamese: 'giải quyết được' }
  ];

  const defaultAdvancedEndings = [
    { english: 'fierce debate', vietnamese: 'tranh luận nảy lửa' },
    { english: 'unintended consequence', vietnamese: 'hậu quả bất ngờ' },
    { english: 'remarkable turnaround', vietnamese: 'bước ngoặt đáng kinh ngạc' },
    { english: 'catastrophic failure', vietnamese: 'thất bại nặng nề' },
    { english: 'smooth transition', vietnamese: 'chuyển giao êm đẹp' },
    { english: 'breakthrough moment', vietnamese: 'thời khắc đột phá' },
    { english: 'lasting impression', vietnamese: 'ấn tượng sâu đậm' }
  ];

  const defaultEasyFancy = [
    { english: 'warm smile', vietnamese: 'nụ cười ấm áp' },
    { english: 'bright light', vietnamese: 'ánh sáng rực rỡ' },
    { english: 'quiet room', vietnamese: 'căn phòng yên tĩnh' },
    { english: 'cool breeze', vietnamese: 'làn gió mát mẻ' }
  ];

  const defaultAdvancedFancy = [
    { english: 'double-edged sword', vietnamese: 'con dao hai lưỡi' },
    { english: 'elephant in the room', vietnamese: 'vấn đề lớn bị ngó lơ' },
    { english: 'watchful eye', vietnamese: 'ánh mắt dò xét' },
    { english: 'wake-up call', vietnamese: 'lời cảnh tỉnh' }
  ];

  const endingsPool = isEasy ? defaultEasyEndings : defaultAdvancedEndings;
  const fancyPool = isEasy ? defaultEasyFancy : defaultAdvancedFancy;

  const sessionConfigs: ImprovSessionConfig[] = request.sessionsConfig && request.sessionsConfig.length > 0
    ? request.sessionsConfig.map((s, idx) => ({
        sessionNumber: s.sessionNumber || (idx + 1),
        title: s.title || `Session ${s.sessionNumber || (idx + 1)}`,
        hcTotal: s.hcTotal || 2,
        hintTypes: s.hintTypes || ['Keyword', 'Ending'],
        itemsCount: s.itemsCount > 0 ? s.itemsCount : 5
      }))
    : [
        { sessionNumber: 1, title: 'Session 1: Two-Word Reflex Pairs', hcTotal: 2, hintTypes: ['Keyword · Cụm phản xạ', 'Ending · Kết quả'], itemsCount: Math.ceil((request.totalItems || 20) / 4) },
        { sessionNumber: 2, title: 'Session 2: Three-Hint Reflex Triples', hcTotal: 3, hintTypes: ['Keyword', 'Từ nối · Logic word', 'Ending'], itemsCount: Math.ceil((request.totalItems || 20) / 4) },
        { sessionNumber: 3, title: 'Session 3: Four-Hint Extended Reflexes', hcTotal: 4, hintTypes: ['Keyword', 'Từ nối · Logic word', 'Fancy word', 'Ending'], itemsCount: Math.ceil((request.totalItems || 20) / 4) },
        { sessionNumber: 4, title: 'Session 4: Four-Hint Advanced Synthesis', hcTotal: 4, hintTypes: ['Keyword', 'Từ nối · Logic word', 'Fancy word', 'Ending'], itemsCount: Math.max(1, (request.totalItems || 20) - 3 * Math.ceil((request.totalItems || 20) / 4)) }
      ];

  const now = new Date().toISOString();
  const packageId = generateId('pkg_improv');

  const sessions: ImprovSession[] = sessionConfigs.map((sConfig, sIdx) => {
    const itemsCount = sConfig.itemsCount > 0 ? sConfig.itemsCount : 5;
    const sessionNumber = sConfig.sessionNumber || (sIdx + 1);
    const sessionTitle = sConfig.title || `Session ${sessionNumber}`;
    const hcTotal = sConfig.hcTotal || 2;
    const hintTypes = sConfig.hintTypes && sConfig.hintTypes.length > 0
      ? sConfig.hintTypes
      : Array.from({ length: hcTotal }, (_, i) => i === 0 ? 'Keyword' : i === hcTotal - 1 ? 'Ending' : 'Logic word');

    const items: ImprovItem[] = [];

    for (let it = 1; it <= itemsCount; it++) {
      const seedIndex = (sIdx * 10 + it - 1) % effectiveSeeds.length;
      const seed = effectiveSeeds[seedIndex];
      const connector = defaultConnectors[(sIdx * 7 + it - 1) % defaultConnectors.length];
      const ending = endingsPool[(sIdx * 5 + it - 1) % endingsPool.length];
      const fancy = fancyPool[(sIdx * 3 + it - 1) % fancyPool.length];

      const hints: ImprovHint[] = [];

      for (let h = 1; h <= hcTotal; h++) {
        let text = '';
        let translation = '';
        const typeFunction = hintTypes[h - 1] || `Hint ${h}`;

        if (h === 1) {
          text = seed.english;
          translation = seed.vietnamese;
        } else if (hcTotal === 2) {
          text = ending.english;
          translation = ending.vietnamese;
        } else if (hcTotal === 3) {
          if (h === 2) {
            text = connector.english;
            translation = connector.vietnamese;
          } else {
            text = ending.english;
            translation = ending.vietnamese;
          }
        } else {
          if (h === 2) {
            text = connector.english;
            translation = connector.vietnamese;
          } else if (h === 3) {
            text = fancy.english;
            translation = fancy.vietnamese;
          } else {
            text = ending.english;
            translation = ending.vietnamese;
          }
        }

        hints.push({
          id: `h_${sessionNumber}_${it}_${h}`,
          text,
          translation,
          typeFunction,
          itemIndex: h
        });
      }

      items.push({
        id: `item_s${sessionNumber}_i${it}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        itemNumber: it,
        sessionNumber,
        hcTotal: hints.length,
        hints,
        createdAt: now
      });
    }

    return {
      sessionNumber,
      title: sessionTitle,
      hcTotal,
      hintTypes,
      items
    };
  });

  const totalItems = sessions.reduce((sum, s) => sum + s.items.length, 0);

  const rawPkg: ImprovPackage = {
    id: packageId,
    title: request.packageTitle || 'CHUNKS Improv Package',
    description: request.packageDescription || `CHUNKS Improv reflex package (${sessions.length} sessions, ${totalItems} items).`,
    totalItems,
    sessionsCount: sessions.length,
    sessions,
    sourceCourseLevel: request.sourceLevel,
    sourceLessonIds: request.sourceLessonIds,
    createdAt: now,
    updatedAt: now
  };

  const { package: sanitizedPkg } = evaluateAndSanitizePackage(rawPkg);
  return sanitizedPkg;
}

// --------------------------------------------------------------------------
// 5. Generate Single Session
// --------------------------------------------------------------------------

export async function generateSingleSession(
  sessionConfig: ImprovSessionConfig,
  options: {
    packageTitle?: string;
    difficulty?: string;
    relevance?: string;
    sourceLevel?: string;
    seedChunks?: ChunkItem[];
    llmConfig?: Partial<ImprovLLMConfig>;
    topic?: string;
    targetGrammar?: string;
    pedagogicalNotes?: string;
    conversationalTone?: string;
    targetAudience?: string;
  } = {},
  signal?: AbortSignal
): Promise<ImprovSession> {
  const dynamicTemperature = getDynamicTemperature(options.relevance);
  const relevanceDirective = getRelevanceDirective(options.relevance);
  const difficultyDirective = getDifficultyDirective(options.difficulty);
  const courseLevelDirective = getCourseLevelDirective(options.sourceLevel);

  const effectiveLlmConfig: ImprovLLMConfig = {
    provider: 'GOOGLE_GENAI',
    endpoint: options.llmConfig?.endpoint || 'https://generativelanguage.googleapis.com',
    apiKey: (options.llmConfig?.apiKey || process.env.GEMINI_API_KEY || '').trim(),
    model: options.llmConfig?.model || 'gemini-2.5-flash',
    masterPrompt: options.llmConfig?.masterPrompt || DEFAULT_IMPROV_MASTER_PROMPT,
    temperature: dynamicTemperature,
    maxTokens: options.llmConfig?.maxTokens || 8192
  };

  const now = new Date().toISOString();
  const sessionNum = sessionConfig.sessionNumber || 1;
  const totalItemsNeeded = sessionConfig.itemsCount > 0 ? sessionConfig.itemsCount : 5;
  const sessionTitle = sessionConfig.title || `Session ${sessionNum}`;

  const isEasy = (options.difficulty || '').toLowerCase().includes('easy') ||
                 (options.difficulty || '').toLowerCase().includes('a1-a2') ||
                 (options.difficulty || '').toLowerCase().includes('dễ');

  let seedSample: { seedNumber: number; english: string; vietnamese: string }[] = [];
  if (options.seedChunks && options.seedChunks.length > 0) {
    seedSample = options.seedChunks.map((c, i) => ({
      seedNumber: i + 1,
      english: (c.english || '').trim(),
      vietnamese: (c.vietnamese || '').trim()
    })).filter(s => s.english.length > 0);
  }

  if (seedSample.length === 0) {
    seedSample = isEasy ? [
      { seedNumber: 1, english: 'wake up early', vietnamese: 'thức dậy sớm' },
      { seedNumber: 2, english: 'take a break', vietnamese: 'nghỉ ngơi một lát' },
      { seedNumber: 3, english: 'heavy rain', vietnamese: 'mưa lớn' },
      { seedNumber: 4, english: 'grab a coffee', vietnamese: 'mua cốc cà phê' },
      { seedNumber: 5, english: 'call a friend', vietnamese: 'gọi điện cho bạn bè' },
      { seedNumber: 6, english: 'miss the bus', vietnamese: 'lỡ chuyến xe buýt' },
      { seedNumber: 7, english: 'feel tired', vietnamese: 'cảm thấy mệt mỏi' },
      { seedNumber: 8, english: 'good idea', vietnamese: 'ý kiến hay' }
    ] : [
      { seedNumber: 1, english: 'give it a shot', vietnamese: 'thử một phen' },
      { seedNumber: 2, english: 'hit the ground running', vietnamese: 'bắt tay vào làm ngay' },
      { seedNumber: 3, english: 'room for improvement', vietnamese: 'còn cơ hội để cải thiện' },
      { seedNumber: 4, english: 'keep an eye on', vietnamese: 'để mắt tới' },
      { seedNumber: 5, english: 'break the ice', vietnamese: 'phá vỡ bầu không khí ngại ngùng' },
      { seedNumber: 6, english: 'out of the blue', vietnamese: 'bất thình lình' },
      { seedNumber: 7, english: 'a blessing in disguise', vietnamese: 'trong cái rủi có cái may' },
      { seedNumber: 8, english: 'to put it bluntly', vietnamese: 'nói thẳng ra là' }
    ];
  }

  const pedagogicalDirectives: string[] = [];
  if (options.topic?.trim()) pedagogicalDirectives.push(`- TOPIC: "${options.topic.trim()}"`);
  if (options.targetGrammar?.trim()) pedagogicalDirectives.push(`- TARGET GRAMMAR: "${options.targetGrammar.trim()}"`);
  if (options.conversationalTone?.trim()) pedagogicalDirectives.push(`- TONE: "${options.conversationalTone.trim()}"`);
  if (options.targetAudience?.trim()) pedagogicalDirectives.push(`- AUDIENCE: "${options.targetAudience.trim()}"`);
  if (options.pedagogicalNotes?.trim()) pedagogicalDirectives.push(`- NOTES: "${options.pedagogicalNotes.trim()}"`);
  const pedagogicalBlock = pedagogicalDirectives.length > 0 ? `\n### DIRECTIVES:\n${pedagogicalDirectives.join('\n')}\n` : '';

  const userPrompt = `You must generate valid JSON for Session ${sessionNum} of "${options.packageTitle || 'Improv'}"
- Session Number: ${sessionNum}
- Total Items: ${totalItemsNeeded}
- Hints per Item (hcTotal): ${sessionConfig.hcTotal}
- Hint Types: ${JSON.stringify(sessionConfig.hintTypes)}
- Difficulty: ${options.difficulty || 'Medium (B1)'}
- Relevance: ${options.relevance || 'High'}
- Seeds: ${JSON.stringify(seedSample)}
${pedagogicalBlock}
${courseLevelDirective}
${difficultyDirective}
${relevanceDirective}

Schema:
{
  "sessionNumber": ${sessionNum},
  "title": "${sessionTitle}",
  "hcTotal": ${sessionConfig.hcTotal},
  "hintTypes": ${JSON.stringify(sessionConfig.hintTypes)},
  "items": [
    {
      "itemNumber": 1,
      "sessionNumber": ${sessionNum},
      "hcTotal": ${sessionConfig.hcTotal},
      "hints": [
        { "itemIndex": 1, "text": "...", "translation": "...", "typeFunction": "${sessionConfig.hintTypes[0] || 'Keyword'}" }
      ]
    }
  ]
}`;

  try {
    const rawContent = await executeLlmGeneration(
      effectiveLlmConfig,
      effectiveLlmConfig.masterPrompt,
      userPrompt,
      signal
    );

    const parsed = extractAndParseJson<any>(rawContent);
    let itemsArr: any[] = [];
    if (Array.isArray(parsed)) itemsArr = parsed;
    else if (Array.isArray(parsed.items)) itemsArr = parsed.items;
    else if (parsed.session?.items) itemsArr = parsed.session.items;

    const items: ImprovItem[] = itemsArr.map((it: any, itIdx: number) => {
      const itemNumber = itIdx + 1;
      const hints: ImprovHint[] = (it.hints || []).map((h: any, hIdx: number) => ({
        id: `h_${sessionNum}_${itemNumber}_${h.itemIndex || (hIdx + 1)}`,
        text: String(h.text || '').trim(),
        translation: String(h.translation || '').trim(),
        typeFunction: String(h.typeFunction || sessionConfig.hintTypes[hIdx] || `Hint ${hIdx + 1}`).trim(),
        itemIndex: Number(h.itemIndex) || (hIdx + 1)
      }));

      return {
        id: `item_s${sessionNum}_i${itemNumber}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        itemNumber,
        sessionNumber: sessionNum,
        hcTotal: hints.length,
        hints,
        createdAt: now
      };
    });

    const session: ImprovSession = {
      sessionNumber: sessionNum,
      title: parsed.title || sessionTitle,
      hcTotal: sessionConfig.hcTotal,
      hintTypes: sessionConfig.hintTypes,
      items
    };

    return session;
  } catch (err) {
    console.warn('[improvServerEngine] Error in generateSingleSession, returning fallback session:', err);
    const fallbackPkg = generateOfflineFallbackPackage({
      packageTitle: options.packageTitle || 'Improv Package',
      totalItems: totalItemsNeeded,
      sessionsConfig: [sessionConfig],
      sourceLevel: (options.sourceLevel as any) || 'CUSTOM',
      sourceLessonIds: [],
      difficulty: options.difficulty || 'Medium (B1)',
      relevance: options.relevance || 'High'
    });
    return fallbackPkg.sessions[0];
  }
}

// --------------------------------------------------------------------------
// 6. Generate Full Package with Micro-Batching & Multi-Tier Fallback
// --------------------------------------------------------------------------

export async function generatePackage(
  request: ImprovGenerateRequest,
  options?: { signal?: AbortSignal }
): Promise<ImprovPackage> {
  const signal = options?.signal;
  const dynamicTemperature = getDynamicTemperature(request.relevance);
  const relevanceDirective = getRelevanceDirective(request.relevance);
  const difficultyDirective = getDifficultyDirective(request.difficulty);
  const courseLevelDirective = getCourseLevelDirective(request.sourceLevel);

  const effectiveLlmConfig: ImprovLLMConfig = {
    provider: 'GOOGLE_GENAI',
    endpoint: request.llmConfig?.endpoint || 'https://generativelanguage.googleapis.com',
    apiKey: (request.llmConfig?.apiKey || process.env.GEMINI_API_KEY || '').trim(),
    model: request.llmConfig?.model || 'gemini-2.5-flash',
    masterPrompt: request.llmConfig?.masterPrompt || DEFAULT_IMPROV_MASTER_PROMPT,
    temperature: dynamicTemperature,
    maxTokens: request.llmConfig?.maxTokens || 16384
  };

  // If no API key is available, directly return high quality offline fallback
  if (!effectiveLlmConfig.apiKey) {
    console.warn('[improvServerEngine] No Gemini API key provided. Using offline fallback generator.');
    return generateOfflineFallbackPackage(request);
  }

  // Compile context directives
  const pedagogicalDirectives: string[] = [];
  if (request.topic?.trim()) pedagogicalDirectives.push(`- TOPIC: "${request.topic.trim()}"`);
  if (request.targetGrammar?.trim()) pedagogicalDirectives.push(`- TARGET GRAMMAR: "${request.targetGrammar.trim()}"`);
  if (request.conversationalTone?.trim()) pedagogicalDirectives.push(`- CONVERSATIONAL TONE: "${request.conversationalTone.trim()}"`);
  if (request.targetAudience?.trim()) pedagogicalDirectives.push(`- TARGET AUDIENCE: "${request.targetAudience.trim()}"`);
  if (request.pedagogicalNotes?.trim()) pedagogicalDirectives.push(`- PEDAGOGICAL NOTES: "${request.pedagogicalNotes.trim()}"`);
  const pedagogicalBlock = pedagogicalDirectives.length > 0 ? `\n### CUSTOM PEDAGOGICAL DIRECTIVES:\n${pedagogicalDirectives.join('\n')}\n` : '';

  // Step 1: Gather seed chunks (from Firestore if available)
  let seedChunks: ChunkItem[] = [];
  if (request.sourceLessonIds && request.sourceLessonIds.length > 0) {
    for (const lId of request.sourceLessonIds) {
      const lesson = await getLessonById(lId);
      if (lesson?.chunks) seedChunks.push(...lesson.chunks);
    }
  }

  if (request.sourceLevel && seedChunks.length < 15) {
    const level = request.sourceLevel === 'ALL' ? 'LEVEL_B_ERES' : request.sourceLevel;
    const lessons = await getLessonsByLevel(level);
    lessons.forEach(l => {
      if (l.chunks) seedChunks.push(...l.chunks);
    });
  }

  // Format seed list
  let seedSample = seedChunks.map((c, i) => ({
    seedNumber: i + 1,
    english: (c.english || '').trim(),
    vietnamese: (c.vietnamese || '').trim()
  })).filter(s => s.english.length > 0);

  const isEasy = (request.difficulty || '').toLowerCase().includes('easy') ||
                 (request.difficulty || '').toLowerCase().includes('a1-a2') ||
                 (request.difficulty || '').toLowerCase().includes('dễ');

  if (seedSample.length === 0) {
    seedSample = isEasy ? [
      { seedNumber: 1, english: 'wake up early', vietnamese: 'thức dậy sớm' },
      { seedNumber: 2, english: 'take a break', vietnamese: 'nghỉ ngơi một lát' },
      { seedNumber: 3, english: 'heavy rain', vietnamese: 'mưa lớn' },
      { seedNumber: 4, english: 'grab a coffee', vietnamese: 'mua cốc cà phê' },
      { seedNumber: 5, english: 'call a friend', vietnamese: 'gọi điện cho bạn bè' },
      { seedNumber: 6, english: 'miss the bus', vietnamese: 'lỡ chuyến xe buýt' },
      { seedNumber: 7, english: 'feel tired', vietnamese: 'cảm thấy mệt mỏi' },
      { seedNumber: 8, english: 'good idea', vietnamese: 'ý kiến hay' }
    ] : [
      { seedNumber: 1, english: 'give it a shot', vietnamese: 'thử một phen' },
      { seedNumber: 2, english: 'hit the ground running', vietnamese: 'bắt tay vào làm ngay' },
      { seedNumber: 3, english: 'room for improvement', vietnamese: 'còn cơ hội để cải thiện' },
      { seedNumber: 4, english: 'keep an eye on', vietnamese: 'để mắt tới' },
      { seedNumber: 5, english: 'break the ice', vietnamese: 'phá vỡ bầu không khí ngại ngùng' },
      { seedNumber: 6, english: 'out of the blue', vietnamese: 'bất thình lình' },
      { seedNumber: 7, english: 'a blessing in disguise', vietnamese: 'trong cái rủi có cái may' },
      { seedNumber: 8, english: 'to put it bluntly', vietnamese: 'nói thẳng ra là' }
    ];
  }

  // Session configs
  const sessionConfigs: ImprovSessionConfig[] = request.sessionsConfig && request.sessionsConfig.length > 0
    ? request.sessionsConfig.map((s, idx) => ({
        sessionNumber: s.sessionNumber || (idx + 1),
        title: s.title || `Session ${s.sessionNumber || (idx + 1)}`,
        hcTotal: s.hcTotal || 2,
        hintTypes: s.hintTypes || ['Keyword', 'Ending'],
        itemsCount: s.itemsCount > 0 ? s.itemsCount : 5
      }))
    : [
        { sessionNumber: 1, title: 'Session 1: Two-Word Reflex Pairs', hcTotal: 2, hintTypes: ['Keyword · Cụm phản xạ', 'Ending · Kết quả'], itemsCount: Math.ceil((request.totalItems || 20) / 4) },
        { sessionNumber: 2, title: 'Session 2: Three-Hint Reflex Triples', hcTotal: 3, hintTypes: ['Keyword', 'Từ nối · Logic word', 'Ending'], itemsCount: Math.ceil((request.totalItems || 20) / 4) },
        { sessionNumber: 3, title: 'Session 3: Four-Hint Extended Reflexes', hcTotal: 4, hintTypes: ['Keyword', 'Từ nối · Logic word', 'Fancy word', 'Ending'], itemsCount: Math.ceil((request.totalItems || 20) / 4) },
        { sessionNumber: 4, title: 'Session 4: Four-Hint Advanced Synthesis', hcTotal: 4, hintTypes: ['Keyword', 'Từ nối · Logic word', 'Fancy word', 'Ending'], itemsCount: Math.max(1, (request.totalItems || 20) - 3 * Math.ceil((request.totalItems || 20) / 4)) }
      ];

  const packageId = generateId('pkg_improv');
  const now = new Date().toISOString();

  // Plan micro-batches
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
      const batchSize = totalItems <= 12 ? Math.ceil(totalItems / 2) : 6;
      let remaining = totalItems;
      let currentStart = 1;
      const batchesList: { startItem: number; count: number }[] = [];
      while (remaining > 0) {
        const c = Math.min(batchSize, remaining);
        batchesList.push({ startItem: currentStart, count: c });
        currentStart += c;
        remaining -= c;
      }
      batchesList.forEach((b, bIdx) => {
        allPlannedBatches.push({
          sessionNumber: sConfig.sessionNumber,
          sessionConfig: sConfig,
          batchIndex: bIdx,
          totalBatchesInSession: batchesList.length,
          startItem: b.startItem,
          count: b.count
        });
      });
    }
  });

  const sessionAccumulators = new Map<number, {
    title: string;
    hcTotal: number;
    hintTypes: string[];
    items: ImprovItem[];
  }>();

  sessionConfigs.forEach(sConfig => {
    sessionAccumulators.set(sConfig.sessionNumber, {
      title: sConfig.title || `Session ${sConfig.sessionNumber}`,
      hcTotal: sConfig.hcTotal,
      hintTypes: sConfig.hintTypes,
      items: []
    });
  });

  let successBatchesCount = 0;

  try {
    for (let batchStep = 0; batchStep < allPlannedBatches.length; batchStep++) {
      const batch = allPlannedBatches[batchStep];
      const sConfig = batch.sessionConfig;
      const sessionNum = batch.sessionNumber;
      const endItem = batch.startItem + batch.count - 1;

      const seedsPerBatch = Math.max(6, Math.ceil(batch.count * 1.5));
      const startSeedIdx = (batchStep * seedsPerBatch) % Math.max(1, seedSample.length);
      let batchSeeds = seedSample.slice(startSeedIdx, startSeedIdx + seedsPerBatch);
      if (batchSeeds.length < seedsPerBatch && seedSample.length >= seedsPerBatch) {
        batchSeeds = [...batchSeeds, ...seedSample.slice(0, seedsPerBatch - batchSeeds.length)];
      }

      const sessionUserPrompt = `Generate JSON for Session ${sessionNum} of "${request.packageTitle}":
- Session: ${sessionNum}
- Items: ${batch.count} (Item numbers ${batch.startItem} to ${endItem})
- Hints per Item: ${sConfig.hcTotal}
- Hint Types: ${JSON.stringify(sConfig.hintTypes)}
- Difficulty: ${request.difficulty || 'Medium (B1)'}
- Relevance: ${request.relevance || 'High'}
- Seeds: ${JSON.stringify(batchSeeds)}
${pedagogicalBlock}
${courseLevelDirective}
${difficultyDirective}
${relevanceDirective}

Schema:
{
  "sessionNumber": ${sessionNum},
  "title": "${sConfig.title || `Session ${sessionNum}`}",
  "hcTotal": ${sConfig.hcTotal},
  "hintTypes": ${JSON.stringify(sConfig.hintTypes)},
  "items": [
    {
      "itemNumber": ${batch.startItem},
      "sessionNumber": ${sessionNum},
      "hcTotal": ${sConfig.hcTotal},
      "hints": [
        { "itemIndex": 1, "text": "...", "translation": "...", "typeFunction": "${sConfig.hintTypes[0] || 'Keyword'}" }
      ]
    }
  ]
}`;

      let validatedBatchItems: ImprovItem[] = [];
      try {
        const rawContent = await executeLlmGeneration(
          effectiveLlmConfig,
          effectiveLlmConfig.masterPrompt,
          sessionUserPrompt,
          signal
        );

        const parsed = extractAndParseJson<any>(rawContent);
        let rawItems: any[] = [];
        if (Array.isArray(parsed)) rawItems = parsed;
        else if (Array.isArray(parsed.items)) rawItems = parsed.items;
        else if (Array.isArray(parsed.sessions) && parsed.sessions[0]?.items) rawItems = parsed.sessions[0].items;

        validatedBatchItems = rawItems.map((it: any, itIdx: number) => {
          const assignedItemNumber = batch.startItem + itIdx;
          const itemNumber = Number(it.itemNumber) || assignedItemNumber;
          const hints: ImprovHint[] = (it.hints || []).map((h: any, hIdx: number) => ({
            id: `h_${sessionNum}_${itemNumber}_${h.itemIndex || (hIdx + 1)}`,
            text: String(h.text || '').trim(),
            translation: String(h.translation || '').trim(),
            typeFunction: String(h.typeFunction || (sConfig.hintTypes[hIdx] || `Hint ${hIdx + 1}`)).trim(),
            itemIndex: Number(h.itemIndex) || (hIdx + 1)
          }));

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

          if (hints.length > sConfig.hcTotal) {
            hints.length = sConfig.hcTotal;
          }

          return {
            id: `item_s${sessionNum}_i${itemNumber}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            itemNumber,
            sessionNumber: sessionNum,
            hcTotal: hints.length,
            hints,
            createdAt: now
          };
        });

        // Ensure required count
        while (validatedBatchItems.length < batch.count) {
          const missingIdx = validatedBatchItems.length;
          const itemNumber = batch.startItem + missingIdx;
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
            id: `item_s${sessionNum}_i${itemNumber}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            itemNumber,
            sessionNumber: sessionNum,
            hcTotal: hints.length,
            hints,
            createdAt: now
          });
        }

        successBatchesCount++;
      } catch (batchErr) {
        console.warn(`[improvServerEngine] Batch ${batchStep + 1} failed, synthesizing fallback items:`, batchErr);
        for (let i = 0; i < batch.count; i++) {
          const itemNumber = batch.startItem + i;
          const seed = batchSeeds[i % batchSeeds.length] || { english: 'Practice phrase', vietnamese: 'Cụm từ thực hành' };
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
            id: `item_s${sessionNum}_i${itemNumber}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            itemNumber,
            sessionNumber: sessionNum,
            hcTotal: hints.length,
            hints,
            createdAt: now
          });
        }
      }

      sessionAccumulators.get(sessionNum)!.items.push(...validatedBatchItems);
    }
  } catch (fatalErr) {
    console.warn('[improvServerEngine] Fatal error during LLM generation. Returning offline fallback package:', fatalErr);
    return generateOfflineFallbackPackage(request);
  }

  if (successBatchesCount === 0) {
    console.warn('[improvServerEngine] All LLM batches failed. Returning offline fallback package.');
    return generateOfflineFallbackPackage(request);
  }

  const generatedSessions: ImprovSession[] = sessionConfigs.map(sConfig => {
    const sessionData = sessionAccumulators.get(sConfig.sessionNumber)!;
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

  const rawPkg: ImprovPackage = {
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

  const { package: sanitizedFinalPkg } = evaluateAndSanitizePackage(rawPkg);
  return sanitizedFinalPkg;
}
