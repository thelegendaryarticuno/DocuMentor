import { useEffect, useMemo, useRef, useState, type ChangeEvent, type RefObject } from 'react';
import { detectCapabilities } from '@runanywhere/web';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { scanChunk } from '../lib/privacyScanner';
import { ScannerFindings } from '../components/ScannerFindings';
import { ChatPanel } from '../components/ChatPanel';
import { TeachCard } from '../components/TeachCard';
import { useChat } from '../hooks/useChat';
import { useTeach } from '../hooks/useTeach';
import { getAccelerationMode, getHardwareAccelerationInfo } from '../runanywhere';
import { Finding } from '../types';

const DEFAULT_MODEL_ID = 'lfm2-350m-q4_k_m';
const DEMO_THESIS = `Social media platforms should be held legally liable for the spread of misinformation on their platforms. These companies have the technical capability to detect and remove false information but choose not to do so because engagement-driven content, including outrage-inducing misinformation, generates more advertising revenue. Just as newspapers can be sued for defamation, social media companies should face legal consequences when their algorithmic amplification of false content causes measurable harm to individuals or society.`;
const DEMO_DOC = `In React, useEffect runs after the component renders. It is useful for syncing your UI with external systems like APIs, timers, or subscriptions. If you pass an empty dependency array, it runs once after mount. If you pass dependencies, it re-runs when they change. Returning a cleanup function helps prevent memory leaks by unsubscribing before the next run or unmount.`;
const RESEARCH_DEBATE_PROMPT = 'Play devil\'s advocate. Argue the opposing view with evidence. Be tough but fair.';
const RESEARCH_WRITING_PROMPT = 'Improve writing: clarity, structure, evidence. Give specific suggestions.';
const STUDENT_SOURCE_TEXT_KEY = 'docuMentor.studentMode.sourceText';
const STUDENT_SOURCE_FILENAME_KEY = 'docuMentor.studentMode.filename';
const ACCEPTED_TEXT_FILE_TYPES = '.txt,.md,.js,.ts,.tsx,.jsx,.json,.csv,.html,.htm,.css,.xml';

type ChatbotMode = 'research' | 'guided-learning';
type ResearchTab = 'debate' | 'writing';

const modeMeta: Record<ChatbotMode, {
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  surface: string;
}> = {
  research: {
    label: 'Research',
    eyebrow: 'Debate + writing coach',
    title: 'Pressure-test ideas before they go on paper',
    description: 'Paste a thesis, load the demo, and switch between debate and writing help in one panel.',
    accent: 'linear-gradient(135deg, #FB7185, #F97316)',
    surface: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,244,240,0.9))',
  },
  'guided-learning': {
    label: 'Guided Learning',
    eyebrow: 'Explain + teach back',
    title: 'Turn dense text into a lesson you can actually learn from',
    description: 'Drop in notes, docs, or code and get structured explanation cards grounded in your source.',
    accent: 'linear-gradient(135deg, #0EA5E9, #2563EB)',
    surface: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(239,246,255,0.92))',
  },
};

