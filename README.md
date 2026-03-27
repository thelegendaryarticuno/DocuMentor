# DocuMentor

DocuMentor is an offline, privacy-first document assistant that runs entirely in your browser.

Designed for real-world sensitive reading and writing workflows (insurance documents, policies, contracts, academic drafts, internal technical docs), all AI processing in DocuMentor occurs entirely on-device (via WebAssembly and WebGPU) — no server-side inference, no API keys, and no telemetry.

## 🚀 Key Features

DocuMentor focuses on three core experiences:

### 1. Smart Highlights 
*Surface the most important sections in long files.*
- Upload PDF or DOCX files and instantly extract top-priority text.
- Triggers deep document chunking and local AI analysis to assign `Importance Level` flags (Low, Medium, Critical) with robust reasoning.
- Export your highlights into a structured format for external review.

### 2. Guided Learning (Student Mode)
*Learn directly from your own notes, docs, and code.*
- Feed the AI unstructured text, and it transforms it into an interactive lesson.
- Generates step-by-step structures like analogies, quizzes, and bulleted takeaways rendered in dedicated "Teach Cards."
- Maintains session-aware local memory of your sources to continually ground the lesson in your materials.

### 3. Research Mode
*Challenge arguments and refine your writing seamlessly.*
- Includes two sub-modes spanning a persistent chat workflow.
- **Debate Mode:** Acts as a devil's advocate to your arguments by identifying logical gaps and offering counter-points.
- **Writing Mode:** Transitions from critique to feedback, offering tangible structural and clarity improvements for your academic or technical drafts.

### 🛡️ Pre-computation Privacy Scanner
Before any document is passed to the AI runtimes, DocuMentor runs an aggressive local regex scan to catch leaked secrets:
- **Critical Secrets:** AWS keys, Stripe secrets, Private Keys, GitHub endpoints.
- **High Sensitivity:** JWTs, Database URIs, exposed `.env` variables.
- **Medium/Low Sensitivity:** Emails, Phone Numbers, IP Addresses.
- **Actionable UI:** Users are stopped by a modal UI requiring explicit acknowledgment or remediation of found secrets before analysis continues.

## 💻 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | UI composition and state management |
| **Routing** | React Router DOM v7 | Client-side page and mode navigation |
| **Build Tool** | Vite 6 | Fast dev server, bundling, worker abstractions |
| **Document Parsing** | `pdfjs-dist`, `mammoth`, `html-docx-js` | In-browser file interpretation (PDF / Word) |
| **AI Core** | `@runanywhere/web` | Local SDK init, model registry, model state management |
| **Local LLM Backend** | `@runanywhere/web-llamacpp` | Inference via WebAssembly/WebGPU (Text/Vision worker bridge) |
| **Local Audio Backend**| `@runanywhere/web-onnx` | ONNX runtime backend registration (STT/TTS capabilities) |
| **Deployment** | Vercel | SPA hosting configured with Cross-Origin Isolation headers required for SharedArrayBuffer |

## 🌟 RunAnywhere AI Integration
The AI orchestration uses the `@runanywhere` suite to keep workloads on the client.
- **Worker Architecture:** AI inference runs inside a Web Worker thread (`src/workers/vlm-worker.ts`), preventing UI stutter during heavy token generation.
- **Model Caching:** Models are downloaded directly from HuggingFace to the browser's Origin Private File System (OPFS).
- **Graceful Loading:** A robust UI layer (via `ModelBanner`) monitors loading progress, from fetching bytes to transferring GPU buffers, enabling a smooth user experience even on a cold start.

## 🛠️ Quick Start

```bash
# Install dependencies
npm install

# Start local Vite development server
npm run dev

# Start dev server explicitly requesting your local GPU (Chrome vs Edge vs Brave)
# These use concurrently and a wait-on script to open with hardware flags
npm run dev:gpu
npm run dev:chrome
```

Open `http://localhost:5173`.

For a production build (which injects the necessary WebAssembly assets):

```bash
npm run build
npm run preview
```

## 📂 Source Walkthrough

```text
src/
├── main.tsx                  # React entry point, mounts router
├── App.tsx                   # Routes mappings and RunAnywhere SDK Initialization
├── index.css                 # Core design system and responsive chat variables
├── components/               # Core UI Building Blocks
│   ├── ChatPanel.tsx         # Chat interface 
│   ├── ChatTab.tsx           # Real-time message token streaming logic
│   ├── ModelBanner.tsx       # AI Model loader UX state machine
│   ├── ScannerFindings.tsx   # Modal for privacy leaks
│   ├── Sidebar.tsx           # Route navigation menu
│   └── TeachCard.tsx         # Dedicated view for Student Mode parsing
├── hooks/                    # Business Logic hooks 
│   ├── useChat.ts            # Chat interactions
│   ├── useHighlightAnalysis.ts # Chunking and AI processing for documents
│   ├── useModelLoader.ts     # Loading abstractions via Origin Private File System
│   └── useTeach.ts           # Interfacing local model with structured JSON parsing
├── lib/                      # Pure Logic & Types
│   ├── documentParser.ts     # Extracting text from files via robust parsing libraries
│   └── privacyScanner.ts     # Regex patterns for secret detection
├── modes/                    # High-Level Feature Modules
│   ├── ResearchMode.tsx      
│   ├── SmartHighlightsMode.tsx
│   └── StudentMode.tsx
└── workers/
    └── vlm-worker.ts         # Off-main-thread Web Worker for model inference
```

## ☁️ Deployment Requirements

This application relies heavily on `SharedArrayBuffer` for multi-threaded WASM and WebGPU speed.
For production deployments, ensure the host (e.g. Vercel) includes these headers:
```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
```
*(DocuMentor achieves this out-of-the-box via `vercel.json`).*

## License
MIT
