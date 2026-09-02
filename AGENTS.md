# Brain OS: CHUNKS Multi-Tier Classroom Platform & Knowledge Graph Governance (AGENTS.md)

You are operating within the **CHUNKS Teacher Classroom Platform** repository.
This repository governs a multi-tier, zero-bloat educational platform featuring live Google Cloud Firestore connectivity, in-browser Excel (.xlsx) ingestion, permanent GCS audio streaming, dynamic Deepgram Aura & Google Cloud TTS synthesis (Journey-F/M, Studio-O, Neural2-A), and wireless presenter remote clicker integration for English cohorts.

---

## 🏛️ 1. System Architecture & Repository Taxonomy

```text
chunks-class/
├── .github/workflows/              # Multi-tier CI/CD automation ($0/mo Always Free)
│   └── deploy-firebase.yml         # Typecheck, bundle build, and Firebase Hosting deployment
├── assets/                         # Public static assets & branding icons
├── src/
│   ├── api/                        # Modular API Endpoints (cohortsApi, lessonsApi, ttsApi)
│   ├── components/                 # UI Components (ClassroomPresentation, PartsDrawer, Sidebar, etc.)
│   ├── hooks/                      # Hardware Clicker (usePresenterClicker.ts) & Router (useAppRouter.ts)
│   ├── services/                   # Dynamic Registry, Firestore SDK, Deepgram & Google TTS
│   │   ├── curriculumRegistry.ts   # Dynamic In-Memory & Extensible Course Store
│   │   ├── firestoreService.ts     # Live Firestore Single-Doc Chunks Reader & Writer
│   │   ├── deepgramTtsService.ts   # Deepgram Aura Speech Engine
│   │   └── googleTtsService.ts     # Google Cloud TTS REST API Engine
│   ├── types/                      # Canonical Open Domain Models & TypeScript interfaces
│   └── utils/                      # Dynamic Recurrence Math & SheetJS Excel parser/generator
├── .firebaserc                     # Multi-site target mapping (chunks-classroom, default)
├── firebase.json                   # Granular cache-control (no-cache index.html, 1yr immutable assets)
└── firestore.rules                 # Production Firestore security rules
```

---

## 🤖 2. Multi-Agent Dispatching & Role Taxonomy

When executing tasks across this repository, agents MUST operate within their defined functional boundaries:

| Agent Role | Primary Jurisdiction | Responsibilities & Verification Gates |
| :--- | :--- | :--- |
| **Lead Architect & Orchestrator** | Root, `src/types/`, Lifecycle | Ensures system coherence, validates OpenSpec task matrices, enforces zero-slop contracts, and supervises cross-component handoffs. |
| **Frontend & UI/UX Engineer** | `src/components/`, `src/hooks/` | Builds high-contrast presentation stages, presenter clicker listeners, parts drawers, and responsive schedules. Enforces `Be Vietnam Pro` glyph safety. |
| **Data & Dynamic Specialist** | `src/services/`, `src/utils/` | Manages Firestore schemas, dynamic `CurriculumRegistry`, SheetJS Excel parser/builder, and safe chunked batch syncs. |
| **Cloud & Audio Systems Engineer** | `src/services/*tts*`, `.github/` | Maintains GCS audio streaming, Deepgram Aura & Google Cloud TTS API, and $0/mo free tier quotas. |
| **QA & Compliance Auditor** | Entire Codebase | Executes static typechecking (`tsc --noEmit`), verifies link graphs, ensures zero mockups in production mode, and audits frontmatter schemas. |

---

## 📐 3. Dynamic Database & Domain Contracts

### 3.1 Fully Dynamic Course & Lesson Storage
- **No Hardcoded Level Lock-in**:
  - `CourseLevel` is an extensible type (`LEVEL_A`, `LEVEL_B`, `LEVEL_C`, `IELTS_DRILL`, `CUSTOM`).
  - Courses are dynamically loaded from Firestore collection `/courses/{courseId}` with `curriculumRegistry` fallback.