export function ChatbotPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMode = searchParams.get('mode');
  const initialMode: ChatbotMode = requestedMode === 'guided-learning' ? 'guided-learning' : 'research';
  const [activeMode, setActiveMode] = useState<ChatbotMode>(initialMode);
  const [researchTab, setResearchTab] = useState<ResearchTab>('debate');
  const [thesis, setThesis] = useState('');
  const [thesisLoaded, setThesisLoaded] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanFindings, setScanFindings] = useState<Finding[]>([]);
  const [researchLoading, setResearchLoading] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [filename, setFilename] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [accelerationLabel, setAccelerationLabel] = useState('Checking acceleration...');
  const [storageLabel, setStorageLabel] = useState('Checking local model storage...');
  const sourceRef = useRef<HTMLTextAreaElement | null>(null);
  const demoHandledRef = useRef(false);
  const gpuInfo = getHardwareAccelerationInfo();

  const debateChat = useChat({ systemPrompt: RESEARCH_DEBATE_PROMPT, modelId: DEFAULT_MODEL_ID, maxTokens: 150 });
  const writingChat = useChat({ systemPrompt: RESEARCH_WRITING_PROMPT, modelId: DEFAULT_MODEL_ID, maxTokens: 100 });
  const currentResearchChat = researchTab === 'debate' ? debateChat : writingChat;
  const {
    teach,
    classifying,
    teaching,
    classify,
    payload,
    error: teachError,
    stage,
    statusText,
    reset: resetTeach,
  } = useTeach();

  useEffect(() => {
    const nextMode: ChatbotMode = requestedMode === 'guided-learning' ? 'guided-learning' : 'research';
    setActiveMode(nextMode);
  }, [requestedMode]);

  useEffect(() => {
    try {
      const savedText = sessionStorage.getItem(STUDENT_SOURCE_TEXT_KEY);
      const savedFilename = sessionStorage.getItem(STUDENT_SOURCE_FILENAME_KEY);
      if (savedText) setSourceText((current) => current || savedText);
      if (savedFilename) setFilename((current) => current || savedFilename);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      if (sourceText) sessionStorage.setItem(STUDENT_SOURCE_TEXT_KEY, sourceText);
      else sessionStorage.removeItem(STUDENT_SOURCE_TEXT_KEY);
    } catch {
      // ignore
    }
  }, [sourceText]);

  useEffect(() => {
    try {
      if (filename) sessionStorage.setItem(STUDENT_SOURCE_FILENAME_KEY, filename);
      else sessionStorage.removeItem(STUDENT_SOURCE_FILENAME_KEY);
    } catch {
      // ignore
    }
  }, [filename]);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const caps = await detectCapabilities();
        const mode = getAccelerationMode();

        if (!active) return;

        setAccelerationLabel(
          mode?.toLowerCase().includes('webgpu') || caps.hasWebGPU
            ? `GPU acceleration available${mode ? ` (${mode})` : ' (WebGPU)'}.`
            : `GPU acceleration is not active${mode ? ` (${mode})` : ''}. CPU/WebAssembly fallback will be used.`,
        );
        setStorageLabel(
          caps.hasOPFS
            ? 'Persistent browser storage is available, so model downloads should be reused.'
            : 'Persistent storage is unavailable, so model files may need to reload next session.',
        );
      } catch {
        if (!active) return;
        const mode = getAccelerationMode();
        setAccelerationLabel(mode ? `Acceleration mode: ${mode}` : 'Could not detect acceleration mode yet.');
        setStorageLabel('Could not confirm browser storage capabilities yet.');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (demoHandledRef.current || searchParams.get('demo') !== '1') return;
    demoHandledRef.current = true;
    if (activeMode === 'guided-learning') {
      loadGuidedDemo();
      return;
    }
    void loadResearchDemo();
  }, [activeMode, searchParams]);

  const wordEstimate = useMemo(() => countWords(sourceText), [sourceText]);
  const tokenEstimate = useMemo(() => Math.ceil(wordEstimate * 1.3), [wordEstimate]);
  const selectedText = useMemo(() => {
    if (!selection || selection.end <= selection.start) return '';
    return sourceText.slice(selection.start, selection.end).trim();
  }, [selection, sourceText]);
  const selectedWords = useMemo(() => countWords(selectedText), [selectedText]);
  const selectedTokenEstimate = useMemo(() => Math.ceil(selectedWords * 1.3), [selectedWords]);
  const sourcePreview = useMemo(() => (selectedText || sourceText).slice(0, 220), [selectedText, sourceText]);
  const canTeach = sourceText.trim().length > 0 && !classifying && !teaching;
  const canTeachSelection = selectedText.length > 0 && !classifying && !teaching;

  async function loadResearchDemo() {
    setResearchLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    setThesis(DEMO_THESIS);
    setScanFindings(scanChunk(DEMO_THESIS));
    setThesisLoaded(true);
    setResearchLoading(false);
    setResearchTab('debate');
    debateChat.clearHistory();
    writingChat.clearHistory();
    setTimeout(() => {
      void debateChat.sendMessage('Start by arguing strongly against this thesis with specific reasons.', DEMO_THESIS);
    }, 300);
  }

  function loadGuidedDemo() {
    setFilename('react-useEffect-demo.txt');
    setSourceText(DEMO_DOC);
    setSelection(null);
    resetTeach();
  }

  function updateMode(mode: ChatbotMode) {
    setActiveMode(mode);
    const next = new URLSearchParams(searchParams);
    next.set('mode', mode);
    next.delete('demo');
    setSearchParams(next, { replace: true });
  }

  function handleLoadThesis() {
    if (!thesis.trim()) return;
    const findings = scanChunk(thesis);
    const hasBlockingFindings = findings.some((finding) => finding.severity === 'CRITICAL' || finding.severity === 'HIGH');
    setScanFindings(findings);
    setThesisLoaded(true);
    debateChat.clearHistory();
    writingChat.clearHistory();

    if (hasBlockingFindings) {
      setShowScanner(true);
      return;
    }

    setResearchTab('debate');
    setTimeout(() => {
      void debateChat.sendMessage('Start by arguing strongly against this thesis with specific reasons.', thesis);
    }, 300);
  }

  function handleResearchFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setThesis(text);
      const findings = scanChunk(text);
      const hasBlockingFindings = findings.some((finding) => finding.severity === 'CRITICAL' || finding.severity === 'HIGH');
      setScanFindings(findings);
      setThesisLoaded(true);
      debateChat.clearHistory();
      writingChat.clearHistory();

      if (hasBlockingFindings) {
        setShowScanner(true);
      } else {
        setResearchTab('debate');
        setTimeout(() => {
          void debateChat.sendMessage('Start by arguing strongly against this thesis with specific reasons.', text);
        }, 300);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function handleScannerProceed() {
    setShowScanner(false);
    setResearchTab('debate');
    setTimeout(() => {
      void debateChat.sendMessage('Start by arguing strongly against this thesis with specific reasons.', thesis);
    }, 300);
  }

  function handleScannerCancel() {
    setShowScanner(false);
    setThesis('');
    setThesisLoaded(false);
    setScanFindings([]);
    debateChat.clearHistory();
    writingChat.clearHistory();
  }

  function resetResearch() {
    setThesis('');
    setThesisLoaded(false);
    setScanFindings([]);
    setShowScanner(false);
    debateChat.clearHistory();
    writingChat.clearHistory();
  }

  function captureSelection() {
    const el = sourceRef.current;
    if (!el) return;
    setSelection({ start: el.selectionStart, end: el.selectionEnd });
  }

  function clearSelection() {
    const el = sourceRef.current;
    setSelection(null);
    if (!el) return;
    el.selectionStart = 0;
    el.selectionEnd = 0;
    el.focus();
  }

  function clearGuidedSession() {
    setSourceText('');
    setFilename(null);
    setSelection(null);
    resetTeach();
    try {
      sessionStorage.removeItem(STUDENT_SOURCE_TEXT_KEY);
      sessionStorage.removeItem(STUDENT_SOURCE_FILENAME_KEY);
    } catch {
      // ignore
    }
  }

  async function onRunTeach(preferSelection: boolean) {
    const base = preferSelection && selectedText ? selectedText : sourceText;
    const trimmed = trimToWordLimit(base, 800);
    await teach(trimmed);
  }

  async function onUploadGuidedFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const isLikelyText =
      file.type.startsWith('text/') ||
      /\.(txt|md|js|ts|tsx|jsx|json|csv|html|htm|css|xml)$/i.test(file.name);

    if (!isLikelyText) {
      resetTeach();
      event.target.value = '';
      return;
    }

    try {
      const rawText = await file.text();
      const nextText = extractTeachableUploadText(file.name, rawText);
      setFilename(file.name);
      setSourceText(nextText);
      setSelection(null);
      resetTeach();
    } finally {
      event.target.value = '';
    }
  }

  if (showScanner) {
    return (
      <ScannerFindings
        findings={scanFindings}
        onProceed={handleScannerProceed}
        onCancel={handleScannerCancel}
        filename="thesis.txt"
      />
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        overflowY: 'auto',
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(249, 115, 22, 0.14), transparent 24%), radial-gradient(circle at top right, rgba(14, 165, 233, 0.18), transparent 22%), linear-gradient(180deg, #07111F 0%, #101C2F 42%, #EFF6FF 42%, #F8FAFC 100%)',
        color: '#0F172A',
      }}
    >
      <div style={{ maxWidth: '1420px', margin: '0 auto', padding: '24px 20px 36px' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '26px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'grid', gap: '8px' }}>
            <button onClick={() => navigate('/')} style={backButtonStyle}>
              ← Back Home
            </button>
            <div>
              <p style={{ margin: 0, color: '#BFDBFE', fontSize: '12px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Unified Chatbot
              </p>
              <h1 style={{ margin: '8px 0 0', color: '#F8FAFC', fontSize: 'clamp(2.4rem, 5vw, 4.4rem)', lineHeight: 0.96 }}>
                One workspace, two ways to think.
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <StatusPill label={gpuInfo.isActive ? 'GPU Accelerated' : 'CPU Mode'} value={gpuInfo.gpuInfo?.description ?? 'On-device AI'} />
            <StatusPill label="Active mode" value={modeMeta[activeMode].label} />
          </div>
        </header>

        <section
          className="chatbot-mode-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '18px',
            marginBottom: '22px',
          }}
        >
          {(Object.keys(modeMeta) as ChatbotMode[]).map((mode) => {
            const meta = modeMeta[mode];
            const isActive = activeMode === mode;
            return (
              <button
                key={mode}
                onClick={() => updateMode(mode)}
                style={{
                  ...modeCardButtonStyle,
                  background: meta.surface,
                  border: isActive ? '1px solid rgba(15, 23, 42, 0.2)' : '1px solid rgba(148, 163, 184, 0.26)',
                  boxShadow: isActive ? '0 22px 60px rgba(15, 23, 42, 0.2)' : '0 14px 36px rgba(15, 23, 42, 0.12)',
                  transform: isActive ? 'translateY(-2px)' : 'none',
                }}
              >
                <div style={{ display: 'grid', gap: '10px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                    <span style={eyebrowStyle}>{meta.eyebrow}</span>
                    <span style={{ ...activeBadgeStyle, background: meta.accent, opacity: isActive ? 1 : 0.78 }}>
                      {isActive ? 'Open now' : 'Switch to mode'}
                    </span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: '28px', color: '#0F172A', lineHeight: 1 }}>{meta.label}</h2>
                  <p style={{ margin: 0, color: '#334155', lineHeight: 1.6, fontSize: '15px' }}>{meta.description}</p>
                </div>
              </button>
            );
          })}
        </section>

        <section
          style={{
            borderRadius: '30px',
            background: '#F8FAFC',
            border: '1px solid rgba(255, 255, 255, 0.42)',
            boxShadow: '0 36px 80px rgba(15, 23, 42, 0.22)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '24px',
              borderBottom: '1px solid rgba(148, 163, 184, 0.24)',
              background: activeMode === 'research' ? modeMeta.research.surface : modeMeta['guided-learning'].surface,
            }}
          >
            <div style={{ display: 'grid', gap: '10px' }}>
              <p style={eyebrowStyle}>{modeMeta[activeMode].eyebrow}</p>
              <h2 style={{ margin: 0, fontSize: 'clamp(1.8rem, 3vw, 3rem)', lineHeight: 1 }}>{modeMeta[activeMode].title}</h2>
              <p style={{ margin: 0, color: '#475569', maxWidth: '760px', lineHeight: 1.7 }}>
                {activeMode === 'research'
                  ? 'The message box, prompts, and side panels change to match the current research workflow, while keeping your thesis grounded in the conversation.'
                  : 'The input area becomes source-first so you can select text, upload notes, or teach a demo chunk and get the same lesson-card output as the current guided-learning route.'}
              </p>
            </div>
          </div>

          <div style={{ padding: '22px' }}>
            {activeMode === 'research' ? (
              <ResearchWorkspace
                thesis={thesis}
                setThesis={setThesis}
                thesisLoaded={thesisLoaded}
                researchLoading={researchLoading}
                researchTab={researchTab}
                setResearchTab={setResearchTab}
                currentResearchChat={currentResearchChat}
                onLoadDemo={() => {
                  void loadResearchDemo();
                }}
                onLoadThesis={handleLoadThesis}
                onResetResearch={resetResearch}
                onResearchFileUpload={handleResearchFileUpload}
              />
            ) : (
              <GuidedLearningWorkspace
                sourceRef={sourceRef}
                sourceText={sourceText}
                filename={filename}
                setSourceText={setSourceText}
                selectedText={selectedText}
                selection={selection}
                captureSelection={captureSelection}
                clearSelection={clearSelection}
                canTeach={canTeach}
                canTeachSelection={canTeachSelection}
                onRunTeach={onRunTeach}
                onUploadGuidedFile={onUploadGuidedFile}
                onLoadDemo={loadGuidedDemo}
                onClearSession={clearGuidedSession}
                resetTeach={resetTeach}
                setSelection={setSelection}
                classifying={classifying}
                teaching={teaching}
                classify={classify}
                payload={payload}
                stage={stage}
                statusText={statusText}
                error={teachError}
                wordEstimate={wordEstimate}
                tokenEstimate={tokenEstimate}
                selectedTokenEstimate={selectedTokenEstimate}
                sourcePreview={sourcePreview}
                accelerationLabel={accelerationLabel}
                storageLabel={storageLabel}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ResearchWorkspace({
  thesis,
  setThesis,
  thesisLoaded,
  researchLoading,
  researchTab,
  setResearchTab,
  currentResearchChat,
  onLoadDemo,
  onLoadThesis,
  onResetResearch,
  onResearchFileUpload,
}: {
  thesis: string;
  setThesis: (value: string) => void;
  thesisLoaded: boolean;
  researchLoading: boolean;
  researchTab: ResearchTab;
  setResearchTab: (mode: ResearchTab) => void;
  currentResearchChat: ReturnType<typeof useChat>;
  onLoadDemo: () => void;
  onLoadThesis: () => void;
  onResetResearch: () => void;
  onResearchFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  if (!thesisLoaded) {
    return (
    <div
      className="chatbot-research-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.45fr) minmax(280px, 0.8fr)',
          gap: '18px',
        }}
      >
        <section style={workspacePanelStyle}>
          <p style={eyebrowStyle}>Research input</p>
          <h3 style={{ margin: '8px 0 10px', fontSize: '28px', color: '#0F172A' }}>Paste the idea you want challenged</h3>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>
            Once loaded, the chat box adapts between a debate assistant and a writing coach without leaving this page.
          </p>

          <textarea
            value={thesis}
            onChange={(event) => setThesis(event.target.value)}
            placeholder="Paste a thesis statement, paragraph, argument, or essay section..."
            style={largeTextareaStyle}
          />

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={onLoadThesis} disabled={!thesis.trim()} style={primaryActionStyle(Boolean(thesis.trim()))}>
              Load into chatbot
            </button>
            <label style={secondaryActionStyle}>
              Upload text file
              <input type="file" accept=".txt,.md" style={{ display: 'none' }} onChange={onResearchFileUpload} />
            </label>
          </div>
        </section>

        <aside style={{ ...workspacePanelStyle, background: 'linear-gradient(180deg, #0F172A, #1E293B)', color: '#F8FAFC' }}>
          <p style={{ ...eyebrowStyle, color: '#93C5FD' }}>Demo</p>
          <h3 style={{ margin: '8px 0 10px', fontSize: '28px' }}>Open a ready-made debate</h3>
          <p style={{ margin: 0, color: '#CBD5E1', lineHeight: 1.7 }}>
            Jump straight into the sample thesis so you can review the unified chatbot flow immediately.
          </p>
          <div style={{ marginTop: 'auto' }}>
            <button onClick={onLoadDemo} style={demoButtonStyle}>
              {researchLoading ? 'Loading demo...' : 'Try demo'}
            </button>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div
      className="chatbot-research-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 0.78fr) minmax(0, 1.22fr)',
        gap: '18px',
        minHeight: '72vh',
      }}
    >
      <section style={{ ...workspacePanelStyle, gap: '16px' }}>
        <div>
          <p style={eyebrowStyle}>Loaded thesis</p>
          <h3 style={{ margin: '8px 0 6px', fontSize: '26px', color: '#0F172A' }}>Document context locked in</h3>
          <p style={{ margin: 0, color: '#64748B' }}>{countWords(thesis)} words in context</p>
        </div>

        <div
          style={{
            borderRadius: '22px',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            background: '#FFFFFF',
            padding: '18px',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7,
            color: '#0F172A',
            overflow: 'auto',
            minHeight: '220px',
          }}
        >
          {thesis}
        </div>

        <button onClick={onResetResearch} style={secondaryActionStyle}>
          Replace thesis
        </button>
      </section>

      <section style={{ ...workspacePanelStyle, minHeight: '72vh', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '18px 18px 0' }}>
          <div style={{ display: 'inline-flex', gap: '8px', background: '#E2E8F0', padding: '6px', borderRadius: '999px' }}>
            <button onClick={() => setResearchTab('debate')} style={researchTabStyle(researchTab === 'debate')}>
              Research
            </button>
            <button onClick={() => setResearchTab('writing')} style={researchTabStyle(researchTab === 'writing')}>
              Writing help
            </button>
          </div>

          {currentResearchChat.error && (
            <div style={errorBannerStyle}>
              {currentResearchChat.error}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <ChatPanel
            key={researchTab}
            messages={currentResearchChat.messages}
            onSend={(text) => {
              void currentResearchChat.sendMessage(text, thesis);
            }}
            isStreaming={currentResearchChat.isStreaming}
            isWarmingUp={currentResearchChat.isWarmingUp}
            onCancel={currentResearchChat.cancelGeneration}
            placeholder={
              researchTab === 'debate'
                ? 'Ask for objections, counterarguments, or evidence gaps...'
                : 'Ask for editing help, clarity fixes, or stronger structure...'
            }
            emptyStateText={
              researchTab === 'debate'
                ? 'Your thesis is loaded. Ask the chatbot to challenge assumptions, find weaknesses, or propose opposing evidence.'
                : 'Your thesis is loaded. Ask the chatbot to improve clarity, structure, tone, or evidence use.'
            }
          />
        </div>
      </section>
    </div>
  );
}

function GuidedLearningWorkspace({
  sourceRef,
  sourceText,
  filename,
  setSourceText,
  selectedText,
  selection,
  captureSelection,
  clearSelection,
  canTeach,
  canTeachSelection,
  onRunTeach,
  onUploadGuidedFile,
  onLoadDemo,
  onClearSession,
  classifying,
  teaching,
  classify,
  payload,
  stage,
  statusText,
  error,
  wordEstimate,
  tokenEstimate,
  selectedTokenEstimate,
  sourcePreview,
  accelerationLabel,
  storageLabel,
  resetTeach,
  setSelection,
}: {
  sourceRef: RefObject<HTMLTextAreaElement | null>;
  sourceText: string;
  filename: string | null;
  setSourceText: (value: string) => void;
  selectedText: string;
  selection: { start: number; end: number } | null;
  captureSelection: () => void;
  clearSelection: () => void;
  canTeach: boolean;
  canTeachSelection: boolean;
  onRunTeach: (preferSelection: boolean) => Promise<void>;
  onUploadGuidedFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onLoadDemo: () => void;
  onClearSession: () => void;
  classifying: boolean;
  teaching: boolean;
  classify: ReturnType<typeof useTeach>['classify'];
  payload: ReturnType<typeof useTeach>['payload'];
  stage: ReturnType<typeof useTeach>['stage'];
  statusText: string;
  error: string | null;
  wordEstimate: number;
  tokenEstimate: number;
  selectedTokenEstimate: number;
  sourcePreview: string;
  accelerationLabel: string;
  storageLabel: string;
  resetTeach: ReturnType<typeof useTeach>['reset'];
  setSelection: (value: { start: number; end: number } | null) => void;
}) {
  return (
    <div
      className="chatbot-guided-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 470px) minmax(0, 1fr)',
        gap: '18px',
        alignItems: 'start',
      }}
    >
      <section style={{ ...workspacePanelStyle, position: 'sticky', top: '22px' }}>
        <div>
          <p style={eyebrowStyle}>Learning input</p>
          <h3 style={{ margin: '8px 0 10px', fontSize: '28px', color: '#0F172A' }}>Teach from a confusing chunk</h3>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>
            Highlight a subsection for a focused explanation, or teach the full source if you want the whole thing unpacked.
          </p>
        </div>

        <textarea
          ref={sourceRef}
          value={sourceText}
          onChange={(event) => {
            setSourceText(event.target.value);
            resetTeach();
            if (selection) setSelection(null);
          }}
          onSelect={captureSelection}
          placeholder="Paste docs, notes, code, or concept explanations you want turned into a guided lesson..."
          style={largeTextareaStyle}
        />

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => { void onRunTeach(true); }} disabled={!canTeachSelection} style={primaryActionStyle(canTeachSelection)}>
            {classifying || teaching ? 'Teaching...' : 'Teach selection'}
          </button>
          <button onClick={() => { void onRunTeach(false); }} disabled={!canTeach} style={darkActionStyle(canTeach)}>
            {classifying || teaching ? 'Teaching...' : 'Teach full source'}
          </button>
          <label style={secondaryActionStyle}>
            Upload text file
            <input
              type="file"
              accept={ACCEPTED_TEXT_FILE_TYPES}
              style={{ display: 'none' }}
              onChange={(event) => {
                void onUploadGuidedFile(event);
              }}
            />
          </label>
          <button onClick={onLoadDemo} style={secondaryActionStyle}>
            Try demo
          </button>
          <button onClick={clearSelection} disabled={!selection} style={secondaryDisabledStyle(!selection)}>
            Clear selection
          </button>
          <button onClick={onClearSession} style={dangerActionStyle}>
            Clear session
          </button>
        </div>

        <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
          <MetricCard label="Words" value={String(wordEstimate)} />
          <MetricCard label="Approx tokens" value={String(tokenEstimate)} />
          <MetricCard label="Selected tokens" value={String(selectedTokenEstimate)} />
        </div>

        <div style={infoCardStyle}>
          <p style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>Selection-aware teaching</p>
          <p style={{ margin: '6px 0 0', color: '#475569', lineHeight: 1.7 }}>
            {selectedText
              ? `Preview: ${sourcePreview}${selectedText.length > sourcePreview.length ? '...' : ''}`
              : 'Highlight a subsection to spend the lesson budget on one exact confusing area.'}
          </p>
        </div>

        <div style={infoCardStyle}>
          <p style={{ margin: 0 }}>File: {filename ?? 'None'}</p>
          <p style={{ margin: '6px 0 0' }}>Status: {statusText}</p>
          <p style={{ margin: '6px 0 0' }}>{accelerationLabel}</p>
          <p style={{ margin: '6px 0 0' }}>{storageLabel}</p>
        </div>

        {error && <div style={errorBannerStyle}>{error}</div>}
      </section>

      <section style={{ ...workspacePanelStyle, minHeight: '72vh' }}>
        <TeachCard
          classify={classify}
          payload={payload}
          classifying={classifying}
          teaching={teaching}
          stage={stage}
          statusText={statusText}
        />
      </section>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: '999px',
        padding: '12px 16px',
        border: '1px solid rgba(148, 163, 184, 0.26)',
        background: 'rgba(15, 23, 42, 0.5)',
        color: '#E2E8F0',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#93C5FD' }}>{label}</p>
      <p style={{ margin: '6px 0 0', fontSize: '14px', fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ ...infoCardStyle, padding: '14px 16px' }}>
      <p style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', fontWeight: 800 }}>{label}</p>
      <p style={{ margin: '8px 0 0', fontSize: '24px', color: '#0F172A', fontWeight: 800 }}>{value}</p>
    </div>
  );
}

function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function trimToWordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(' ');
}

