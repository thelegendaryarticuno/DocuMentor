# 📚 Libraries Used in DocuMentor

## Overview

DocuMentor uses a total of **27 libraries** (15 production + 12 development) for AI processing, document parsing, UI, and build tools.

---

## 🎯 Production Dependencies (15)

### **1. AI & Machine Learning**

#### **@runanywhere/web** (^0.1.0-beta.10)
- **Purpose**: Core SDK for on-device AI
- **What it does**: 
  - Model management (download, load, unload)
  - Device capability detection (WebGPU, OPFS)
  - Event bus for model events
  - Storage management (IndexedDB, OPFS)
- **Used for**: Foundation of all AI operations
- **Website**: https://runanywhere.ai
- **License**: Proprietary

#### **@runanywhere/web-llamacpp** (^0.1.0-beta.10)
- **Purpose**: LLaMA.cpp backend for LLM/VLM inference
- **What it does**:
  - Text generation (streaming & non-streaming)
  - Vision-language model support (VLM)
  - WebGPU acceleration for GPU inference
  - Structured output validation
  - Web Worker support for VLM
- **Used for**: All chat, teaching, research, and Smart Highlights AI analysis
- **Models**: LFM2 350M, LFM2 1.2B, LFM2-VL 450M (GGUF format)
- **Website**: https://runanywhere.ai
- **License**: Proprietary

#### **@runanywhere/web-onnx** (^0.1.0-beta.10)
- **Purpose**: ONNX backend for speech processing
- **What it does**:
  - Speech-to-text (Whisper models)
  - Text-to-speech (Piper TTS)
  - Voice activity detection (Silero VAD)
- **Used for**: Voice features (not actively used in current modes)
- **Models**: Whisper Tiny, Piper TTS, Silero VAD
- **Website**: https://runanywhere.ai
- **License**: Proprietary

---

### **2. Document Processing**

#### **pdfjs-dist** (^5.5.207)
- **Purpose**: PDF parsing and text extraction
- **What it does**:
  - Parse PDF files in browser
  - Extract text from each page
  - Handle complex PDF structures
- **Used for**: Smart Highlights PDF upload feature
- **Website**: https://mozilla.github.io/pdf.js/
- **License**: Apache 2.0
- **Size**: ~3.5 MB (with worker)

#### **mammoth** (^1.12.0)
- **Purpose**: DOCX parsing and text extraction
- **What it does**:
  - Parse Microsoft Word .docx files
  - Extract raw text content
  - Handle document structure
- **Used for**: Smart Highlights DOCX upload feature
- **Website**: https://github.com/mwilliamson/mammoth.js
- **License**: BSD-2-Clause
- **Size**: ~100 KB

#### **file-saver** (^2.0.5)
- **Purpose**: Save files to user's device
- **What it does**:
  - Trigger file downloads in browser
  - Cross-browser compatibility
  - Handle large files efficiently
- **Used for**: Downloading highlighted documents as HTML
- **Website**: https://github.com/eligrey/FileSaver.js
- **License**: MIT
- **Size**: ~5 KB

#### **html-docx-js** (^0.3.1)
- **Purpose**: HTML to DOCX conversion
- **What it does**:
  - Convert HTML to Word documents
  - Preserve formatting and styles
- **Used for**: Potential future feature (not actively used)
- **Website**: https://github.com/evidenceprime/html-docx-js
- **License**: MIT
- **Size**: ~50 KB

#### **jszip** (^3.10.1)
- **Purpose**: ZIP file creation and manipulation
- **What it does**:
  - Create ZIP archives in browser
  - Compress/decompress files
- **Used for**: DOCX file handling (DOCX is a ZIP archive)
- **Website**: https://stuk.github.io/jszip/
- **License**: MIT/GPL
- **Size**: ~100 KB

---

### **3. UI Framework & Routing**

#### **react** (^19.0.0)
- **Purpose**: UI framework
- **What it does**:
  - Component-based UI
  - Virtual DOM for performance
  - State management (useState, useEffect, etc.)
  - Concurrent rendering
- **Used for**: Entire application UI
- **Website**: https://react.dev
- **License**: MIT
- **Size**: ~130 KB (production build)

#### **react-dom** (^19.0.0)
- **Purpose**: React DOM renderer
- **What it does**:
  - Render React components to DOM
  - Handle events and updates
  - Browser-specific optimizations
- **Used for**: Rendering React to the browser
- **Website**: https://react.dev
- **License**: MIT
- **Size**: ~130 KB (production build)

#### **react-router-dom** (^7.13.1)
- **Purpose**: Client-side routing
- **What it does**:
  - Route navigation (/, /student, /research, /highlights)
  - Browser history management
  - Link components
- **Used for**: Navigation between Student, Research, Smart Highlights modes
- **Website**: https://reactrouter.com
- **License**: MIT
- **Size**: ~50 KB

---

### **4. Utilities**

#### **json5** (^2.2.3)
- **Purpose**: JSON5 parsing (JSON with comments, trailing commas)
- **What it does**:
  - Parse relaxed JSON syntax
  - Support for comments in JSON
  - More forgiving than standard JSON
- **Used for**: Parsing structured output from AI models
- **Website**: https://json5.org
- **License**: MIT
- **Size**: ~25 KB

---

## 🛠️ Development Dependencies (12)

### **1. Build Tools**

#### **vite** (^6.0.0)
- **Purpose**: Build tool and dev server
- **What it does**:
  - Fast hot module replacement (HMR)
  - Optimized production builds
  - ES modules support
  - Asset handling (WASM, images, CSS)
- **Used for**: Development server and production builds
- **Website**: https://vite.dev
- **License**: MIT

