import { CourseLevel } from './index';

// --------------------------------------------------------------------------
// 1. CHUNKS Improv Hint & Item Entities
// --------------------------------------------------------------------------

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

// --------------------------------------------------------------------------
// 2. CHUNKS Improv Session & Package Entities
// --------------------------------------------------------------------------

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

// --------------------------------------------------------------------------
// 3. LLM Configuration & Generation Request Contracts
// --------------------------------------------------------------------------

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
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | string;
  relevance: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  llmConfig: ImprovLLMConfig;
}