function extractTeachableUploadText(filename: string, rawText: string): string {
  if (!/\.(html?|xhtml)$/i.test(filename)) return rawText;
  if (typeof DOMParser === 'undefined') return rawText;

  const doc = new DOMParser().parseFromString(rawText, 'text/html');
  doc.querySelectorAll('script, style, noscript').forEach((node) => node.remove());
  const title = doc.querySelector('title')?.textContent?.trim();
  const bodyText = doc.body?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  return [title, bodyText].filter(Boolean).join('\n\n') || rawText;
}

const backButtonStyle = {
  border: '1px solid rgba(148, 163, 184, 0.25)',
  background: 'rgba(15, 23, 42, 0.48)',
  color: '#E2E8F0',
  borderRadius: '999px',
  padding: '10px 14px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '13px',
};

const modeCardButtonStyle = {
  borderRadius: '24px',
  padding: '22px',
  textAlign: 'left' as const,
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
};

const workspacePanelStyle = {
  borderRadius: '26px',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  background: '#FFFFFF',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '14px',
};

const largeTextareaStyle = {
  minHeight: '320px',
  width: '100%',
  resize: 'vertical' as const,
  borderRadius: '22px',
  border: '1px solid #CBD5E1',
  padding: '16px',
  fontSize: '14px',
  lineHeight: 1.7,
  color: '#0F172A',
  background: '#FFFFFF',
  fontFamily: 'inherit',
};