#### **@vitejs/plugin-react** (^4.3.0)
- **Purpose**: React integration for Vite
- **What it does**:
  - Fast Refresh for React
  - JSX transformation
  - React optimizations
- **Used for**: React development with Vite
- **Website**: https://github.com/vitejs/vite-plugin-react
- **License**: MIT

---

### **2. TypeScript**

#### **typescript** (^5.6.0)
- **Purpose**: Type-safe JavaScript
- **What it does**:
  - Static type checking
  - Better IDE support
  - Catch errors at compile time
- **Used for**: All TypeScript (.ts/.tsx) files
- **Website**: https://www.typescriptlang.org
- **License**: Apache 2.0

#### **@types/react** (^19.0.0)
- **Purpose**: TypeScript definitions for React
- **What it does**:
  - Type definitions for React APIs
  - Better autocomplete
- **Used for**: TypeScript support in React components
- **License**: MIT

#### **@types/react-dom** (^19.0.0)
- **Purpose**: TypeScript definitions for React DOM
- **What it does**:
  - Type definitions for ReactDOM APIs
- **Used for**: TypeScript support for React DOM
- **License**: MIT

#### **@webgpu/types** (^0.1.69)
- **Purpose**: TypeScript definitions for WebGPU
- **What it does**:
  - Type definitions for WebGPU APIs
  - GPU adapter, device, pipeline types
- **Used for**: GPU configuration utilities (src/utils/gpuConfig.ts)
- **Website**: https://github.com/gpuweb/types
- **License**: BSD-3-Clause

---

### **3. Development Utilities**

#### **concurrently** (^9.2.1)
- **Purpose**: Run multiple commands concurrently
- **What it does**:
  - Run dev server + browser launcher together
  - Parallel command execution
- **Used for**: `npm run dev:gpu`, `dev:chrome`, etc.
- **Website**: https://github.com/open-cli-tools/concurrently
- **License**: MIT

#### **wait-on** (^9.0.4)
- **Purpose**: Wait for resources to be available
- **What it does**:
  - Wait for HTTP server to be ready
  - Timeout handling
- **Used for**: Wait for Vite server before launching browser
- **Website**: https://github.com/jeffbski/wait-on
- **License**: MIT

---

## 📊 Library Statistics

### **By Category:**

| Category | Count | Total Size (approx) |
|----------|-------|---------------------|
| AI/ML | 3 | ~20 MB (WASM binaries) |
| Document Processing | 5 | ~3.7 MB |
| UI Framework | 3 | ~310 KB |
| Utilities | 1 | ~25 KB |
| Build Tools | 2 | ~15 MB (dev only) |
| TypeScript | 4 | ~10 MB (dev only) |
| Dev Utilities | 2 | ~5 MB (dev only) |

### **Total Bundle Sizes:**

- **Production JS**: ~1.5 MB (gzipped: ~430 KB)
- **Production CSS**: ~9 KB (gzipped: ~2.5 KB)
- **WASM Binaries**: ~20 MB (loaded on-demand)
- **Dev Dependencies**: ~30 MB (not included in production)

---

## 🎯 Key Technologies

### **Runtime:**
- **React 19** - Latest with concurrent rendering
- **WebGPU** - GPU acceleration for AI
- **WebAssembly** - WASM binaries for AI models
- **Service Workers** - For VLM off-main-thread
- **IndexedDB** - Model storage
- **OPFS** - Persistent file storage

### **AI Models (GGUF Format):**
- **LFM2 350M** (Q4_K_M) - 250 MB - Fast chat
- **LFM2 1.2B** (Q4_K_M) - 800 MB - Tool calling
- **LFM2-VL 450M** (Q4_0) - 500 MB - Vision+Language

### **Speech Models (ONNX Format):**
- **Whisper Tiny** - 105 MB - Speech-to-text
- **Piper TTS** - 65 MB - Text-to-speech
- **Silero VAD v5** - 5 MB - Voice activity detection

---

## 📦 Installation

All libraries are already installed. To reinstall:

```bash
npm install
```

To update all dependencies:

```bash
npm update
```

To check for outdated packages:

```bash
npm outdated
```

---

## 🔒 Security & Licenses

### **License Breakdown:**
- **MIT**: 17 libraries (most permissive)
- **Apache 2.0**: 2 libraries
- **BSD**: 2 libraries
- **Proprietary**: 3 libraries (RunAnywhere SDK)

### **Security Audits:**

Check for vulnerabilities:
```bash
npm audit
```

Fix automatically:
```bash
npm audit fix
```

---

## 🚀 Performance Impact

### **Initial Load:**
- Core bundle: ~430 KB (gzipped)
- React: ~130 KB
- React Router: ~50 KB
- Document libs: ~50 KB (lazy loaded)
- AI SDK: ~100 KB (core only)

### **Runtime:**
- WASM binaries loaded on-demand
- Models cached in IndexedDB
- WebGPU for acceleration (when available)

---

## 🔄 Version Management

Current versions are pinned with `^` (caret) for minor updates:
- `^1.2.3` allows `>=1.2.3 <2.0.0`
- Ensures compatibility while getting patches

**Important versions:**
- React 19: Latest stable
- Vite 6: Latest major version
- TypeScript 5.6: Modern features
- RunAnywhere beta.10: Latest SDK

---

## 📚 Additional Resources

- **React Docs**: https://react.dev
- **Vite Docs**: https://vite.dev
- **TypeScript Docs**: https://www.typescriptlang.org
- **WebGPU Spec**: https://www.w3.org/TR/webgpu/
- **RunAnywhere**: https://runanywhere.ai

---

**Total: 27 libraries powering an on-device AI application!** 🚀
