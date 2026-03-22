# DocuMentor — Copilot Master Prompt (Indraneel)
# Paste this entire file into Copilot Chat before asking for any code.

---

## WHO YOU ARE HELPING

You are helping Indraneel complete his half of DocuMentor — a hackathon project.
DocuMentor is a 100% browser-based, privacy-first document AI platform.
No backend. No server. No API keys. All AI runs locally in the browser via WebAssembly.
The tagline: "Your documents. Your device. Your AI."

Indraneel's job: build the chat engine, privacy scanner, Dev mode, and Research mode.
Naman (teammate) builds everything else. Do not touch Naman's files.

---

## TECH STACK

- React 19 + Vite + TypeScript (strict mode, no `any` types ever)
- RunAnywhere Web SDK — already installed in starter. Imports from `./runanywhere`
- LFM2-350M — the local LLM model used for Dev mode and Research mode
- LFM2-1.2B-Tool — Naman's model for Legal mode. Indraneel does not use this.
- pdfjs-dist — PDF parsing (Naman's code, already handles this)
- IndexedDB — only persistence allowed. No localStorage. No cookies.
- Zero fetch() or axios calls for AI. Ever.

---

## STARTER CODE THAT ALREADY EXISTS — DO NOT REWRITE

These files are in the starter kit. Import from them. Never rewrite them.

```
src/runanywhere.ts         — model catalog, TextGeneration class, generateStream()
src/hooks/useModelLoader.ts — model download progress, isModelReady state
src/components/ModelBanner.tsx — shows model download progress bar
```

The key import you will use constantly:
```typescript
import { TextGeneration, ModelID } from '../runanywhere'
import { useModelLoader } from '../hooks/useModelLoader'
```

TextGeneration.generateStream() is an async generator that yields string tokens one by one.
useModelLoader() returns { isModelReady, downloadProgress, loadModel }.

---

## NAMAN'S FILES — NEVER GENERATE CODE FOR THESE

```
src/lib/extractText.ts       — PDF/TXT/MD → plain string
src/lib/chunkDoc.ts          — splits text into ≤1500 token chunks
src/lib/prompts.ts           — system prompts for all modes
src/hooks/useDocument.ts     — file upload state, calls extractText + chunkDoc
src/components/DropZone.tsx  — drag and drop file upload UI
src/components/ModeSelector.tsx — 3-tab Legal/Dev/Research switcher
src/components/DocViewer.tsx — scrollable document preview panel
src/components/PrivacyBadge.tsx — "100% local" trust badge
src/modes/LegalMode.tsx      — clause risk cards (Legal mode UI)
src/App.tsx                  — app shell and routing
src/styles/index.css         — design tokens
```

useDocument hook returns:
```typescript
{
  doc: { raw: string, chunks: string[], filename: string } | null,
  isLoading: boolean,
  error: string | null,
  loadFile: (file: File) => void
}
```

prompts.ts exports (use these, don't hardcode prompts):
```typescript
export const RESEARCH_DEBATE_PROMPT: string
export const RESEARCH_WRITING_PROMPT: string
export const DEV_QA_PROMPT: string
```

---

## INDRANEEL'S 6 FILES — BUILD ALL OF THESE

```
src/hooks/useChat.ts
src/lib/privacyScanner.ts
src/components/ChatPanel.tsx
src/components/ScannerFindings.tsx
src/modes/DevMode.tsx
src/modes/ResearchMode.tsx
```

---

## CORE INTERFACES — DEFINE THESE AT THE TOP OF THE FIRST FILE, THEN IMPORT EVERYWHERE

```typescript
// src/types.ts — create this file first

export interface Finding {
  id: string                                          // unique, use crypto.randomUUID()
  type: string                                        // e.g. "AWS Access Key"
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  match: string                                       // the actual matched string
  preview: string                                     // first 4 chars + "****"
  remediation: string                                 // plain English fix instruction
  ignored: boolean                                    // user can ignore MEDIUM/LOW
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ScanResult {
  findings: Finding[]
  redactedText: string
  hasBlockingFindings: boolean                        // true if any CRITICAL or HIGH not ignored
}
```

---

## THE PIPELINE — SACRED ORDER, NEVER BREAK THIS

```
1. User drops file
   → DropZone.tsx (Naman) triggers useDocument.ts (Naman)

2. Text extracted
   → extractText.ts (Naman) reads PDF/TXT/MD entirely client-side

3. Text chunked
   → chunkDoc.ts (Naman) splits into ≤1500 token blocks

4. *** SCANNER RUNS HERE — BEFORE ANYTHING ELSE ***
   → privacyScanner.scanChunk() runs on EVERY chunk
   → returns Finding[] with severity ratings

5. Gate check
   → if any CRITICAL or HIGH findings that are not ignored:
   → show ScannerFindings modal — USER MUST CONFIRM before proceeding
   → do not call useChat at all until user confirms

6. Redact
   → privacyScanner.redactChunk() replaces all findings with [REDACTED-TYPE]
   → store redacted chunks in state

7. LLM call
   → useChat receives: systemPrompt + redacted chunk + message history
   → calls TextGeneration.generateStream()
   → streams tokens back

8. Render
   → ChatPanel receives streaming tokens and renders in real time
```

---

## FILE 1 — src/types.ts

Create this file first. All other files import from here.
Content: the interfaces defined above (Finding, Message, ScanResult).
Also export a helper:
```typescript
export function createMessage(role: 'user' | 'assistant', content: string): Message
```

---

## FILE 2 — src/lib/privacyScanner.ts

Pure TypeScript. No async. No imports from RunAnywhere. Just regex logic.

### Regex patterns to implement:

| Type                  | Pattern                                          | Severity  | Remediation                                      |
|-----------------------|--------------------------------------------------|-----------|--------------------------------------------------|
| AWS Access Key        | /AKIA[0-9A-Z]{16}/g                              | CRITICAL  | Rotate key immediately in AWS IAM console        |
| AWS Secret Key        | /(?<![A-Za-z0-9])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9])/g (near 'aws' or 'secret') | CRITICAL | Rotate in AWS IAM. Never commit to git.     |
| Stripe Secret Key     | /sk_live_[0-9a-zA-Z]{24,}/g                      | CRITICAL  | Rotate in Stripe Dashboard immediately           |
| Stripe Test Key       | /sk_test_[0-9a-zA-Z]{24,}/g                      | HIGH      | Do not expose test keys in documents             |
| GitHub Token          | /ghp_[A-Za-z0-9]{36}/g                           | CRITICAL  | Revoke in GitHub Settings > Developer tokens     |
| GitHub OAuth          | /gho_[A-Za-z0-9]{36}/g                           | CRITICAL  | Revoke in GitHub OAuth Apps settings             |
| Private Key Header    | /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g | CRITICAL | Never store private keys in documents            |
| JWT Token             | /eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*/g | HIGH | Invalidate token. Check expiry and claims.  |
| .env variable         | /^[A-Z][A-Z0-9_]{2,}=.+$/gm                     | HIGH      | Move secrets to a secrets manager               |
| MongoDB URI           | /mongodb(\+srv)?:\/\/.+:.+@/g                    | HIGH      | Rotate DB credentials. Use env vars.             |
| Postgres URI          | /postgres(ql)?:\/\/.+:.+@/g                      | HIGH      | Rotate DB credentials. Use env vars.             |
| MySQL URI             | /mysql:\/\/.+:.+@/g                              | HIGH      | Rotate DB credentials. Use env vars.             |
| Email Address         | /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g | MEDIUM | Verify intentional inclusion of PII             |
| Indian Phone Number   | /(?<!\d)[6-9]\d{9}(?!\d)/g                       | MEDIUM    | Verify intentional inclusion of personal data    |
| IP Address            | /\b(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g | LOW | Check if internal IP should be in document |

### Functions to export:

```typescript
// Scan a single chunk of text, return all findings
export function scanChunk(text: string): Finding[]

// Redact all findings from text, replace with [REDACTED-TYPE]
// Always redact CRITICAL and HIGH automatically
// Only redact MEDIUM/LOW if finding.ignored === false
export function redactChunk(text: string, findings: Finding[]): string

// Convenience: scan and redact in one call
export function scanAndRedact(text: string): ScanResult

// Scan all chunks, return combined results
export function scanAllChunks(chunks: string[]): { findings: Finding[], redactedChunks: string[], hasBlockingFindings: boolean }
```

---

## FILE 3 — src/hooks/useChat.ts

Wraps TextGeneration from runanywhere.ts. This is the brain of the chat.

```typescript
interface UseChatOptions {
  systemPrompt: string
  modelId: ModelID
}

interface UseChatReturn {
  messages: Message[]
  sendMessage: (userText: string, docChunk?: string) => Promise<void>
  isStreaming: boolean
  cancelGeneration: () => void
  clearHistory: () => void
  error: string | null
}

export function useChat(options: UseChatOptions): UseChatReturn
```

### Implementation rules:

- Import TextGeneration from '../runanywhere'
- Check isModelReady before any generation attempt. If not ready, set error state.
- On sendMessage:
  1. Append user Message to messages state immediately (optimistic update)
  2. Create empty assistant Message and append it
  3. Call TextGeneration.generateStream() with the full conversation history
  4. For each yielded token, append it to the last assistant message content
  5. On stream end, set isStreaming to false
  6. On error, set error state with friendly message
- cancelGeneration: calls the cancel method on the TextGeneration instance
- docChunk injection: if docChunk provided, prepend to system prompt as:
  `${systemPrompt}\n\nDOCUMENT CONTEXT:\n${docChunk}`
- Keep full message history in state for multi-turn conversation
- Never hardcode any prompt text inside this hook

---

## FILE 4 — src/components/ChatPanel.tsx

The reusable streaming chat UI. Used by both DevMode and ResearchMode.

```typescript
interface ChatPanelProps {
  messages: Message[]
  onSend: (text: string) => void
  isStreaming: boolean
  onCancel: () => void
  placeholder?: string
  disabled?: boolean
  disabledReason?: string     // shown as tooltip when disabled
}
```

### UI requirements:

- Message bubbles:
  - User messages: right-aligned, blue background (#2563EB), white text
  - Assistant messages: left-aligned, light grey background (#F3F4F6), dark text
  - Each bubble shows a small timestamp
  - Assistant bubble shows a blinking cursor (|) at the end while isStreaming and it's the last message

- Input area at bottom:
  - Textarea (not input) — supports multi-line with Shift+Enter
  - Enter alone sends the message
  - Disabled entirely while isStreaming
  - Send button: disabled while isStreaming or empty text
  - Cancel button: ONLY visible while isStreaming, clicking calls onCancel

- Empty state: show "Upload a document and ask anything..." centered in grey

- Auto-scroll: always scroll to bottom when new message or new token arrives

- Loading state: if disabled prop is true, show disabledReason instead of input

---

## FILE 5 — src/components/ScannerFindings.tsx

The blocking modal shown when secrets are detected before the LLM sees anything.

```typescript
interface ScannerFindingsProps {
  findings: Finding[]
  onProceed: (updatedFindings: Finding[]) => void   // passes back findings with ignored flags
  onCancel: () => void
  filename: string
}
```

### UI requirements:

- Full-screen overlay modal with dark backdrop (not dismissible by clicking outside)

- Header:
  - Red banner if any CRITICAL: "🚨 X critical secrets detected in [filename]"
  - Orange banner if only HIGH: "⚠ X high-risk patterns detected in [filename]"
  - Subtitle: "These were found before any AI processed your file. Review before proceeding."

- Findings list — for each finding show:
  - Severity badge (CRITICAL=red, HIGH=orange, MEDIUM=yellow, LOW=grey)
  - Type label (e.g. "AWS Access Key")
  - Preview: first 4 chars of match + "**** (redacted)"
  - Remediation text in smaller grey font
  - For MEDIUM and LOW only: "Ignore this finding" toggle checkbox

- Summary before CTA:
  - "X finding(s) will be automatically redacted before the AI sees your document."
  - If MEDIUM/LOW ignored: "X finding(s) marked as ignored will still be redacted."

- CTA buttons:
  - Primary (green): "Proceed with redacted document"
  - Secondary (grey): "Cancel — remove this document"
  - Primary button disabled if any CRITICAL or HIGH findings exist that are not auto-redacted
    (they always are — this is just a safety check)

---

## FILE 6 — src/modes/DevMode.tsx

The Developer mode. File upload → scan → block if needed → Q&A chat about the document.

### Full user flow to implement:

```
Step 1: Empty state
  - Show a large DropZone area (import from Naman: DropZone component)
  - Text: "Drop a .env, config file, code doc, or any text document"
  - Accepted types: .env, .txt, .md, .js, .ts, .json, .yaml, .yml, .config
  - Also show a "Load Demo File" button that loads a pre-written fake .env with secrets

Step 2: File loading
  - Show a loading spinner: "Reading and scanning your document..."
  - Call useDocument.loadFile(file)
  - When doc is ready, immediately run scanAllChunks(doc.chunks)

Step 3: Scanner results
  - If hasBlockingFindings === true:
    - Render ScannerFindings modal (full screen)
    - Pass findings, filename, onProceed, onCancel
    - onCancel: clear doc state, go back to Step 1
    - onProceed: store redacted chunks, dismiss modal, go to Step 4

  - If hasBlockingFindings === false:
    - Skip modal entirely
    - If any MEDIUM/LOW findings: show a small dismissible yellow banner at top
      "X low-risk patterns were found and redacted. AI will see the cleaned version."
    - Go directly to Step 4

Step 4: Chat interface (main view)
  Layout: two-column
  - Left column (40%): DocViewer component (Naman's) showing the REDACTED document text
    - Label at top: "Document (redacted view)" in grey
    - Small badge: show count of redacted items
  - Right column (60%): Chat panel
    - Scanner summary banner pinned at top:
      "X secrets redacted · AI sees cleaned version only · [View findings] link"
    - ChatPanel component wired to useChat with DEV_QA_PROMPT
    - useChat receives one redacted chunk at a time as docChunk
      (use the first chunk by default, or the chunk most relevant to the user's question — simple approach: just use chunk[0] for MVP)
    - Suggested questions shown before first message:
      "What does this config do?"
      "Are there any security risks I should know about?"
      "Explain the database setup in this file"

Step 5: User can ask questions freely
  - Multi-turn conversation maintained
  - Each message injects the redacted doc chunk as context
  - If user uploads a new file: confirm dialog "This will clear the current chat. Continue?"
```

### Demo file content (hardcode this for the "Load Demo" button):
```
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STRIPE_SECRET_KEY=sk_live_REDACTED_EXAMPLE_KEY
DATABASE_URL=postgres://admin:supersecret@db.example.com:5432/proddb
GITHUB_TOKEN=ghp_ExampleTokenHere1234567890abcdef
API_BASE_URL=https://api.example.com
NODE_ENV=production
PORT=3000
```

---

## FILE 7 — src/modes/ResearchMode.tsx

The Research / Debate mode. Upload thesis → AI argues against it → Writing help.

### Full user flow to implement:

```
Step 1: Empty state
  - Two-panel layout visible but left panel shows upload prompt
  - Left panel: Large text area with placeholder "Paste your thesis section here..."
    AND a small "or upload a file" link that opens file picker (.txt, .md, .pdf)
  - Right panel: greyed out with "Upload or paste your thesis to start the debate"
  - "Load Demo Thesis" button: loads a pre-written paragraph about a debatable topic

Step 2: Thesis loaded
  - Left panel: shows the thesis text (read-only, scrollable)
    - Filename or "Pasted text" label at top
    - Character/word count shown
    - "Edit / Replace" button to go back to Step 1
  - Right panel: activates with two sub-mode tabs at top:
    Tab 1: "Debate" (default)
    Tab 2: "Writing Help"

Step 3: Debate mode (Tab 1)
  - ChatPanel wired to useChat with RESEARCH_DEBATE_PROMPT from prompts.ts
  - docChunk = the full thesis text (or first chunk if too long)
  - First message auto-sent on load: DO NOT make user click — automatically trigger:
    sendMessage("") with the thesis as context
    This makes the AI immediately start arguing against the thesis
  - System prompt instructs AI to:
    - Take the opposing position
    - Argue with specific reasons, not just assertions
    - Be a tough but fair devil's advocate
  - Suggested follow-ups shown after first AI response:
    "What's the strongest counterpoint to your argument?"
    "Are there any logical fallacies in my thesis?"
    "What evidence would strengthen my position?"
  - Multi-turn debate continues freely

Step 4: Writing Help mode (Tab 2)
  - Switching tabs shows a confirm: "Switch to Writing Help? This will start a new conversation."
  - New useChat instance with RESEARCH_WRITING_PROMPT
  - The thesis text is still shown in left panel
  - ChatPanel with placeholder: "Ask for help strengthening your argument..."
  - Suggested prompts:
    "Help me make this argument more convincing"
    "What evidence should I add to support this?"
    "Rewrite this section to be clearer"
    "What are the weakest parts of my argument?"
  - Switching BACK to Debate tab also shows confirm and resets that chat too

Step 5: Export (nice to have, build last)
  - "Copy debate summary" button that copies a formatted summary of the debate
```

### Demo thesis content (for "Load Demo" button):
```
Social media platforms should be held legally liable for the spread of misinformation on their platforms. These companies have the technical capability to detect and remove false information but choose not to do so because engagement-driven content, including outrage-inducing misinformation, generates more advertising revenue. Just as newspapers can be sued for defamation, social media companies should face legal consequences when their algorithmic amplification of false content causes measurable harm to individuals or society.
```

---

## OVERALL APP WIRING (how the modes connect)

ModeSelector (Naman) has 3 tabs: Legal | Dev | Research

When Dev tab is active → render DevMode.tsx
When Research tab is active → render ResearchMode.tsx
Legal tab → Naman's LegalMode.tsx

Each mode is fully self-contained. They do not share state with each other.
When user switches tabs, the previous mode's state is preserved (don't unmount/remount).
Use React.memo or keep modes always mounted but hidden with CSS display:none.

---

## ERROR HANDLING — IMPLEMENT FOR EVERY SCENARIO

| Scenario                          | What to show                                              |
|-----------------------------------|-----------------------------------------------------------|
| Model not downloaded yet          | "AI model is loading... X% complete" — disable chat input |
| Model download failed             | "Could not load AI model. Check your connection and reload." |
| LLM returns empty response        | "The AI returned an empty response. Please try again."    |
| LLM times out (>30 seconds)       | "Response is taking too long. Try a shorter question."    |
| File type not supported           | "This file type isn't supported. Try .txt, .md, or .pdf"  |
| PDF has no extractable text       | "This PDF appears to be image-only and can't be read."    |
| Document too large (>50k tokens)  | "Document is too large. Only the first section will be used." |
| Scanner crashes on a chunk        | Catch error, skip that chunk, log to console, continue    |
| User cancels mid-stream           | Stop stream, keep partial response in bubble, show "Cancelled" badge |

---

## THINGS TO NEVER DO

- Never call fetch() or axios for AI inference
- Never add a backend, server, or cloud service
- Never use localStorage or sessionStorage
- Never use `any` type in TypeScript
- Never hardcode system prompts inside useChat
- Never pass raw (un-redacted) text to useChat if CRITICAL/HIGH findings exist
- Never call useChat before privacyScanner has run on the document
- Never rewrite runanywhere.ts or useModelLoader.ts
- Never generate code for Naman's files

---

## BUILD ORDER — DO THIS SEQUENCE, DO NOT SKIP AHEAD

1. src/types.ts — interfaces first, everything imports from here
2. src/lib/privacyScanner.ts — pure logic, no dependencies, testable immediately
3. src/hooks/useChat.ts — depends on runanywhere.ts (already exists)
4. src/components/ChatPanel.tsx — depends on Message type only
5. src/components/ScannerFindings.tsx — depends on Finding type only
6. src/modes/DevMode.tsx — depends on all of the above + Naman's useDocument
7. src/modes/ResearchMode.tsx — depends on useChat + ChatPanel

After each file: tell me what you built and confirm it compiles before moving on.

---

## GIT WORKFLOW

- Branch: feat/indra-chat-engine
- All PRs go to: development (never main)
- Commit after each file: feat(scanner): implement privacyScanner with 10 patterns
- Pull from development before starting each file in case Naman has merged

---

## START COMMAND

When you are ready to begin, say exactly:
"Starting with src/types.ts — generating interfaces"

Then proceed through each file in order without stopping unless you hit a compile error.
Ask me only if you are genuinely blocked. Otherwise keep building.