const eyebrowStyle = {
  margin: 0,
  color: '#0284C7',
  fontWeight: 800,
  fontSize: '12px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
};

const activeBadgeStyle = {
  color: '#FFFFFF',
  borderRadius: '999px',
  padding: '8px 12px',
  fontWeight: 700,
  fontSize: '12px',
};

function primaryActionStyle(enabled: boolean) {
  return {
    border: 'none',
    background: enabled ? 'linear-gradient(90deg, #F97316, #EF4444)' : '#CBD5E1',
    color: '#FFFFFF',
    borderRadius: '999px',
    padding: '12px 16px',
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontWeight: 800,
    fontSize: '13px',
  };
}

function darkActionStyle(enabled: boolean) {
  return {
    border: 'none',
    background: enabled ? 'linear-gradient(90deg, #0F172A, #334155)' : '#CBD5E1',
    color: '#FFFFFF',
    borderRadius: '999px',
    padding: '12px 16px',
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontWeight: 800,
    fontSize: '13px',
  };
}

const secondaryActionStyle = {
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  color: '#0F172A',
  borderRadius: '999px',
  padding: '11px 15px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '13px',
};

function secondaryDisabledStyle(disabled: boolean) {
  return {
    ...secondaryActionStyle,
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

const dangerActionStyle = {
  border: '1px solid #FCA5A5',
  background: '#FFFFFF',
  color: '#B91C1C',
  borderRadius: '999px',
  padding: '11px 15px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '13px',
};

const demoButtonStyle = {
  width: '100%',
  border: 'none',
  background: 'linear-gradient(90deg, #38BDF8, #2563EB)',
  color: '#FFFFFF',
  borderRadius: '999px',
  padding: '13px 16px',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: '14px',
};

const infoCardStyle = {
  borderRadius: '20px',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  background: '#F8FAFC',
  color: '#334155',
  padding: '14px',
  lineHeight: 1.6,
  fontSize: '14px',
};

const errorBannerStyle = {
  marginTop: '14px',
  borderRadius: '16px',
  border: '1px solid #FCA5A5',
  background: '#FEF2F2',
  color: '#991B1B',
  padding: '12px 14px',
  fontSize: '14px',
  lineHeight: 1.6,
};

function researchTabStyle(active: boolean) {
  return {
    border: 'none',
    background: active ? '#FFFFFF' : 'transparent',
    color: active ? '#0F172A' : '#475569',
    borderRadius: '999px',
    padding: '10px 16px',
    fontWeight: active ? 800 : 700,
    cursor: 'pointer',
    boxShadow: active ? '0 10px 24px rgba(15, 23, 42, 0.12)' : 'none',
  };
}
