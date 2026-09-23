import { 
  ImprovPackage, 
  ImprovSession, 
  ImprovSessionConfig, 
  ImprovGenerateRequest, 
  ImprovLLMConfig,
  ImprovGenerateProgressDetail,
  ChunkItem
} from '../types';
import { 
  generateImprovPackage, 
  generateSingleSession, 
  generateOfflineFallbackPackage,
  testLlmConnection, 
  getAllImprovPackages, 
  getImprovPackageById, 
  saveImprovPackage, 
  deleteImprovPackage, 
  exportImprovPackageToExcel, 
  parseImprovExcelFile, 
  evaluateAndSanitizePackage,
  HintEvaluationResult,
  LlmTestResult
} from '../services/improvService';

/**
 * Options for single session generation
 */
export interface GenerateSingleSessionOptions {
  packageTitle?: string;
  difficulty?: string;
  relevance?: string;
  sourceLevel?: string;
  seedChunks?: ChunkItem[];
  llmConfig?: ImprovLLMConfig;
  topic?: string;
  targetGrammar?: string;
  pedagogicalNotes?: string;
  conversationalTone?: string;
  targetAudience?: string;
}

/**
 * Unified Modular Improv API Gateway
 * Exposes type-safe operations for Improv package creation, micro-batch LLM synthesis,
 * Excel ingestion/export, offline fallback generation, and Firestore synchronization.
 */
export const improvApi = {
  /**
   * Generates a full ImprovPackage using resilient micro-batching across configured sessions.
   * If all batches fail or network is blocked, seamlessly falls back to offline package synthesis.
   */
  async generatePackage(
    request: ImprovGenerateRequest,
    onProgress?: (
      current: number,
      total: number,
      message: string,
      detail?: ImprovGenerateProgressDetail
    ) => void,
    signal?: AbortSignal
  ): Promise<ImprovPackage> {
    return await generateImprovPackage(request, onProgress, signal);
  },

  /**
   * Generates a single ImprovSession with the specified sessionConfig.itemsCount items,
   * taking into account topic, grammar, pedagogical notes, tone, and audience.
   */
  async generateSingleSession(
    sessionConfig: ImprovSessionConfig,
    options: GenerateSingleSessionOptions = {},
    signal?: AbortSignal
  ): Promise<ImprovSession> {
    return await generateSingleSession(sessionConfig, options, signal);
  },

  /**
   * Tests connectivity, latency, and model availability with the configured LLM endpoint.
   */
  async testLlmConnection(
    config: ImprovLLMConfig,
    signal?: AbortSignal
  ): Promise<LlmTestResult> {
    return await testLlmConnection(config, signal);
  },

  /**
   * Retrieves all ImprovPackages from Firestore (with LocalStorage cache fallback).
   */
  async getAllPackages(): Promise<ImprovPackage[]> {
    return await getAllImprovPackages();
  },

  /**
   * Retrieves a single ImprovPackage by its unique ID.
   */
  async getPackageById(id: string): Promise<ImprovPackage | null> {
    return await getImprovPackageById(id);
  },

  /**
   * Persists an ImprovPackage to both Firestore and LocalStorage.
   */
  async savePackage(pkg: ImprovPackage): Promise<void> {
    await saveImprovPackage(pkg);
  },

  /**
   * Deletes an ImprovPackage from Firestore and local stores.
   */
  async deletePackage(id: string): Promise<void> {
    await deleteImprovPackage(id);
  },

  /**
   * Exports an ImprovPackage into standard formatted Excel (.xlsx) binary buffer.
   */
  exportToExcel(pkg: ImprovPackage, customFilename?: string): Uint8Array {
    return exportImprovPackageToExcel(pkg, customFilename);
  },

  /**
   * Ingests and parses an Excel file (.xlsx) into an ImprovPackage domain model.
   */
  async parseFromExcel(
    fileOrBuffer: File | ArrayBuffer | Uint8Array,
    packageTitle?: string
  ): Promise<ImprovPackage> {
    return await parseImprovExcelFile(fileOrBuffer, packageTitle);
  },

  /**
   * Runs language integrity checks and sanitization across all hints in an ImprovPackage.
   */
  sanitizePackageLanguage(pkg: ImprovPackage): {
    package: ImprovPackage;
    fixedCount: number;
    issues: HintEvaluationResult[];
  } {
    return evaluateAndSanitizePackage(pkg);
  },

  /**
   * Algorithmically generates a high-quality ImprovPackage offline from curriculumRegistry or sample pools.
   */
  generateOfflineFallbackPackage(request: ImprovGenerateRequest): ImprovPackage {
    return generateOfflineFallbackPackage(request);
  }
};

export default improvApi;
