// --------------------------------------------------------------------------
// Canonical CHUNKS Improv Domain Models & Contracts (Serverless Functions)
// --------------------------------------------------------------------------

export type CourseLevel = 
  | 'LEVEL_A' 
  | 'LEVEL_B_EREL' 
  | 'LEVEL_B_ERES' 
  | 'LEVEL_C' 
  | 'IELTS_DRILL' 
  | 'CUSTOM';

export interface ChunkItem {
  chunk_id: string;
  english: string;
  vietnamese: string;
  category?: string;
  audio_url?: string;
}

export interface ImprovHint {
  id: string;
  text: string;
  translation: string;
  typeFunction: string;
  itemIndex: number;
  audioUrl?: string;
  audioUrlVi?: string;
}

export interface ImprovItem {
  id: string;
  itemNumber: number;
  sessionNumber: number;
  hcTotal: number;
  hints: ImprovHint[];
  audioUrl?: string;
  audioUrlVi?: string;
  createdAt?: string;
}

export interface ImprovSession {
  sessionNumber: number;
  title: string;
  hcTotal: number;
  hintTypes: string[];
  items: ImprovItem[];
}

export interface ImprovPackage {
  id: string;
  title: string;
  description: string;
  totalItems: number;
  sessionsCount: number;
  sessions: ImprovSession[];
  createdAt: string;
  updatedAt: string;
  sourceCourseLevel?: string;
  sourceLessonIds?: string[];
}

export type ImprovLlmProvider = 'GOOGLE_GENAI' | 'CUSTOM_OPENAI';

export interface ImprovLLMConfig {
  provider?: ImprovLlmProvider;
  endpoint: string;
  apiKey: string;
  model: string;
  masterPrompt: string;
  temperature: number;
  maxTokens: number;
  webClientId?: string;
}

export interface ImprovSessionConfig {
  sessionNumber: number;
  title?: string;
  hcTotal: number;
  hintTypes: string[];
  itemsCount: number;
}

export type ImprovDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type ImprovRelevance = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ImprovBatchGenerationStatus {
  batchIndex: number;
  totalBatches: number;
  sessionNumber: number;
  itemsRange: string;
  itemRange?: [number, number];
  batchId?: string;
  count: number;
  itemsCount?: number;
  status: 'pending' | 'generating' | 'success' | 'failed';
  error?: string;
  modelName?: string;
  durationMs?: number;
}

export interface ImprovGenerateProgressDetail {
  batchIndex: number;
  totalBatches: number;
  batches: ImprovBatchGenerationStatus[];
  successBatches: number;
  failedBatches: number;
}

export interface ImprovGenerateRequest {
  packageTitle: string;
  packageDescription?: string;
  totalItems: number;
  sessionsCount?: number;
  sessionsConfig: ImprovSessionConfig[];
  sourceLevel: CourseLevel | 'ALL';
  sourceLessonIds: string[];
  selectedVocabIds?: string[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | string;
  relevance: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  llmConfig?: Partial<ImprovLLMConfig>;
  topic?: string;
  targetGrammar?: string;
  pedagogicalNotes?: string;
  conversationalTone?: string;
  targetAudience?: string;
}

export interface HintEvaluationResult {
  hintId: string;
  sessionNumber: number;
  itemNumber: number;
  itemIndex: number;
  originalText: string;
  originalTranslation: string;
  fixedText: string;
  fixedTranslation: string;
  reason: string;
}