- **Single-Doc Chunks Array**:
  - All chunks of a lesson are stored in a contiguous array field `doc.data().chunks: ChunkItem[]`.
  - **Strict Prohibition**: Never query subcollections for chunks (preserves $0/mo Firestore free tier quotas).

### 3.2 Dynamic Cohort Auto-Scheduler Contract
- **Calculation Rule**: Given a `start_date`, `days_of_week`, and `total_sessions` (arbitrary N sessions), `calculateSessions` generates sequential calendar dates using timezone-safe local noon date arithmetic.
- **Status Preservation**: Modifying cohort schedules preserves existing `completed` and `in_progress` session statuses.

### 3.3 Dual-Engine Audio Architecture
- **Engine Prioritization**:
  1. In-memory prepared cache (`0ms delay`).
  2. Deepgram Aura Speech API (`aura-asteria-en`, `aura-luna-en`, `aura-stella-en`, `aura-orion-en`).
  3. GCS Master CDN Audio.
  4. Google Cloud TTS API (`en-US-Journey-F/M`, `en-US-Studio-O`, `vi-VN-Neural2-A`).
  5. Browser Speech Synthesis Fallback.
- **Race Condition Protection**: `activeSequenceId` generation counter invalidates in-flight bilingual timeouts upon clicker navigation.

### 3.4 Hardware Remote Clicker Mappings
- `PageDown` / `Space` / `ArrowRight`: Advance to next chunk & play audio.
- `PageUp` / `ArrowLeft`: Return to previous chunk.
- `Key R`: Replay active chunk audio.
- `Key B` / `Period`: Toggle pitch-black blackout overlay (`#000000`).
- `Key V`: Toggle Vietnamese subtitle visibility.
- `Key L`: Toggle Word & Chunks List drawer.
- `Key P`: Toggle Parts Navigation drawer.
- `Key F` / `F5`: Toggle Fullscreen mode.

---

## 🚀 4. CI/CD & Multi-Domain Hosting ($0.00 / Month Always Free)

### Automated Pipeline:
- **Trigger**: Every push to `main` / `master` or manual workflow dispatch.
- **Workflow**: `.github/workflows/deploy-firebase.yml`
- **Target Site**: `chunks-classroom` → Deploys directly to **`https://chunks-classroom.web.app`**.
- **Caching Discipline**:
  - `/index.html`: `no-cache, no-store, must-revalidate` (guarantees instant updates on new deploys).
  - `/assets/**`: `public, max-age=31536000, immutable` (1-year immutable cache for content-hashed bundles).

---

## ⚡ 5. Strict Zero-Slop & Quality Assurance Principles

1. **Zero Mockups in Production**: Always load live data from Firestore / dynamic registry.
2. **Vietnamese Typography Safety**: All components load and render `Be Vietnam Pro` (Latin Extended).
3. **$0.00 / Month Always-Free Discipline**:
   - Firestore: ≤ 50,000 reads, 20,000 writes/day.
   - Cloud TTS / Deepgram: Controlled caching and batch worker pool.
   - Firebase Hosting: ≤ 10 GB storage, 360 MB/day egress.
4. **Continuous Verification**: Prior to merge, execute `bun x tsc --noEmit` and `bun run build`.

---

## 🛡️ 6. Strict Multi-Agent Orchestration & Subagent Delegation (IMMUTABLE GUARDRAIL)

1. **Zero Monolithic Execution in Parent Context**:
   - The Lead Orchestrator (Parent Agent) is **STRICTLY PROHIBITED** from using write tools (`replace_file_content`, `write_to_file`) to implement features or write production code directly.
2. **Mandatory Subagent Dispatching (`invoke_subagent`)**:
   - ALL code generation, UI component development, service modifications, and bug fixes MUST be decomposed into clear domain tasks and dispatched to specialized subagents via `invoke_subagent`.
3. **Parent Lead Orchestrator Responsibilities**:
   - Understand requirements and compile architectural contracts & domain prompts for subagents.
   - Dispatch subagents and monitor their background execution.
   - Coordinate cross-component handoffs.
   - Execute QA verification gates (`bun x tsc --noEmit`, `bun run build`, and `git push`).
