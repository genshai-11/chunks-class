# CHUNKS Improv API Reference & Integration Guide (`improvApi`)

The [`improvApi`](file:///C:/Users/gensh/Desktop/CHUNKS/PROJECT/chunks-class/src/api/improvApi.ts) gateway is the unified, headless-ready, type-safe API interface for the **CHUNKS Improv Studio** engine. It abstracts micro-batch LLM synthesis, dual-layer Firestore and LocalStorage synchronization, algorithmic offline package generation, Excel (.xlsx) ingestion and export, and Vietnamese/English language sanitization into a clean, zero-React programmatic contract.

---

## Table of Contents

1. [Executive Overview & Headless Architecture](#1-executive-overview--headless-architecture)
2. [Installation & Import Paths](#2-installation--import-paths)
   - [In-App / Frontend Component Usage](#in-app--frontend-component-usage)
   - [Headless / CLI / LMS Integration (Bun & Node.js)](#headless--cli--lms-integration-bun--nodejs)
3. [Core API Methods Reference (All 11 Methods)](#3-core-api-methods-reference-all-11-methods)
   - [`generatePackage`](#1-improvapigeneratepackagerequest-onprogress-signal)
   - [`generateSingleSession`](#2-improvapigeneratesinglesessionsessionconfig-options-signal)
   - [`testLlmConnection`](#3-improvapitestllmconnectionconfig-signal)
   - [`getAllPackages`](#4-improvapigetallpackages)
   - [`getPackageById`](#5-improvapigetpackagebyidid)
   - [`savePackage`](#6-improvapisavepackagepkg)
   - [`deletePackage`](#7-improvapideletepackageid)
   - [`exportToExcel`](#8-improvapiexporttoexcelpkg-customfilename)
   - [`parseFromExcel`](#9-improvapiparsefromexcelfileorbuffer-packagetitle)
   - [`sanitizePackageLanguage`](#10-improvapisanitizepackagelanguagepkg)
   - [`generateOfflineFallbackPackage`](#11-improvapigenerateofflinefallbackpackagerequest)
4. [Domain Models & Configuration Types](#4-domain-models--configuration-types)
   - [`ImprovGenerateRequest`](#improvgeneraterequest)
   - [`ImprovSessionConfig`](#improvsessionconfig)
   - [`ImprovLLMConfig`](#improvllmconfig)
   - [Package, Session, Item & Hint Contracts](#package-session-item--hint-contracts)
   - [Diagnostic & Progress Contracts](#diagnostic--progress-contracts)
5. [Practical Code Recipes](#5-practical-code-recipes)
   - [Recipe 1: 7-Session E-Commerce Package with Ladder Hint Distribution](#recipe-1-7-session-e-commerce-package-with-ladder-hint-distribution)
   - [Recipe 2: Generating a Single On-Demand Session for Live Classroom Drills](#recipe-2-generating-a-single-on-demand-session-for-live-classroom-drills)
   - [Recipe 3: Exporting a Firestore Package to an Excel (.xlsx) Binary](#recipe-3-exporting-a-firestore-package-to-an-excel-xlsx-binary)
   - [Recipe 4: Ingesting an Excel File & Persisting to Firestore](#recipe-4-ingesting-an-excel-file--persisting-to-firestore)
   - [Recipe 5: Zero-Network Offline Package Generation](#recipe-5-zero-network-offline-package-generation)
6. [Resilience & Fault-Tolerance Engine](#6-resilience--fault-tolerance-engine)
   - [Multi-Tier Google Gemini Fallback Chain](#multi-tier-google-gemini-fallback-chain)
   - [CORS Safety for Custom OpenAI Endpoints](#cors-safety-for-custom-openai-endpoints)
   - [Micro-Batching & Token Ceiling Protection](#micro-batching--token-ceiling-protection)
   - [Graceful Batch Degradation & Auto-Sanitization](#graceful-batch-degradation--auto-sanitization)
7. [Serverless HTTP REST API Endpoint (`/api/v1/improv/*`)](#7-serverless-http-rest-api-endpoint-apiv1improv)
   - [Cloud Functions v2 Serverless Architecture](#cloud-functions-v2-serverless-architecture)
   - [Unified Endpoints Matrix](#unified-endpoints-matrix)
   - [1. Health Check (`GET /health`)](#1-health-check-get-health)
   - [2. Generate Full Package (`POST /generate`)](#2-generate-full-package-post-generate)
   - [3. Generate Single Session (`POST /session`)](#3-generate-single-session-post-session)
   - [4. List All Packages (`GET /packages`)](#4-list-all-packages-get-packages)
   - [5. Get Package by ID (`GET /packages/:id`)](#5-get-package-by-id-get-packagesid)
   - [6. Persist Package (`POST /save`)](#6-persist-package-post-save)
   - [7. Delete Package (`DELETE /packages/:id`)](#7-delete-package-delete-packagesid)
   - [8. Export Excel Spreadsheet (`POST /export-excel`)](#8-export-excel-spreadsheet-post-export-excel)
   - [9. Ingest & Parse Excel Spreadsheet (`POST /parse-excel`)](#9-ingest--parse-excel-spreadsheet-post-parse-excel)
   - [10. Language Auto-Sanitization (`POST /sanitize`)](#10-language-auto-sanitization-post-sanitize)
   - [Client SDKs & Code Examples (cURL, Python, TypeScript)](#client-sdks--code-examples-curl-python-typescript)
8. [Xác Thực & Sử Dụng Service Account Gọi Cloud Run Trực Tiếp (GCP Service Account Authentication)](#8-xác-thực--sử-dụng-service-account-gọi-cloud-run-trực-tiếp-gcp-service-account-authentication)
   - [Tổng Quan Kiến Trúc Bảo Mật & Xác Thực OIDC](#81-tổng-quan-kiến-trúc-bảo-mật--xác-thực-oidc-iam-service-to-service)
   - [Thông Số Cấu Hình Hạ Tầng Cloud Run & Service Account](#82-thông-số-cấu-hình-hạ-tầng-cloud-run--service-account)
   - [Quản Lý Khóa Bí Mật An Toàn (`credentials/`)](#83-quản-lý-khóa-bí-mật-an-toàn-credentials)
   - [Code Recipes: Xác Thực OIDC ID Token & Gọi Cloud Run Trực Tiếp](#84-code-recipes-xác-thực-oidc-id-token--gọi-cloud-run-trực-tiếp)
     - [Recipe 1: TypeScript / Node.js (Chunks-LMS / Backend Microservices)](#recipe-1-typescript--nodejs-chunks-lms--backend-microservices)
     - [Recipe 2: Python Client (`google-auth` & `requests`)](#recipe-2-python-client-google-auth--requests)
     - [Recipe 3: cURL & Shell Scripts (PowerShell & Bash)](#recipe-3-curl--shell-scripts-powershell--bash)
     - [Recipe 4: Full End-to-End Package Generation & Fetching](#recipe-4-full-end-to-end-package-generation--fetching)

---

## 1. Executive Overview & Headless Architecture

**CHUNKS Improv** is an interactive, hint-based English speech reflex system. Learners deduce and produce complete communicative thoughts under time constraints using rapid-fire clue chunks (1–2 words per clue).

The [`improvApi`](file:///C:/Users/gensh/Desktop/CHUNKS/PROJECT/chunks-class/src/api/improvApi.ts) gateway isolates all pedagogical rules, LLM communications, data parsing, and persistence logic into a standalone, pure TypeScript module.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Consumers & Platforms                           │
│  ┌──────────────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │ Classroom React UI   │  │ External LMS    │  │ Headless Scripts  │  │
│  │ (ImprovManagerView)  │  │ (e.g. ChunksLMS)│  │ (Bun / Node / CI) │  │
│  └──────────┬───────────┘  └────────┬────────┘  └─────────┬─────────┘  │
└─────────────┼───────────────────────┼─────────────────────┼────────────┘
              │                       │                     │
              ▼                       ▼                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         improvApi Gateway                              │
│             (src/api/improvApi.ts • 11 Unified Methods)                │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       ▼                           ▼                           ▼
┌──────────────┐          ┌─────────────────┐         ┌─────────────────┐
│ LLM Engine   │          │ Storage Engine  │         │ Data Exchange   │
│ • Gemini 2.5 │          │ • Firestore     │         │ • SheetJS XLSX  │
│ • Fallback   │          │ • LocalStorage  │         │ • Diacritics    │
│ • Batching   │          │ • Registry Seed │         │   Sanitizer     │
└──────────────┘          └─────────────────┘         └─────────────────┘
```

### Key Architectural Advantages
- **Headless-Ready**: Decoupled from React hooks and component state. Can run in background batch scripts, CLI scrapers, and external microservices.
- **Strictly Typed**: Backed by canonical TypeScript interfaces (`ImprovPackage`, `ImprovSession`, `ImprovItem`, `ImprovHint`).
- **Resilient AI Pipeline**: Implements micro-batch chunking (5–6 items/batch) to bypass LLM output token limits, combined with an automatic 3-tier model fallback.
- **Fail-Safe Offline Mode**: Falls back to algorithmic generation using seeded curriculum pools whenever external APIs fail or are unreachable.

---

## 2. Installation & Import Paths

### In-App / Frontend Component Usage

Within the `chunks-class` codebase, import directly via path alias or relative import:

```typescript
// Via API barrel export (Recommended)
import { improvApi } from '@/api';

// Or via direct relative path
import { improvApi } from '../api/improvApi';
```

### Headless / CLI / LMS Integration (Bun & Node.js)

When invoking [`improvApi`](file:///C:/Users/gensh/Desktop/CHUNKS/PROJECT/chunks-class/src/api/improvApi.ts) in a backend server (e.g., Express, Fastify, Next.js route handlers) or standalone script via [Bun](https://bun.sh) or Node.js (v18+), ensure that the global `localStorage` interface is available for package caching:

```typescript
// headless-bootstrap.ts
// Ensure global localStorage exists for Node.js environments
if (typeof globalThis.localStorage === 'undefined') {
  const memoryStore = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string): string | null => memoryStore.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      memoryStore.set(key, String(value));
    },
    removeItem: (key: string): boolean => memoryStore.delete(key),
    clear: (): void => memoryStore.clear(),
    key: (index: number): string | null => Array.from(memoryStore.keys())[index] ?? null,
    get length(): number {
      return memoryStore.size;
    }
  } as Storage;
}

import { improvApi } from './src/api/improvApi';

async function run() {
  console.log('Testing connectivity...');
  const test = await improvApi.testLlmConnection({
    apiKey: process.env.GEMINI_API_KEY!,
    endpoint: 'https://generativelanguage.googleapis.com',
    model: 'gemini-2.5-flash',
    masterPrompt: '',
    temperature: 0.7,
    maxTokens: 8192
  });
  console.log('Connection test result:', test);
}

run();
```

---

## 3. Core API Methods Reference (All 11 Methods)

### 1. `improvApi.generatePackage(request, onProgress?, signal?)`

Generates an end-to-end multi-session [`ImprovPackage`](file:///C:/Users/gensh/Desktop/CHUNKS/PROJECT/chunks-class/src/types/improv.ts#L40) using intelligent micro-batching.

#### Signature
```typescript
async generatePackage(
  request: ImprovGenerateRequest,
  onProgress?: (
    current: number,
    total: number,
    message: string,
    detail?: ImprovGenerateProgressDetail
  ) => void,
  signal?: AbortSignal
): Promise<ImprovPackage>
```

#### Execution Lifecycle
1. **Curriculum Seed Harvesting**: Extracts seed vocabulary from specified `sourceLessonIds` or `sourceLevel` (Firestore first, falling back to `curriculumRegistry`).
2. **Micro-Batch Slicing**: Splits sessions with $> 8$ items into batches of 5–6 items to guarantee that Gemini/DeepSeek output token ceilings are never exceeded.
3. **Sequential Execution**: Issues structured JSON prompts per batch with dynamic temperature based on pedagogical `relevance`.
4. **Batch Error Shielding**: If a single batch fails, synthesizes fallback items for that batch without failing the entire generation job.
5. **Language Sanitization Gate**: Runs [`evaluateAndSanitizePackage`](file:///C:/Users/gensh/Desktop/CHUNKS/PROJECT/chunks-class/src/services/improvService.ts#L461) to correct any inverted English/Vietnamese fields or Vietnamese logic connectors.
6. **Dual-Store Persistence**: Automatically stores the finished package in Firestore collection `/improv_packages` and local cache.
7. **Total Failure Grace**: If all batches fail due to quota exhaustion or network disruption, triggers [`generateOfflineFallbackPackage`](file:///C:/Users/gensh/Desktop/CHUNKS/PROJECT/chunks-class/src/services/improvService.ts#L1513) and persists the result.

---

### 2. `improvApi.generateSingleSession(sessionConfig, options?, signal?)`

Generates an independent [`ImprovSession`](file:///C:/Users/gensh/Desktop/CHUNKS/PROJECT/chunks-class/src/types/improv.ts#L32) without creating or overwriting an entire package. Ideal for quick warm-ups, emergency classroom drills, or modular lesson builders.

#### Signature
```typescript
async generateSingleSession(
  sessionConfig: ImprovSessionConfig,
  options?: GenerateSingleSessionOptions,
  signal?: AbortSignal
): Promise<ImprovSession>
```

#### Parameters
- `sessionConfig`:
  - `sessionNumber: number`: Target session sequence number.
  - `title?: string`: Custom session label (e.g. `"Session 1: Fast Reflex Pairs"`).
  - `itemsCount: number`: Total reflex challenges to generate.
  - `hcTotal: number`: Number of hints per item (2, 3, or 4).
  - `hintTypes: string[]`: Functional roles for each hint.
- `options`: Optional directives (`topic`, `targetGrammar`, `conversationalTone`, `targetAudience`, `difficulty`, `relevance`, `seedChunks`, `llmConfig`).
- `signal`: Standard `AbortSignal` for cancellation.

> [!NOTE]
> Unlike `generatePackage`, `generateSingleSession` returns the in-memory session entity and does not automatically commit to Firestore, giving callers full control over assembly.

---

### 3. `improvApi.testLlmConnection(config, signal?)`

Performs an active round-trip test against the configured LLM endpoint (Google Gemini or OpenAI-compatible endpoint).

#### Signature
```typescript
async testLlmConnection(
  config: ImprovLLMConfig,
  signal?: AbortSignal
): Promise<LlmTestResult>
```

#### Return Value (`LlmTestResult`)
```typescript
interface LlmTestResult {
  success: boolean;   // True if the API accepted a minimal JSON request
  latencyMs: number; // Measured round-trip response time in milliseconds
  message: string;   // Diagnostic report or formatted error explanation
  model: string;     // Model name that handled the response
}
```

---

### 4. `improvApi.getAllPackages()`

Retrieves all Improv packages ordered by `updatedAt` descending.

#### Signature
```typescript
async getAllPackages(): Promise<ImprovPackage[]>
```

#### Storage Strategy
- Races a live Firestore read against a **2500ms timeout**.
- Filters out packages previously deleted by the user (`chunks_improv_deleted_packages`).
- Ensures default canonical packages (`IMPROV_SET_01` and `IMPROV_SET_02`) are injected if not explicitly deleted.
- Backs up retrieved packages to LocalStorage (`chunks_improv_packages_local`).
- If Firestore is offline or times out, seamlessly returns the local cache.

---

### 5. `improvApi.getPackageById(id)`

Retrieves a single package by its ID string.

#### Signature
```typescript
async getPackageById(id: string): Promise<ImprovPackage | null>
```

#### Resolution Priority
1. Firestore document: `/improv_packages/{id}`
2. LocalStorage cache: `chunks_improv_packages_local`
3. Built-in system presets: `DEFAULT_IMPROV_PACKAGES`
4. Returns `null` if not found.

---

### 6. `improvApi.savePackage(pkg)`

Persists an [`ImprovPackage`](file:///C:/Users/gensh/Desktop/CHUNKS/PROJECT/chunks-class/src/types/improv.ts#L40) across both cloud and client stores.

#### Signature
```typescript
async savePackage(pkg: ImprovPackage): Promise<void>
```

#### Characteristics
- Automatically updates `updatedAt` with the current ISO timestamp (`new Date().toISOString()`).
- Writes to Firestore with `{ merge: true }`.
- Updates the local cache in `localStorage`.

---

### 7. `improvApi.deletePackage(id)`

Permanently removes a package from cloud storage and marks it as deleted locally.

#### Signature
```typescript
async deletePackage(id: string): Promise<void>
```

#### Behavior
- Records `id` in the local deletion register (`chunks_improv_deleted_packages`) so default preset injectors will not restore it on next boot.
- Deletes the document `/improv_packages/{id}` in Firestore.
- Purges the item from `localStorage`.

---

### 8. `improvApi.exportToExcel(pkg, customFilename?)`

Serializes an [`ImprovPackage`](file:///C:/Users/gensh/Desktop/CHUNKS/PROJECT/chunks-class/src/types/improv.ts#L40) into the standard CHUNKS Excel format (.xlsx).

#### Signature
```typescript
exportToExcel(pkg: ImprovPackage, customFilename?: string): Uint8Array
```

#### Output Structure
- **Row 1**: `Presentation — {Package Title}`
- **Row 2**: Pedagogical instruction & formatting notice
- **Row 3 (Header)**: `Session`, `Item`, `hc-total`, `hint-1`..`hint-N`, `hint-1-translation`..`hint-N-translation`, `hint-1-type / function`..`hint-N-type / function`
- **Data Rows**: Contiguous items with all hints aligned to respective column sets.

> [!TIP]
> When called in a web browser environment, this method automatically triggers the native browser file download prompt. It also returns the `Uint8Array` binary buffer for server-side saving.

---

### 9. `improvApi.parseFromExcel(fileOrBuffer, packageTitle?)`

Ingests an Excel file (`File`, `ArrayBuffer`, or `Uint8Array`) and converts it into a strongly-typed [`ImprovPackage`](file:///C:/Users/gensh/Desktop/CHUNKS/PROJECT/chunks-class/src/types/improv.ts#L40).

#### Signature
```typescript
async parseFromExcel(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  packageTitle?: string
): Promise<ImprovPackage>
```

#### Parsing Intelligence
- Dynamically scans for header rows containing `Session`, `Item`, or `hc-total` regardless of pre-header title rows.
- Extracts package title and descriptions from banner rows above the header.
- Maps hint columns (`hint-1`, `hint-2`, ...) and their respective translations and function descriptors.
- Generates unique, stable entity IDs for sessions, items, and hints.

---

### 10. `improvApi.sanitizePackageLanguage(pkg)`

Executes a non-destructive audit and repair across every hint in the package, verifying strict language boundary integrity.

#### Signature
```typescript
sanitizePackageLanguage(pkg: ImprovPackage): {
  package: ImprovPackage;
  fixedCount: number;
  issues: HintEvaluationResult[];
}
```

#### Evaluation Rules
| Detection Scenario | Root Cause | Automatic Action Taken |
| :--- | :--- | :--- |
| `text` has Vietnamese diacritics; `translation` does not | Swapped fields by LLM | Inverts `text` and `translation`. |
| `text` has Vietnamese logic phrase (e.g. `"nếu không"`) | Language confusion | Replaces with English equivalent (`"otherwise"`). |
| `text` is English logic word; `translation` is English logic word | Duplicate string | Translates `translation` to Vietnamese (`"otherwise"` $\rightarrow$ `"nếu không"`). |
| `translation` has English logic word | Missing translation | Translates to Vietnamese via `EN_TO_VI_LOGIC_MAP`. |

---

### 11. `improvApi.generateOfflineFallbackPackage(request)`

Synchronous, zero-network algorithmic generator that builds a production-grade [`ImprovPackage`](file:///C:/Users/gensh/Desktop/CHUNKS/PROJECT/chunks-class/src/types/improv.ts#L40) using pre-indexed curriculum chunk pools and curated vocabulary sets.

#### Signature
```typescript
generateOfflineFallbackPackage(request: ImprovGenerateRequest): ImprovPackage
```

#### Characteristics
- **Zero API Quota / Zero Cost**: $0.00 / 0ms latency.
- **Curriculum Awareness**: Inspects `curriculumRegistry` for lessons specified in `sourceLessonIds` or `sourceLevel`.
- **Pedagogical Safety**: Strictly enforces CEFR A1-A2 ceiling when `difficulty: 'EASY'`, avoiding C1 vocabulary.

---

## 4. Domain Models & Configuration Types

All contracts are defined in [`src/types/improv.ts`](file:///C:/Users/gensh/Desktop/CHUNKS/PROJECT/chunks-class/src/types/improv.ts).

### `ImprovGenerateRequest`

The comprehensive input schema required for package generation:

```typescript
export interface ImprovGenerateRequest {
  // Metadata
  packageTitle: string;
  packageDescription?: string;
  totalItems: number;
  sessionsCount?: number;

  // Session Breakdown
  sessionsConfig: ImprovSessionConfig[];

  // Curriculum Linkage
  sourceLevel: CourseLevel | 'ALL';      // 'LEVEL_A' | 'LEVEL_B_ERES' | 'LEVEL_B_EREL' | 'CUSTOM' | 'ALL'
  sourceLessonIds: string[];             // e.g. ['b_eres_d01', 'b_eres_d02']
  selectedVocabIds?: string[];           // Prioritized seed chunk IDs

  // Pedagogical Controls
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | string;
  relevance: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  topic?: string;                        // Situational focus (e.g. "Airport Navigation")
  targetGrammar?: string;                // e.g. "Third Conditional, Reported Speech"
  pedagogicalNotes?: string;             // Custom instructions to LLM
  conversationalTone?: string;           // e.g. "Casual & Friendly", "Formal Business"
  targetAudience?: string;               // e.g. "Adult Working Professionals"

  // AI Runtime Configuration
  llmConfig: ImprovLLMConfig;
}
```

### `ImprovSessionConfig`

Defines the structure and hint ladder for an individual session:

```typescript
export interface ImprovSessionConfig {
  sessionNumber: number;   // 1-indexed session number
  title?: string;          // Descriptive title
  itemsCount: number;      // Quantity of items in this session
  hcTotal: number;         // Hints count per item (2, 3, or 4)
  hintTypes: string[];     // Array of hint functions matching hcTotal
}
```

### `ImprovLLMConfig`

Defines endpoint parameters and AI model settings:

```typescript
export type ImprovLlmProvider = 'GOOGLE_GENAI' | 'CUSTOM_OPENAI';

export interface ImprovLLMConfig {
  provider?: ImprovLlmProvider; // Defaults to 'GOOGLE_GENAI'
  endpoint: string;             // 'https://generativelanguage.googleapis.com'
  apiKey: string;               // Gemini or OpenAI API Key
  model: string;                // 'gemini-2.5-flash', 'gemini-2.0-flash', etc.
  masterPrompt: string;         // System prompt overriding defaults
  temperature: number;          // 0.0 to 1.0 (Auto-tuned by relevance if default)
  maxTokens: number;            // Token limit (typically 8192 or 16384)
  webClientId?: string;         // Optional OAuth client ID
}
```

### Package, Session, Item & Hint Contracts

```typescript
export interface ImprovHint {
  id: string;             // e.g. 'h_1_1_1'
  text: string;           // Clue text in 100% English (1-2 words)
  translation: string;    // Vietnamese meaning (Be Vietnam Pro safe)
  typeFunction: string;   // e.g. 'Keyword · Cụm phản xạ', 'Ending · Kết quả'
  itemIndex: number;      // 1-indexed hint position within item
  audioUrl?: string;      // Optional pre-rendered GCS/TTS audio URL
  audioUrlVi?: string;    // Optional pre-rendered Vietnamese audio URL
}

export interface ImprovItem {
  id: string;
  itemNumber: number;     // 1-indexed sequence within session
  sessionNumber: number;  // Parent session number
  hcTotal: number;        // Total hints in this item
  hints: ImprovHint[];    // Array of hints (length == hcTotal)
  audioUrl?: string;      // Continuous stitched item audio
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
  sourceCourseLevel?: string;
  sourceLessonIds?: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Diagnostic & Progress Contracts

```typescript
export interface ImprovBatchGenerationStatus {
  batchIndex: number;
  totalBatches: number;
  sessionNumber: number;
  itemsRange: string;
  count: number;
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
```

---

## 5. Practical Code Recipes

### Recipe 1: 7-Session E-Commerce Package with Ladder Hint Distribution

This recipe creates a 21-item package across 7 sessions demonstrating the standard **CHUNKS Ladder Progression**:
- Sessions 1, 4: 2 Hints (`[Keyword, Ending]`)
- Sessions 2, 5: 3 Hints (`[Keyword, Logic word, Ending]`)
- Sessions 3, 6, 7: 4 Hints (`[Keyword, Logic word, Fancy word, Ending]`)

```typescript
import { improvApi } from '@/api';
import { ImprovGenerateRequest } from '@/types';

async function generateEcommercePackage() {
  const request: ImprovGenerateRequest = {
    packageTitle: 'Cross-Border E-Commerce & Supplier Negotiation',
    packageDescription: 'Reflex speech chunks for vendor negotiation, pricing disputes, and freight handling.',
    totalItems: 21,
    sourceLevel: 'LEVEL_B_ERES',
    sourceLessonIds: [],
    difficulty: 'HARD',      // B2-C1 idiomatic English
    relevance: 'HIGH',       // Tight contextual cohesion
    topic: 'International Logistics & Supply Chain Escalations',
    targetGrammar: 'Concessive clauses (even though, nevertheless) & Mixed Conditionals',
    conversationalTone: 'Firm, Professional, and Persuasive',
    targetAudience: 'Global Sourcing Specialists & Import-Export Managers',
    pedagogicalNotes: 'Focus on polite pushbacks, MOQ negotiations, and shipping delay resolutions.',
    
    // Ladder Distribution: [2, 3, 4, 2, 3, 4, 4] hints per item
    sessionsConfig: [
      {
        sessionNumber: 1,
        title: 'Session 1: Fast Reflex Pairs',
        itemsCount: 3,
        hcTotal: 2,
        hintTypes: ['Keyword · Cụm phản xạ', 'Ending · Kết quả']
      },
      {
        sessionNumber: 2,
        title: 'Session 2: Three-Way Transitions',
        itemsCount: 3,
        hcTotal: 3,
        hintTypes: ['Keyword · Cụm phản xạ', 'Logic word · Từ nối', 'Ending · Kết quả']
      },
      {
        sessionNumber: 3,
        title: 'Session 3: Extended Reflex Quads',
        itemsCount: 3,
        hcTotal: 4,
        hintTypes: ['Keyword · Cụm phản xạ', 'Logic word · Từ nối', 'Fancy word · Ẩn dụ', 'Ending · Kết quả']
      },
      {
        sessionNumber: 4,
        title: 'Session 4: Second-Round Fast Reflexes',
        itemsCount: 3,
        hcTotal: 2,
        hintTypes: ['Keyword · Cụm phản xạ', 'Ending · Kết quả']
      },
      {
        sessionNumber: 5,
        title: 'Session 5: Logic Deepening',
        itemsCount: 3,
        hcTotal: 3,
        hintTypes: ['Keyword · Cụm phản xạ', 'Logic word · Từ nối', 'Ending · Kết quả']
      },
      {
        sessionNumber: 6,
        title: 'Session 6: Advanced Reflex Quads',
        itemsCount: 3,
        hcTotal: 4,
        hintTypes: ['Keyword · Cụm phản xạ', 'Logic word · Từ nối', 'Fancy word · Ẩn dụ', 'Ending · Kết quả']
      },
      {
        sessionNumber: 7,
        title: 'Session 7: Mastery Synthesis',
        itemsCount: 3,
        hcTotal: 4,
        hintTypes: ['Keyword · Cụm phản xạ', 'Logic word · Từ nối', 'Fancy word · Ẩn dụ', 'Ending · Kết quả']
      }
    ],

    llmConfig: {
      provider: 'GOOGLE_GENAI',
      endpoint: 'https://generativelanguage.googleapis.com',
      apiKey: process.env.VITE_GEMINI_API_KEY || '',
      model: 'gemini-2.5-flash',
      masterPrompt: '', // Defaults to DEFAULT_IMPROV_MASTER_PROMPT
      temperature: 0.7,
      maxTokens: 8192
    }
  };

  const controller = new AbortController();

  try {
    const pkg = await improvApi.generatePackage(
      request,
      (current, total, message, detail) => {
        console.log(`[${current}%] ${message}`);
        if (detail) {
          console.log(`Batches: ${detail.successBatches} success, ${detail.failedBatches} failed.`);
        }
      },
      controller.signal
    );

    console.log('Successfully generated package:', pkg.id, pkg.title);
    return pkg;
  } catch (error) {
    console.error('Package generation failed:', error);
  }
}
```

---

### Recipe 2: Generating a Single On-Demand Session for Live Classroom Drills

When a teacher wants a fast 5-item drill without generating a whole course package:

```typescript
import { improvApi } from '@/api';
import { ImprovSessionConfig, GenerateSingleSessionOptions } from '@/types';

async function createWarmupSession() {
  const sessionConfig: ImprovSessionConfig = {
    sessionNumber: 1,
    title: 'Warm-up: Workplace Disagreements',
    itemsCount: 5,
    hcTotal: 3,
    hintTypes: ['Keyword · Khởi động', 'Logic word · Từ nối', 'Ending · Giải pháp']
  };

  const options: GenerateSingleSessionOptions = {
    difficulty: 'MEDIUM',
    relevance: 'MEDIUM',
    topic: 'Giving constructive feedback without offending colleagues',
    conversationalTone: 'Diplomatic & Candid',
    targetAudience: 'Working Professionals'
  };

  const session = await improvApi.generateSingleSession(sessionConfig, options);

  session.items.forEach(item => {
    console.log(`\nItem #${item.itemNumber}:`);
    item.hints.forEach(h => {
      console.log(`  [${h.typeFunction}] ${h.text} -> ${h.translation}`);
    });
  });

  return session;
}
```

---

### Recipe 3: Exporting a Firestore Package to an Excel (.xlsx) Binary

Retrieve a package from Firestore by ID and write it to disk (Node.js/Bun) or trigger browser download:

```typescript
import fs from 'node:fs';
import { improvApi } from '@/api';

async function exportPackageToFile(packageId: string, outputFilePath: string) {
  // 1. Fetch package from Firestore
  const pkg = await improvApi.getPackageById(packageId);
  if (!pkg) {
    throw new Error(`Package with ID "${packageId}" not found.`);
  }

  // 2. Export to Uint8Array binary
  const excelBuffer = improvApi.exportToExcel(pkg);

  // 3. Write to local file system (Node/Bun)
  fs.writeFileSync(outputFilePath, Buffer.from(excelBuffer));
  console.log(`Exported "${pkg.title}" (${pkg.totalItems} items) to ${outputFilePath}`);
}
```

---

### Recipe 4: Ingesting an Excel File & Persisting to Firestore

Ingest an Excel file uploaded via `<input type="file">`, sanitize any linguistic defects, and commit to Firestore:

```typescript
import { improvApi } from '@/api';

async function handleExcelUpload(file: File) {
  // 1. Parse Excel into domain model
  const rawPackage = await improvApi.parseFromExcel(file, 'Imported Classroom Package');

  // 2. Run quality control audit & sanitization
  const { package: cleanPackage, fixedCount, issues } = improvApi.sanitizePackageLanguage(rawPackage);

  if (fixedCount > 0) {
    console.warn(`Auto-repaired ${fixedCount} language issues during ingestion:`, issues);
  }

  // 3. Save to Firestore and LocalStorage
  await improvApi.savePackage(cleanPackage);

  console.log(`Package "${cleanPackage.title}" (${cleanPackage.id}) successfully synced to Firestore!`);
  return cleanPackage;
}
```

---

### Recipe 5: Zero-Network Offline Package Generation

Generate a complete, pedagogical-grade package with 0 network calls:

```typescript
import { improvApi } from '@/api';
import { ImprovGenerateRequest } from '@/types';

function createOfflineClassroomPackage() {
  const request: ImprovGenerateRequest = {
    packageTitle: 'Foundations of Spoken English (Offline Mode)',
    packageDescription: 'Locally generated starter package without internet connectivity.',
    totalItems: 8,
    sourceLevel: 'LEVEL_A',
    sourceLessonIds: [],
    difficulty: 'EASY',
    relevance: 'HIGH',
    sessionsConfig: [
      {
        sessionNumber: 1,
        title: 'Session 1: High Frequency Daily Chunks',
        itemsCount: 4,
        hcTotal: 2,
        hintTypes: ['Keyword · Từ khóa', 'Ending · Kết quả']
      },
      {
        sessionNumber: 2,
        title: 'Session 2: Connected Thoughts',
        itemsCount: 4,
        hcTotal: 3,
        hintTypes: ['Keyword · Từ khóa', 'Logic word · Từ nối', 'Ending · Kết quả']
      }
    ],
    llmConfig: {
      endpoint: '',
      apiKey: '',
      model: '',
      masterPrompt: '',
      temperature: 0.7,
      maxTokens: 4000
    }
  };

  // Immediate synchronous execution
  const pkg = improvApi.generateOfflineFallbackPackage(request);

  console.log(`Generated offline package in 0ms: ${pkg.title}`);
  console.log(`Sessions count: ${pkg.sessions.length}, Total items: ${pkg.totalItems}`);

  return pkg;
}
```

---

## 6. Resilience & Fault-Tolerance Engine

The Improv service is engineered for zero-crash classroom reliability. It deploys multiple layers of defensiveness:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        User Request / Trigger                          │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │  Micro-Batching Planner       │
                   │  (Splits items into batches   │
                   │   of 5-6 to avoid MAX_TOKENS) │
                   └───────────────┬───────────────┘
                                   │
                                   ▼
                 ┌───────────────────────────────────┐
                 │ Google Gemini Multi-Tier Chain    │
                 │ 1. gemini-2.5-flash               │
                 │    └─ [400/404/429/503] ─────────┐│
                 │ 2. gemini-2.0-flash              ││
                 │    └─ [Network/RateLimit] ───────┼┤
                 │ 3. gemini-1.5-flash              ││
                 └─────────────────┬─────────────────┘│
                                   │ (All models fail)│
                                   │                  │
                                   ▼                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  synthesizeFallbackBatchItems /                        │
│                 generateOfflineFallbackPackage                         │
│  (Sources seed chunks from curriculumRegistry + Curated CEFR pools)    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  Language Sanitization Gate                            │
│  (evaluateAndSanitizePackage swaps inverted EN/VI hints & connectors)  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                Dual Store: Firestore + LocalStorage                    │
└────────────────────────────────────────────────────────────────────────┘
```

### Multi-Tier Google Gemini Fallback Chain

When generating via Google Gemini (`GOOGLE_GENAI`), the service configures a primary model and an automatic failover chain:

$$\text{Primary: } \texttt{gemini-2.5-flash} \longrightarrow \text{Fallback 1: } \texttt{gemini-2.0-flash} \longrightarrow \text{Fallback 2: } \texttt{gemini-1.5-flash}$$

1. **Thinking Budget Negotiation**: For `gemini-2.5-flash` and `gemini-2.0-flash`, `thinkingConfig: { thinkingBudget: 0 }` is enabled to eliminate latency overhead. If an older model rejects `thinkingConfig` with a `400 Bad Request`, the service catches the error and retries without `thinkingConfig`.
2. **Dynamic Error Recovery**: If an endpoint returns `404 Not Found`, `429 Too Many Requests` (Quota exhausted), or `503 Service Unavailable`, the request is re-dispatched to the next model in the chain.

### CORS Safety for Custom OpenAI Endpoints

Browsers block direct client-side fetch calls to `https://api.openai.com/v1/chat/completions` due to strict Cross-Origin Resource Sharing (CORS) rules.

[`improvApi`](file:///C:/Users/gensh/Desktop/CHUNKS/PROJECT/chunks-class/src/api/improvApi.ts) intercepts calls targeting `api.openai.com` before sending and throws a descriptive, user-friendly exception:

```text
Trình duyệt chặn kết nối trực tiếp đến api.openai.com do chính sách CORS.
Vui lòng sử dụng một CORS proxy server (ví dụ Cloudflare Worker) hoặc chuyển sang dùng Google Gemini.
```

To use custom models like DeepSeek, Qwen, or OpenAI in the browser, pass an authorized reverse proxy endpoint (e.g., `https://my-proxy.workers.dev/v1`).

### Micro-Batching & Token Ceiling Protection

Large JSON outputs frequently get truncated when LLMs hit `maxOutputTokens`, causing JSON syntax errors.
- **Threshold**: Any session requiring $> 8$ items is automatically partitioned into batches of 5–6 items.
- **Progress Tracking**: Real-time progress updates are reported through the `onProgress` callback with `ImprovGenerateProgressDetail`.

### Graceful Batch Degradation & Auto-Sanitization

1. **Batch Isolation**: If Batch 2 of 4 fails due to a network glitch, only Batch 2 uses seed synthesis (`synthesizeFallbackBatchItems`). Batches 1, 3, and 4 retain their full AI output.
2. **Total Fallback**: If 100% of batches fail, the system automatically synthesizes a full package via [`generateOfflineFallbackPackage`](file:///C:/Users/gensh/Desktop/CHUNKS/PROJECT/chunks-class/src/services/improvService.ts#L1513).
3. **Typography & Diacritics Safety**: Every generated hint passes through `evaluateAndSanitizeHint`. Vietnamese translations are verified against Latin Extended diacritics, ensuring 100% compatibility with `Be Vietnam Pro` font rendering.

---

## 7. Serverless HTTP REST API Endpoint (`/api/v1/improv/*`)

The **CHUNKS Improv Serverless REST API v2** exposes the complete `improvApi` pedagogical and synchronization engine over high-performance HTTP endpoints powered by **Google Cloud Functions v2** (Node.js 22, 512MiB, 300s timeout) and rewritten cleanly through **Firebase Hosting** under `/api/v1/improv/**`.

### Cloud Functions v2 Serverless Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        External Clients & Services                     │
│    cURL / Postman      Python Automation Scripts      LMS / Mobile App │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         HTTP/2 HTTPS Requests
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              Firebase Hosting Multi-Site Edge Proxy                    │
│                 https://chunks-classroom.web.app                       │
│                     Rewrite rule: /api/v1/improv/**                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               Cloud Functions v2 (improvApiEndpoint)                   │
│       Region: asia-east1 • Memory: 512MiB • Timeout: 300s              │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ • Route Normalizer & CORS Handler                              │   │
│   │ • Multi-tier Gemini REST Engine (2.5 -> 2.0 -> 1.5)            │   │
│   │ • Micro-Batching & Token Safety Coordinator                    │   │
│   │ • Zero-Fail Offline Algorithmic Fallback                       │   │
│   │ • Firebase Admin Firestore SDK (Sub-millisecond Server Auth)   │   │
│   │ • SheetJS Server-Side Streaming (.xlsx Ingestion / Export)     │   │
│   │ • Vietnamese Diacritics & Connectors Auto-Sanitizer            │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Unified Endpoints Matrix

| HTTP Verb | Path | Description | Payload / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/improv/health` | Health & service readiness check | None | `{ status: 'ok', service: ..., timestamp: ... }` |
| `POST` | `/api/v1/improv/generate` | Generates full AI reflex package | `ImprovGenerateRequest` (JSON), `?save=true` | `{ success: true, data: ImprovPackage }` |
| `POST` | `/api/v1/improv/session` | Generates single on-demand session | `{ sessionConfig, options }` (JSON) | `{ success: true, data: ImprovSession }` |
| `GET` | `/api/v1/improv/packages` | Lists all Firestore packages | None | `{ success: true, count, data: ImprovPackage[] }` |
| `GET` | `/api/v1/improv/packages/:id` | Retrieves package by ID | `:id` path param | `{ success: true, data: ImprovPackage }` or 404 |
| `POST` | `/api/v1/improv/save` | Direct server-side package persistence | `ImprovPackage` (JSON) | `{ success: true, id: string }` |
| `DELETE` | `/api/v1/improv/packages/:id` | Deletes package from Firestore | `:id` path param | `{ success: true, message: string }` |
| `POST` | `/api/v1/improv/export-excel` | Exports package as standard XLSX binary | `pkg` (JSON in body) or `?id=<packageId>` | `Content-Type: application/vnd.openxmlformats...` |
| `POST` | `/api/v1/improv/parse-excel` | Ingests XLSX into structured package | Binary file buffer or `{ fileBase64, title }` | `{ success: true, data: ImprovPackage }` |
| `POST` | `/api/v1/improv/sanitize` | Cleans Vietnamese/English inversions | `ImprovPackage` (JSON) | `{ success: true, fixedCount, data, issues }` |

---

### Detailed Endpoint Specifications

#### 1. Health Check (`GET /health`)
Verifies endpoint availability and current server timestamp.
- **URL**: `https://chunks-classroom.web.app/api/v1/improv/health`
- **Method**: `GET`
- **Response**:
```json
{
  "status": "ok",
  "service": "CHUNKS Improv Serverless API v2",
  "region": "asia-east1",
  "timestamp": "2026-09-24T00:15:00.000Z"
}
```

#### 2. Generate Full Package (`POST /generate`)
Accepts an `ImprovGenerateRequest`. Automatically orchestrates micro-batching across sessions, applies multi-tier Gemini fallback, auto-sanitizes typography, and optionally persists directly to Firestore when `?save=true` is passed.
- **URL**: `https://chunks-classroom.web.app/api/v1/improv/generate?save=true`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body Example**:
```json
{
  "packageTitle": "Workplace Collocations",
  "totalItems": 10,
  "difficulty": "Medium (B1)",
  "relevance": "High",
  "sourceLevel": "LEVEL_B_ERES",
  "sourceLessonIds": [],
  "topic": "Office Team Meeting",
  "sessionsConfig": [
    {
      "sessionNumber": 1,
      "title": "Session 1: Fast Reflexes",
      "hcTotal": 2,
      "hintTypes": ["Keyword", "Ending"],
      "itemsCount": 5
    },
    {
      "sessionNumber": 2,
      "title": "Session 2: Logic Transitions",
      "hcTotal": 3,
      "hintTypes": ["Keyword", "Từ nối", "Ending"],
      "itemsCount": 5
    }
  ]
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "pkg_improv_1727136000000_abc123",
    "title": "Workplace Collocations",
    "totalItems": 10,
    "sessionsCount": 2,
    "sessions": [...]
  }
}
```

#### 3. Generate Single Session (`POST /session`)
Generates an isolated `ImprovSession` for real-time classroom drills.
- **URL**: `https://chunks-classroom.web.app/api/v1/improv/session`
- **Method**: `POST`
- **Body Example**:
```json
{
  "sessionConfig": {
    "sessionNumber": 1,
    "title": "Quick Drill",
    "hcTotal": 2,
    "hintTypes": ["Keyword", "Ending"],
    "itemsCount": 5
  },
  "options": {
    "difficulty": "Easy (A1-A2)",
    "relevance": "High",
    "topic": "Daily Routine"
  }
}
```

#### 4. List All Packages (`GET /packages`)
Returns all saved packages in Firestore, sorted by `updatedAt` descending.
- **URL**: `https://chunks-classroom.web.app/api/v1/improv/packages`
- **Method**: `GET`
- **Response**:
```json
{
  "success": true,
  "count": 5,
  "data": [ ... ]
}
```

#### 5. Get Package by ID (`GET /packages/:id`)
- **URL**: `https://chunks-classroom.web.app/api/v1/improv/packages/pkg_improv_123`
- **Method**: `GET`
- **Response (200)**: `{ "success": true, "data": { ... } }`
- **Response (404)**: `{ "success": false, "error": "Package with ID \"pkg_improv_123\" not found." }`

#### 6. Persist Package (`POST /save`)
Saves or updates an `ImprovPackage` directly in Firestore using server-authenticated credentials.
- **URL**: `https://chunks-classroom.web.app/api/v1/improv/save`
- **Method**: `POST`
- **Body**: Complete `ImprovPackage` JSON.

#### 7. Delete Package (`DELETE /packages/:id`)
Deletes an `ImprovPackage` from Firestore.
- **URL**: `https://chunks-classroom.web.app/api/v1/improv/packages/pkg_improv_123`
- **Method**: `DELETE`

#### 8. Export Excel Spreadsheet (`POST /export-excel`)
Generates a downloadable `.xlsx` binary stream. Accepts either a full `pkg` object in the JSON body, or a query parameter `?id=<packageId>` to export a package existing in Firestore.
- **URL**: `https://chunks-classroom.web.app/api/v1/improv/export-excel?id=pkg_improv_123`
- **Method**: `POST`
- **Response Headers**:
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="Workplace_Collocations_Improv.xlsx"`

#### 9. Ingest & Parse Excel Spreadsheet (`POST /parse-excel`)
Parses an Excel spreadsheet binary buffer or base64 string into a validated `ImprovPackage`.
- **URL**: `https://chunks-classroom.web.app/api/v1/improv/parse-excel`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body Example**:
```json
{
  "fileBase64": "UEsDBBQAAAAIA...",
  "packageTitle": "Imported Package"
}
```

#### 10. Language Auto-Sanitization (`POST /sanitize`)
Audits all hints in a package, fixing inverted English/Vietnamese fields, translating connectors, and repairing identical values.
- **URL**: `https://chunks-classroom.web.app/api/v1/improv/sanitize`
- **Method**: `POST`
- **Body**: Complete `ImprovPackage` JSON.
- **Response**: `{ "success": true, "fixedCount": 2, "data": { ... }, "issues": [ ... ] }`

---

### Client SDKs & Code Examples (cURL, Python, TypeScript)

#### Example 1: cURL

```bash
# 1. Health check
curl -X GET "https://chunks-classroom.web.app/api/v1/improv/health"

# 2. Generate a package and persist to Firestore
curl -X POST "https://chunks-classroom.web.app/api/v1/improv/generate?save=true" \
  -H "Content-Type: application/json" \
  -d '{
    "packageTitle": "Speaking Reflexes Unit 1",
    "totalItems": 6,
    "difficulty": "Easy (A1-A2)",
    "relevance": "High",
    "sourceLevel": "LEVEL_A",
    "sourceLessonIds": [],
    "sessionsConfig": [
      {
        "sessionNumber": 1,
        "title": "Two-Word Pairs",
        "hcTotal": 2,
        "hintTypes": ["Keyword", "Ending"],
        "itemsCount": 6
      }
    ]
  }'

# 3. Download as Excel spreadsheet (.xlsx)
curl -X POST "https://chunks-classroom.web.app/api/v1/improv/export-excel?id=pkg_improv_123" \
  -o "Package_Export.xlsx"
```

#### Example 2: Python (`requests`)

```python
import requests

BASE_URL = "https://chunks-classroom.web.app/api/v1/improv"

# 1. Generate package
payload = {
    "packageTitle": "Business English Reflexes",
    "totalItems": 8,
    "difficulty": "Medium (B1)",
    "relevance": "High",
    "sourceLevel": "LEVEL_B_ERES",
    "sourceLessonIds": [],
    "topic": "Client Negotiation",
    "sessionsConfig": [
        {
            "sessionNumber": 1,
            "title": "Key Connectors",
            "hcTotal": 3,
            "hintTypes": ["Keyword", "Logic word", "Ending"],
            "itemsCount": 8
        }
    ]
}

res = requests.post(f"{BASE_URL}/generate?save=true", json=payload)
data = res.json()
print("Generated Package ID:", data["data"]["id"])
package_id = data["data"]["id"]

# 2. Export to Excel file
excel_res = requests.post(f"{BASE_URL}/export-excel?id={package_id}")
with open("Business_English.xlsx", "wb") as f:
    f.write(excel_res.content)
print("Saved Business_English.xlsx successfully!")
```

#### Example 3: TypeScript / JavaScript (`fetch`)

```typescript
const BASE_URL = 'https://chunks-classroom.web.app/api/v1/improv';

// 1. Fetch all packages
async function listPackages() {
  const res = await fetch(`${BASE_URL}/packages`);
  const { data } = await res.json();
  console.log(`Retrieved ${data.length} packages.`);
  return data;
}

// 2. Generate on-demand session
async function createQuickDrill() {
  const res = await fetch(`${BASE_URL}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionConfig: {
        sessionNumber: 1,
        title: 'Emergency Drill',
        hcTotal: 2,
        hintTypes: ['Keyword', 'Ending'],
        itemsCount: 5
      },
      options: {
        difficulty: 'Easy (A1-A2)',
        relevance: 'High',
        topic: 'Coffee Shop Ordering'
      }
    })
  });

  const { data: session } = await res.json();
  console.log('Session generated:', session.title, session.items.length, 'items');
  return session;
}
```

---

## 8. Xác Thực & Sử Dụng Service Account Gọi Cloud Run Trực Tiếp (GCP Service Account Authentication)

Mục này hướng dẫn chi tiết cách cấu hình và sử dụng **Google Cloud Service Account** để xác thực OpenID Connect (OIDC) ID Token khi gọi trực tiếp endpoint **Cloud Run** (`https://improvapiendpoint-n4trgixj6q-de.a.run.app`) mà không cần thông qua Firebase Hosting rewrite proxy.

Giải pháp này được thiết kế chuyên biệt cho:
- **Backend-to-Backend & Headless LMS Integration**: Kết nối từ Chunks-LMS, backend microservices, cron pipelines hoặc CI/CD runners.
- **Bảo Mật Zero-Trust IAM**: Giới hạn quyền gọi API bằng vai trò Cloud Run Invoker (`roles/run.invoker`), loại bỏ hoàn toàn rủi ro lộ public endpoint không xác thực.
- **Tốc Độ Tối Ưu**: Gọi trực tiếp đến vùng `asia-east1` (Taiwan), giảm thiểu độ trễ mạng và loại bỏ tầng trung gian reverse-proxy.

---

### 8.1 Tổng Quan Kiến Trúc Bảo Mật & Xác Thực OIDC (IAM Service-to-Service)

Google Cloud Run sử dụng giao thức chuẩn **OpenID Connect (OIDC)** để xác thực giữa các service (Service-to-Service Authentication).

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             Client Machine / Backend                             │
│                                                                                  │
│   1. Đọc key JSON: credentials/chunks-cloudrun-service-account.json              │
│   2. Ký JWT Assertion với Private Key của Service Account                       │
│   3. Gửi JWT đến Google OAuth2 Endpoint (https://oauth2.googleapis.com/token)    │
│   4. Nhận Google-signed OIDC ID Token (Audience = Cloud Run URL)                 │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                         │ 5. HTTP Request kèm Header:
                                         │    Authorization: Bearer <ID_TOKEN>
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                 Google Cloud Run Gateway (Google Front End / IAM)                │
│                                                                                  │
│   • Kiểm tra chữ ký số của Google trên ID Token                                  │
│   • Xác minh audience trùng khớp https://improvapiendpoint-n4trgixj6q-de.a.run.app│
│   • Kiểm tra IAM Permission: roles/run.invoker                                   │
│   • Nếu hợp lệ -> Chuyển tiếp request vào Container improvapiendpoint           │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   Container: improvapiendpoint (Node.js/Bun)                     │
│                                                                                  │
│   • Thực thi micro-batch LLM synthesis (Gemini 2.5)                             │
│   • Đọc/Ghi trực tiếp Firestore collection /improv_packages                     │
│   • Trả về kết quả JSON / Excel binary stream với HTTP 200 OK                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 8.2 Thông Số Cấu Hình Hạ Tầng Cloud Run & Service Account

Bảng thông số kỹ thuật đã được cấp phát, thiết lập IAM và kiểm thử xác thực thành công:

| Thuộc Tính | Giá Trị Cấu Hình | Ghi Chú |
| :--- | :--- | :--- |
| **Service Name** | `improvapiendpoint` | Google Cloud Run Service |
| **Direct Cloud Run URL** | `https://improvapiendpoint-n4trgixj6q-de.a.run.app` | Target Endpoint & OIDC Audience |
| **GCP Region** | `asia-east1` | Taiwan Data Center (độ trễ thấp nhất về VN) |
| **GCP Project ID** | `chunks-voicecloning-genshai` | Project chứa Cloud Run & Firestore |
| **GCP Project Number** | `284566312743` | Số định danh dự án |
| **Billing Account (Cycy)** | `012961-7A87C2-05D3CA` | Tài khoản thanh toán GCP chính thức |
| **Service Account Email** | `284566312743-compute@developer.gserviceaccount.com` | Default Compute Service Account |
| **Quyền IAM Cần Thiết** | `roles/run.invoker`, `roles/datastore.user` | Cho phép invoke Cloud Run & truy xuất Firestore |
| **Key File Location** | `credentials/chunks-cloudrun-service-account.json` | Đã cấu hình `.gitignore` an toàn |

---

### 8.3 Quản Lý Khóa Bí Mật An Toàn (`credentials/`)

Để bảo mật khóa bí mật (`private_key`) của Service Account, dự án đã thiết lập quy chuẩn lưu trữ nghiêm ngặt:

1. **Vị trí tệp**:
   ```
   chunks-class/
   ├── credentials/
   │   └── chunks-cloudrun-service-account.json   # Key JSON (đã gitignore)
   └── .gitignore
   ```

2. **Cấu hình `.gitignore`**:
   Đã thêm cấu hình chặn commit toàn bộ thư mục `credentials/` và các file `*service-account*.json`:
   ```gitignore
   # GCP / Service Account Credentials
   credentials/
   *service-account*.json
   ```

> [!CAUTION]
> **Tuyệt đối không commit tệp `chunks-cloudrun-service-account.json` vào bất kỳ Git repository nào.**
> Trong môi trường Production (như Cloud Run, Kubernetes, Heroku, Docker), khuyến nghị truyền khóa thông qua biến môi trường `GOOGLE_APPLICATION_CREDENTIALS` trỏ tới file mount bí mật từ Secret Manager hoặc truyền chuỗi base64 qua biến bí mật.

---

### 8.4 Code Recipes: Xác Thực OIDC ID Token & Gọi Cloud Run Trực Tiếp

Dưới đây là các công thức mã nguồn thực chiến đã được kiểm thử xác thực 100% thành công.

#### Recipe 1: TypeScript / Node.js (Chunks-LMS / Backend Microservices)

Sử dụng thư viện chính thức [`google-auth-library`](https://www.npmjs.com/package/google-auth-library). Thư viện này tự động quản lý vòng đời lấy token, lưu bộ nhớ đệm (caching) và tự động làm mới (refresh) trước khi token hết hạn (1 giờ).

Cài đặt thư viện:
```bash
bun add google-auth-library
# hoặc: npm install google-auth-library
```

Mã nguồn triển khai hoàn chỉnh:

```typescript
import { GoogleAuth } from 'google-auth-library';

// 1. Cấu hình hằng số endpoint và file key bí mật
const CLOUD_RUN_URL = 'https://improvapiendpoint-n4trgixj6q-de.a.run.app';
const KEY_FILE_PATH = 'credentials/chunks-cloudrun-service-account.json';

// 2. Khởi tạo GoogleAuth instance trỏ tới key file
const auth = new GoogleAuth({
  keyFilename: KEY_FILE_PATH
});

/**
 * Tạo một authenticated HTTP client cho Cloud Run target audience
 */
async function getAuthenticatedClient() {
  return await auth.getIdTokenClient(CLOUD_RUN_URL);
}

// 3. Ví dụ 1: Kiểm tra trạng thái hệ thống (Health Check)
export async function checkCloudRunHealth() {
  const client = await getAuthenticatedClient();
  const res = await client.request<{ status: string; service: string; region: string }>({
    url: `${CLOUD_RUN_URL}/health`,
    method: 'GET'
  });
  console.log('Cloud Run Health:', res.data);
  return res.data;
}

// 4. Ví dụ 2: Lấy danh sách gói Improv từ Firestore
export async function listImprovPackages() {
  const client = await getAuthenticatedClient();
  const res = await client.request<{ success: boolean; count: number; data: any[] }>({
    url: `${CLOUD_RUN_URL}/packages`,
    method: 'GET'
  });
  console.log(`Lấy thành công ${res.data.count} packages từ Cloud Run!`);
  return res.data.data;
}

// 5. Ví dụ 3: Tạo trọn vẹn một gói Improv Package và lưu vào Firestore
export async function generateImprovPackageViaCloudRun() {
  const client = await getAuthenticatedClient();

  const payload = {
    packageTitle: 'Business Pitch & Elevator Reflex',
    totalItems: 6,
    difficulty: 'Medium (B1)',
    relevance: 'High',
    sourceLevel: 'LEVEL_B_ERES',
    sourceLessonIds: [],
    topic: 'Venture Capital Pitching',
    sessionsConfig: [
      {
        sessionNumber: 1,
        title: 'Session 1: Problem & Solution',
        hcTotal: 2,
        hintTypes: ['Keyword', 'Ending'],
        itemsCount: 3
      },
      {
        sessionNumber: 2,
        title: 'Session 2: Financials & Traction',
        hcTotal: 3,
        hintTypes: ['Keyword', 'Từ nối', 'Ending'],
        itemsCount: 3
      }
    ]
  };

  const res = await client.request<{ success: boolean; data: any }>({
    url: `${CLOUD_RUN_URL}/generate?save=true`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: payload
  });

  console.log('Generated Package ID:', res.data.data.id);
  return res.data.data;
}
```

---

#### Recipe 2: Python Client (`google-auth` & `requests`)

Sử dụng thư viện chính thức `google-auth` cùng `requests`. Có thể sử dụng `AuthorizedSession` để tự động đính kèm ID Token vào mọi request.

Cài đặt thư viện:
```bash
pip install google-auth requests
```

Mã nguồn Python hoàn chỉnh:

```python
import os
import requests
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession, Request
import google.oauth2.id_token

# 1. Cấu hình endpoint và file key bí mật
CLOUD_RUN_URL = "https://improvapiendpoint-n4trgixj6q-de.a.run.app"
KEY_FILE_PATH = "credentials/chunks-cloudrun-service-account.json"

# --- Cách 1: Sử dụng AuthorizedSession (Khuyến nghị - Tự động refresh token) ---
def get_authorized_session() -> AuthorizedSession:
    """Tạo một requests.Session tự động gắn header Authorization: Bearer <ID_TOKEN>."""
    credentials = service_account.IDTokenCredentials.from_service_account_file(
        KEY_FILE_PATH,
        target_audience=CLOUD_RUN_URL
    )
    return AuthorizedSession(credentials)

def check_health():
    session = get_authorized_session()
    res = session.get(f"{CLOUD_RUN_URL}/health")
    res.raise_for_status()
    print("Health Status:", res.json())
    return res.json()

def get_all_packages():
    session = get_authorized_session()
    res = session.get(f"{CLOUD_RUN_URL}/packages")
    res.raise_for_status()
    data = res.json()
    print(f"Tổng số packages: {data.get('count', 0)}")
    return data.get("data", [])

# --- Cách 2: Lấy ID Token tường minh rồi gọi qua requests thông thường ---
def fetch_token_and_call():
    auth_req = Request()
    # Tự động đọc file từ GOOGLE_APPLICATION_CREDENTIALS nếu không chỉ định rõ
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = KEY_FILE_PATH
    id_token = google.oauth2.id_token.fetch_id_token(auth_req, CLOUD_RUN_URL)

    headers = {
        "Authorization": f"Bearer {id_token}",
        "Content-Type": "application/json"
    }
    res = requests.get(f"{CLOUD_RUN_URL}/packages", headers=headers)
    print("Packages response:", res.status_code, len(res.json().get("data", [])))

if __name__ == "__main__":
    check_health()
    packages = get_all_packages()
```

---

#### Recipe 3: cURL & Shell Scripts (PowerShell & Bash)

##### A. Sử dụng `gcloud CLI` (Môi trường phát triển có cài Google Cloud SDK)

1. **Bash / Linux / macOS**:
   ```bash
   # Kích hoạt service account bằng key file đã lưu
   gcloud auth activate-service-account --key-file="credentials/chunks-cloudrun-service-account.json"

   # Lấy OIDC ID Token với audience của Cloud Run
   ID_TOKEN=$(gcloud auth print-identity-token --audiences="https://improvapiendpoint-n4trgixj6q-de.a.run.app")

   # Gọi Health Check
   curl -X GET "https://improvapiendpoint-n4trgixj6q-de.a.run.app/health" \
     -H "Authorization: Bearer $ID_TOKEN"

   # Lấy danh sách Packages
   curl -X GET "https://improvapiendpoint-n4trgixj6q-de.a.run.app/packages" \
     -H "Authorization: Bearer $ID_TOKEN"
   ```

2. **PowerShell (Windows)**:
   ```powershell
   # Kích hoạt service account
   gcloud auth activate-service-account --key-file="credentials\chunks-cloudrun-service-account.json"

   # Lấy OIDC ID Token
   $ID_TOKEN = (gcloud auth print-identity-token --audiences="https://improvapiendpoint-n4trgixj6q-de.a.run.app").Trim()

   # Gửi yêu cầu qua Invoke-RestMethod
   $headers = @{
       Authorization = "Bearer $ID_TOKEN"
       "Content-Type" = "application/json"
   }

   # Health Check
   $health = Invoke-RestMethod -Uri "https://improvapiendpoint-n4trgixj6q-de.a.run.app/health" -Method Get -Headers $headers
   $health | ConvertTo-Json

   # Danh sách Packages
   $packages = Invoke-RestMethod -Uri "https://improvapiendpoint-n4trgixj6q-de.a.run.app/packages" -Method Get -Headers $headers
   $packages.data | Format-Table id, title, totalItems
   ```

##### B. Không dùng `gcloud CLI` (Sử dụng Bun / Node script để lấy token tức thời)

Nếu máy chủ không cài `gcloud`, có thể dùng Node/Bun sinh token nhanh:
```bash
# Lấy token vào biến môi trường
ID_TOKEN=$(bun -e "import { GoogleAuth } from 'google-auth-library'; const a = new GoogleAuth({ keyFilename: 'credentials/chunks-cloudrun-service-account.json' }); const c = await a.getIdTokenClient('https://improvapiendpoint-n4trgixj6q-de.a.run.app'); const t = await c.idTokenProvider.fetchIdToken('https://improvapiendpoint-n4trgixj6q-de.a.run.app'); console.log(t);")

# Thực hiện cURL với token vừa lấy
curl -X GET "https://improvapiendpoint-n4trgixj6q-de.a.run.app/health" \
  -H "Authorization: Bearer $ID_TOKEN"
```

---

#### Recipe 4: Full End-to-End Package Generation & Fetching

Ví dụ hoàn chỉnh từ A đến Z tạo gói bài học phản xạ trực tiếp qua Cloud Run với payload chi tiết:

```bash
# 1. Chuẩn bị ID Token
ID_TOKEN=$(gcloud auth print-identity-token --audiences="https://improvapiendpoint-n4trgixj6q-de.a.run.app")

# 2. Gửi request sinh gói bài tập phản xạ (POST /generate?save=true)
curl -X POST "https://improvapiendpoint-n4trgixj6q-de.a.run.app/generate?save=true" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageTitle": "Online Banking & Security Reflexes",
    "totalItems": 6,
    "difficulty": "Medium (B1)",
    "relevance": "High",
    "sourceLevel": "LEVEL_B_ERES",
    "sourceLessonIds": [],
    "topic": "OTP Verification & Fraud Alerts",
    "sessionsConfig": [
      {
        "sessionNumber": 1,
        "title": "Two-Factor Verification",
        "hcTotal": 2,
        "hintTypes": ["Keyword", "Ending"],
        "itemsCount": 3
      },
      {
        "sessionNumber": 2,
        "title": "Suspicious Activity Alerts",
        "hcTotal": 3,
        "hintTypes": ["Keyword", "Từ nối", "Ending"],
        "itemsCount": 3
      }
    ]
  }'
```

**Ví dụ phản hồi thành công (HTTP 200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "pkg_improv_1727162600123_a9b8c7",
    "title": "Online Banking & Security Reflexes",
    "topic": "OTP Verification & Fraud Alerts",
    "totalItems": 6,
    "sessionsCount": 2,
    "sessions": [
      {
        "sessionNumber": 1,
        "title": "Two-Factor Verification",
        "hcTotal": 2,
        "hintTypes": ["Keyword", "Ending"],
        "items": [
          {
            "id": "item_1_1",
            "en": "Enter the code sent to your phone.",
            "vi": "Nhập mã được gửi đến điện thoại của bạn.",
            "hints": [
              { "type": "Keyword", "text": "Enter code", "vi": "Nhập mã" },
              { "type": "Ending", "text": "your phone", "vi": "điện thoại của bạn" }
            ]
          }
        ]
      }
    ],
    "createdAt": 1727162600123,
    "updatedAt": 1727162600123
  }
}
```

Sau khi tạo, có thể tải ngay file Excel bằng lệnh:
```bash
curl -X POST "https://improvapiendpoint-n4trgixj6q-de.a.run.app/export-excel?id=pkg_improv_1727162600123_a9b8c7" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -o "Online_Banking_Security_Reflexes.xlsx"
```

---

### 8.5 Bảng Mã Lỗi Thường Gặp & Xử Lý Sự Cố (Troubleshooting)

| Mã HTTP | Tên Lỗi | Nguyên Nhân Thường Gặp | Cách Khắc Phục |
| :--- | :--- | :--- | :--- |
| **`401 Unauthorized`** | Missing or Invalid Token | Không truyền header `Authorization` hoặc dùng Access Token thông thường thay vì OIDC ID Token. | Sử dụng `getIdTokenClient` hoặc `fetch_id_token` để tạo **OIDC ID Token** có audience đúng với Cloud Run URL. |
| **`403 Forbidden`** | Permission Denied | Service Account thiếu quyền `roles/run.invoker` trên Cloud Run service. | Cấp quyền: `gcloud run services add-iam-policy-binding improvapiendpoint --member="serviceAccount:284566312743-compute@developer.gserviceaccount.com" --role="roles/run.invoker" --region="asia-east1"`. |
| **`400 Bad Request`** | Invalid JSON Payload | Thiếu trường bắt buộc trong `sessionsConfig` hoặc định dạng JSON sai. | Kiểm tra schema payload theo bảng [Domain Models](#4-domain-models--configuration-types). |
| **`500 Internal Error`** | Server Execution Error | Lỗi kết nối LLM hoặc Firestore quota. | Kiểm tra log chi tiết: `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=improvapiendpoint" --limit 20`. |
