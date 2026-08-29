# Brain OS: CHUNKS Teacher Classroom Platform & CI/CD Guardrails (AGENTS.md)

You are operating within the **CHUNKS Teacher Classroom Platform** codebase.
This project is an editorial precision web application tailored exclusively for English teachers with live Google Cloud Firestore connectivity, in-browser Excel (.xlsx) lesson ingestion, Google Cloud Text-to-Speech synthesis, and wireless presenter remote clicker control.

---

## 🏛️ 1. Architecture & Core Tech Stack

```text
chunks-class/
├── .github/workflows/        # Automated CI/CD (GitHub Actions -> Firebase Hosting)
│   └── deploy-firebase.yml   # $0/mo Auto Build, Typecheck & Live Deploy
├── assets/                   # Public static assets & branding icons
├── src/
│   ├── components/           # UI Components (Projector, Sidebar, Parts Drawer, Excel Uploader)
│   │   ├── ClassroomPresentation.tsx # Clicker-controlled fullscreen projector stage
│   │   ├── PartsDrawer.tsx           # Quick navigation drawer by category (Key P)
│   │   ├── LessonExcelUploader.tsx   # In-browser Excel ingestion & template generator
│   │   ├── TeacherSidebar.tsx        # 260px Fixed Sidebar navigation with Course Switcher
│   │   └── ScheduleView.tsx          # 15-Session Cohort Auto-Scheduler
│   ├── hooks/
│   │   └── usePresenterClicker.ts    # Hardware clicker event listener (PageDown/Up, KeyB, KeyV, KeyR, KeyP)
│   ├── services/
│   │   ├── firestoreService.ts       # Live Firestore Single-Doc Chunks Reader & Writer
│   │   └── googleTtsService.ts       # Google Cloud TTS REST API (Journey-F/M, Studio-O, Neural2)
│   ├── types/
│   │   └── index.ts                  # Domain models (Course, Cohort, LessonDoc, ChunkItem)
│   └── utils/
│       ├── excelTemplate.ts          # SheetJS template generator & parser (0 beat_prosody)
│       └── scheduler.ts              # 15-session recurrence date calculator
├── .firebaserc               # Firebase project mapping (chunks-voicecloning-genshai)
├── firebase.json             # SPA rewrites & static hosting rules
└── firestore.rules           # Security rules for curriculum & cohort collections
```

---

## 📐 2. Domain Model & Strict Guardrails

1. **Zero Mockup Rule**:
   - Always load from Live Firestore. In Firestore, all chunks of a lesson are stored in a single document array field `doc.data().chunks`.
   - Never query subcollections for chunks.
2. **Audio Engine Contract**:
   - **Zero Robot Voices**: Browser `window.speechSynthesis` is strictly forbidden.
   - Primary: GCS CDN URL (`https://storage.googleapis.com/chunks-mirror-audio-284566312743/...`).
   - Dynamic Fallback: Google Cloud Text-to-Speech API (`en-US-Journey-F`, `en-US-Journey-M`, `en-US-Studio-O`, `vi-VN-Neural2-A`).
3. **No Beat-Prosody Notation**:
   - The data model and UI are kept minimal: chunks contain only `english`, `vietnamese`, `speaker`, `category`, and `audio_url`.
4. **Hardware Clicker Mappings**:
   - `PageDown` / `Space` / `ArrowRight`: Advance to next chunk & play audio.
   - `PageUp` / `ArrowLeft`: Return to previous chunk.
   - `Key R`: Replay current sentence audio.
   - `Key B` / `Period`: Blackout screen (pitch-black overlay).
   - `Key V`: Toggle Vietnamese subtitle visibility.
   - `Key P`: Open/Close Parts Navigation Drawer.

---

## 🚀 3. CI/CD & Deployment Guide ($0.00 / Month Always Free)

### Automated Pipeline:
- **Trigger**: Every push to `main` / `master` branch.
- **Workflow**: `.github/workflows/deploy-firebase.yml`
  1. Installs dependencies via `bun install`.
  2. Runs static typechecking: `bun x tsc --noEmit`.
  3. Builds production web bundle: `bun run build`.
  4. Deploys to Firebase Hosting: `https://chunks-voicecloning-genshai.web.app` (and custom domains).

### Required GitHub Secrets:
To activate auto-deployment, add this secret in your GitHub Repo Settings (`Settings > Secrets and variables > Actions`):
- `FIREBASE_SERVICE_ACCOUNT_CHUNKS_VOICECLONING_GENSHAI`: The JSON key of the Google Cloud Service Account with `Firebase Hosting Admin` role.

---

## 🔗 4. Domain & Custom URLs
- **Firebase Hosting Primary**: `https://chunks-voicecloning-genshai.web.app`
- **Firebase Hosting Backup**: `https://chunks-voicecloning-genshai.firebaseapp.com`
- **Custom Domain**: Configurable in Firebase Console > Hosting > *Add Custom Domain* (Free auto-renewing SSL).
