import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectCapabilities } from '@runanywhere/web';
import { TeachCard } from '../components/TeachCard';
import { useTeach } from '../hooks/useTeach';
import { getAccelerationMode } from '../runanywhere';

const DEMO_DOC = `In React, useEffect runs after the component renders. It is useful for syncing your UI with external systems like APIs, timers, or subscriptions. If you pass an empty dependency array, it runs once after mount. If you pass dependencies, it re-runs when they change. Returning a cleanup function helps prevent memory leaks by unsubscribing before the next run or unmount.`;

const STUDENT_SOURCE_TEXT_KEY = 'docuMentor.studentMode.sourceText';
const STUDENT_SOURCE_FILENAME_KEY = 'docuMentor.studentMode.filename';
const ACCEPTED_TEXT_FILE_TYPES = '.txt,.md,.js,.ts,.tsx,.jsx,.json,.csv,.html,.htm,.css,.xml';

export function StudentMode() {
  const navigate = useNavigate();
  const sourceRef = useRef<HTMLTextAreaElement | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [filename, setFilename] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [accelerationLabel, setAccelerationLabel] = useState('Checking acceleration...');
  const [storageLabel, setStorageLabel] = useState('Checking local model storage...');
  const {
    teach,
    classifying,
    teaching,
    classify,
    payload,
    error,
    stage,
    statusText,
    reset,
  } = useTeach();

  useEffect(() => {
    try {
      const savedText = sessionStorage.getItem(STUDENT_SOURCE_TEXT_KEY);
      const savedFilename = sessionStorage.getItem(STUDENT_SOURCE_FILENAME_KEY);

      if (savedText && !sourceText) setSourceText(savedText);
      if (savedFilename && !filename) setFilename(savedFilename);
    } catch {
      // ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            ? `GPU acceleration available${mode ? ` (${mode})` : ' (WebGPU)'}. Intel Arc and other supported GPUs can help here.`
            : `GPU acceleration is not active${mode ? ` (${mode})` : ''}. The model will run on CPU/WebAssembly fallback.`,
        );
        setStorageLabel(
          caps.hasOPFS
            ? 'Persistent model cache is available in browser OPFS, so refresh should reuse the downloaded model files.'
            : 'Persistent OPFS storage is unavailable, so model files may be kept only for the current session.',
        );
      } catch {
        if (!active) return;
        const mode = getAccelerationMode();
        setAccelerationLabel(
          mode ? `Acceleration mode: ${mode}` : 'Could not detect acceleration mode yet.',
        );
        setStorageLabel('Could not confirm browser storage capabilities yet.');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const wordEstimate = useMemo(() => countWords(sourceText), [sourceText]);
  const tokenEstimate = useMemo(() => Math.ceil(wordEstimate * 1.3), [wordEstimate]);

  const selectedText = useMemo(() => {
    if (!selection) return '';
    if (selection.end <= selection.start) return '';
    return sourceText.slice(selection.start, selection.end).trim();
  }, [selection, sourceText]);

  const selectedWords = useMemo(() => countWords(selectedText), [selectedText]);
  const selectedTokenEstimate = useMemo(() => Math.ceil(selectedWords * 1.3), [selectedWords]);

  const canTeach = sourceText.trim().length > 0 && !classifying && !teaching;
  const canTeachSelection = selectedText.length > 0 && !classifying && !teaching;

  const sourcePreview = useMemo(() => {
    const text = selectedText || sourceText;
    return text.slice(0, 260);
  }, [selectedText, sourceText]);

  const captureSelection = () => {
    const el = sourceRef.current;
    if (!el) return;
    setSelection({ start: el.selectionStart, end: el.selectionEnd });
  };

  const clearSelection = () => {
    const el = sourceRef.current;
    setSelection(null);
    if (el) {
      el.selectionStart = 0;
      el.selectionEnd = 0;
      el.focus();
    }
  };

  const clearSession = () => {
    setSourceText('');
    setFilename(null);
    setSelection(null);
    reset();

    try {
      sessionStorage.removeItem(STUDENT_SOURCE_TEXT_KEY);
      sessionStorage.removeItem(STUDENT_SOURCE_FILENAME_KEY);
    } catch {
      // ignore
    }
  };

  const loadDemo = () => {
    setFilename('react-useEffect-demo.txt');
    setSourceText(DEMO_DOC);
    setSelection(null);
    reset();
  };

  const onRunTeach = async (preferSelection: boolean) => {
    const base = preferSelection && selectedText ? selectedText : sourceText;
    const trimmed = trimToWordLimit(base, 800);
    await teach(trimmed);
  };

  const onUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isLikelyText =
      file.type.startsWith('text/') ||
      /\.(txt|md|js|ts|tsx|jsx|json|csv|html|htm|css|xml)$/i.test(file.name);

    if (!isLikelyText) {
      reset();
      event.target.value = '';
      return;
    }

    try {
      const rawText = await file.text();
      const nextText = extractTeachableUploadText(file.name, rawText);
      setFilename(file.name);
      setSourceText(nextText);
      setSelection(null);
      reset();
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div
      style={{
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background:
          'radial-gradient(circle at top left, rgba(14, 165, 233, 0.18), transparent 28%), linear-gradient(180deg, #F8FAFC 0%, #E2E8F0 100%)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.32)',
          background: 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', color: '#0F172A' }}>Guided Study Mode</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569' }}>
            Session-only source memory, grounded lesson cards, and hands-on practice for docs that teach by doing.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          style={ghostButtonStyle}
        >
          Back Home
        </button>
      </header>

      <main
        style={{
          maxWidth: '1320px',
          margin: '20px auto 0 auto',
          padding: '0 16px 30px 16px',
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 460px) minmax(0, 1fr)',
          gap: '18px',
          alignItems: 'start',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <section
          className="guided-study-sidebar"
          style={{
            border: '1px solid rgba(148, 163, 184, 0.28)',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.88)',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            position: 'sticky',
            top: '20px',
            alignSelf: 'start',
            height: 'calc(100vh - 122px)',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <div style={{ display: 'grid', gap: '6px' }}>
            <p style={labelStyle}>Student source</p>
            <h2 style={{ margin: 0, color: '#0F172A', fontSize: '24px' }}>Teach from a confusing chunk</h2>
            <p style={{ margin: 0, color: '#64748B', lineHeight: 1.6, fontSize: '14px' }}>
              Best speed comes from keeping the source under about 800 words. Highlight a subsection if only one part is confusing.
            </p>
          </div>

          <div
            style={{
              borderRadius: '18px',
              border: '1px solid rgba(14, 165, 233, 0.18)',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(99, 102, 241, 0.05))',
              padding: '14px',
              display: 'grid',
              gap: '8px',
            }}
          >
            <p style={{ margin: 0, color: '#0F172A', fontWeight: 700 }}>Privacy</p>
            <p style={{ margin: 0, color: '#475569', lineHeight: 1.6, fontSize: '14px' }}>
              Your lesson source is kept only in <code>sessionStorage</code> for this browser tab. Clear Session removes it immediately.
            </p>
            <p style={{ margin: 0, color: '#475569', lineHeight: 1.6, fontSize: '14px' }}>
              Downloaded webpage support: saved <code>.html</code>/<code>.htm</code> files are converted into readable text before teaching.
            </p>
          </div>

          <textarea
            ref={sourceRef}
            value={sourceText}
            onChange={(event) => {
              setSourceText(event.target.value);
              setSelection(null);
              reset();
            }}
            onSelect={captureSelection}
            placeholder="Paste docs, code, notes, API explanations, or a topic description you want simplified..."
            style={{
              minHeight: '320px',
              resize: 'vertical',
              borderRadius: '18px',
              border: '1px solid #CBD5E1',
              padding: '14px',
              fontSize: '14px',
              lineHeight: 1.7,
              color: '#0F172A',
              background: '#FFFFFF',
            }}
          />

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                void onRunTeach(true);
              }}
              disabled={!canTeachSelection}
              style={primaryButtonStyle(canTeachSelection)}
            >
              {classifying || teaching ? 'Teaching...' : 'Teach Selection'}
            </button>

            <button
              onClick={() => {
                void onRunTeach(false);
              }}
              disabled={!canTeach}
              style={secondaryPrimaryButtonStyle(canTeach)}
            >
              {classifying || teaching ? 'Teaching...' : 'Teach Full Source'}
            </button>

            <label style={ghostButtonStyle}>
              Upload text file
              <input
                type="file"
                accept={ACCEPTED_TEXT_FILE_TYPES}
                style={{ display: 'none' }}
                onChange={(event) => {
                  void onUploadFile(event);
                }}
              />
            </label>

            <button onClick={loadDemo} style={ghostButtonStyle}>
              Load Demo
            </button>

            <button onClick={clearSelection} disabled={!selection} style={ghostButtonStyleDisabled(!selection)}>
              Clear Selection
            </button>

            <button onClick={clearSession} style={dangerGhostButtonStyle}>
              Clear Session
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '10px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            }}
          >
            <Stat label="Words" value={String(wordEstimate)} />
            <Stat label="Approx tokens" value={String(tokenEstimate)} />
            <Stat label="Selected tokens" value={String(selectedTokenEstimate)} />
          </div>

          <div
            style={{
              border: '1px dashed #94A3B8',
              borderRadius: '18px',
              padding: '14px',
              background: '#F8FAFC',
              color: '#334155',
              fontSize: '14px',
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>Selection-aware teaching</p>
            <p style={{ margin: '6px 0 0 0' }}>
              Highlight a subsection, then teach just that part so the model spends its context on the exact confusing bit.
            </p>
            <p style={{ margin: '8px 0 0 0', color: '#475569' }}>
              {selectedText
                ? `Preview: ${sourcePreview}${selectedText.length > sourcePreview.length ? '...' : ''}`
                : 'No highlighted subsection yet. The full source will be used.'}
            </p>
          </div>

          <div
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '18px',
              padding: '14px',
              background: '#FFFFFF',
              display: 'grid',
              gap: '6px',
              color: '#334155',
              fontSize: '14px',
            }}
          >
            <p style={{ margin: 0 }}>File: {filename ?? 'None'}</p>
            <p style={{ margin: 0 }}>Status: {statusText}</p>
            <p style={{ margin: 0 }}>Fastest path: keep the source short, specific, and text-only.</p>
            <p style={{ margin: 0 }}>{accelerationLabel}</p>
            <p style={{ margin: 0 }}>{storageLabel}</p>
          </div>

          {error && (
            <div
              style={{
                borderRadius: '14px',
                border: '1px solid #FCA5A5',
                background: '#FEF2F2',
                color: '#991B1B',
                padding: '12px 14px',
                fontSize: '14px',
                lineHeight: 1.6,
              }}
            >
              {error}
            </div>
          )}
        </section>

        <section
          className="guided-study-scroll"
          style={{
            minHeight: 0,
            height: 'calc(100vh - 122px)',
            overflowY: 'scroll',
            overflowX: 'hidden',
            paddingRight: '4px',
          }}
        >
          <TeachCard
            classify={classify}
            payload={payload}
            classifying={classifying}
            teaching={teaching}
            stage={stage}
            statusText={statusText}
          />
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: '18px',
        background: '#FFFFFF',
        border: '1px solid rgba(148, 163, 184, 0.28)',
        padding: '14px',
      }}
    >
      <p style={{ margin: 0, color: '#64748B', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
        {label}
      </p>
      <p style={{ margin: '8px 0 0 0', color: '#0F172A', fontSize: '22px', fontWeight: 800 }}>{value}</p>
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

const labelStyle = {
  margin: 0,
  color: '#0284C7',
  fontWeight: 800,
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
};

const ghostButtonStyle = {
  border: '1px solid #94A3B8',
  background: '#FFFFFF',
  color: '#0F172A',
  borderRadius: '999px',
  padding: '10px 14px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '13px',
};

function ghostButtonStyleDisabled(disabled: boolean) {
  return {
    ...ghostButtonStyle,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
  };
}

function primaryButtonStyle(enabled: boolean) {
  return {
    border: 'none',
    background: enabled ? 'linear-gradient(90deg, #0284C7, #0EA5E9)' : '#94A3B8',
    color: '#FFFFFF',
    borderRadius: '999px',
    padding: '11px 16px',
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontWeight: 800,
    fontSize: '13px',
  };
}

function secondaryPrimaryButtonStyle(enabled: boolean) {
  return {
    border: 'none',
    background: enabled ? 'linear-gradient(90deg, #0F172A, #334155)' : '#94A3B8',
    color: '#FFFFFF',
    borderRadius: '999px',
    padding: '11px 16px',
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontWeight: 800,
    fontSize: '13px',
  };
}

const dangerGhostButtonStyle = {
  border: '1px solid #FCA5A5',
  background: '#FFFFFF',
  color: '#B91C1C',
  borderRadius: '999px',
  padding: '10px 14px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '13px',
};
