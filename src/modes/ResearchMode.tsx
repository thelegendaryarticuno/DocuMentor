import React, { useState, useCallback } from 'react';
import { scanChunk } from '../lib/privacyScanner';
import { ScannerFindings } from '../components/ScannerFindings';
import { ChatPanel } from '../components/ChatPanel';
import { useChat } from '../hooks/useChat';
import { Finding } from '../types';

const DEMO_THESIS = `Social media platforms should be held legally liable for the spread of misinformation on their platforms. These companies have the technical capability to detect and remove false information but choose not to do so because engagement-driven content, including outrage-inducing misinformation, generates more advertising revenue. Just as newspapers can be sued for defamation, social media companies should face legal consequences when their algorithmic amplification of false content causes measurable harm to individuals or society.`;

const RESEARCH_DEBATE_PROMPT = 'You are a research debate assistant playing devil\'s advocate. Take the opposing position and argue with evidence and reasoning. Be fair but tough in your counterarguments.';
const RESEARCH_WRITING_PROMPT = 'You are a research writing assistant. Help improve academic writing clarity, structure, and evidence. Suggest specific improvements.';
const DEFAULT_MODEL_ID = 'lfm2-350m-q4_k_m';

export const ResearchMode: React.FC<{ systemPrompt?: string; modelId?: string }> = ({
  systemPrompt = RESEARCH_DEBATE_PROMPT,
  modelId = DEFAULT_MODEL_ID,
}) => {
  const [thesis, setThesis] = useState('');
  const [thesisLoaded, setThesisLoaded] = useState(false);
  const [mode, setMode] = useState<'debate' | 'writing'>('debate');
  const [showScanner, setShowScanner] = useState(false);
  const [scanFindings, setScanFindings] = useState<Finding[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modeConfirm, setModeConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<'debate' | 'writing' | null>(null);

  const debateChat = useChat({ systemPrompt: RESEARCH_DEBATE_PROMPT, modelId, maxTokens: 500 });
  const writingChat = useChat({ systemPrompt: RESEARCH_WRITING_PROMPT, modelId, maxTokens: 300 });
  const currentChat = mode === 'debate' ? debateChat : writingChat;

  const handleLoadDemo = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setThesis(DEMO_THESIS);
      const findings = scanChunk(DEMO_THESIS);
      setScanFindings(findings);
      setThesisLoaded(true);
      setAcknowledged(true);
      setLoading(false);

      // Auto-trigger first debate message
      setTimeout(() => {
        void debateChat.sendMessage('Start by arguing strongly against this thesis with specific reasons.', DEMO_THESIS);
      }, 500);
    }, 300);
  }, [debateChat]);

  const handlePasteThesis = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setThesis(e.target.value);
  };

  const handleLoadThesis = () => {
    if (!thesis.trim()) return;

    const findings = scanChunk(thesis);
    const hasBlockingFindings = findings.some(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');

    setScanFindings(findings);
    setThesisLoaded(true);

    if (hasBlockingFindings) {
      setShowScanner(true);
    } else {
      setAcknowledged(true);
      setTimeout(() => {
        void debateChat.sendMessage(
          'Start by arguing strongly against this thesis with specific reasons.',
          thesis,
        );
      }, 500);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setThesis(text);

      const findings = scanChunk(text);
      const hasBlockingFindings = findings.some(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');

      setScanFindings(findings);
      setThesisLoaded(true);

      if (hasBlockingFindings) {
        setShowScanner(true);
      } else {
        setAcknowledged(true);
        setTimeout(() => {
          void debateChat.sendMessage(
            'Start by arguing strongly against this thesis with specific reasons.',
            text,
          );
        }, 500);
      }
    };
    reader.readAsText(f);
  };

  const handleScannerProceed = () => {
    setShowScanner(false);
    setAcknowledged(true);
    setTimeout(() => {
      void debateChat.sendMessage(
        'Start by arguing strongly against this thesis with specific reasons.',
        thesis,
      );
    }, 500);
  };

  const handleScannerCancel = () => {
    setThesis('');
    setThesisLoaded(false);
    setScanFindings([]);
    setAcknowledged(false);
    debateChat.clearHistory();
    writingChat.clearHistory();
  };

  const handleModeSwitch = (newMode: 'debate' | 'writing') => {
    if (newMode === mode) return;
    setPendingMode(newMode);
    setModeConfirm(true);
  };

  const confirmModeSwitch = () => {
    if (!pendingMode) return;
    setMode(pendingMode);
    setPendingMode(null);
    setModeConfirm(false);
  };

  // Loading state
  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading demo thesis...</div>;
  }

  // Mode confirmation dialog
  if (modeConfirm) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h3 style={{ marginBottom: '16px' }}>Switch Modes?</h3>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            This will start a new conversation and reset the current chat history.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={() => setModeConfirm(false)}
              style={{
                padding: '10px 20px',
                border: '1px solid #D1D5DB',
                backgroundColor: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmModeSwitch}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Scanner modal
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

  // Empty state
  if (!thesisLoaded) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '20px' }}>Research Mode — Thesis Debate & Writing</h2>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Paste your thesis section:
            </label>
            <textarea
              value={thesis}
              onChange={handlePasteThesis}
              placeholder="Enter your thesis or argument here..."
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={handleLoadThesis}
                disabled={!thesis.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: thesis.trim() ? '#2563EB' : '#D1D5DB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: thesis.trim() ? 'pointer' : 'default',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Load Thesis
              </button>
              <label
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Upload .txt or .md
                <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} accept=".txt,.md" />
              </label>
            </div>
          </div>

          <div style={{ width: '300px', textAlign: 'center' }}>
            <div
              style={{
                padding: '20px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                border: '1px dashed #D1D5DB',
              }}
            >
              <p style={{ marginBottom: '12px', color: '#666' }}>Or try a demo:</p>
              <button
                onClick={handleLoadDemo}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Load Demo Thesis
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main research view
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', backgroundColor: '#FAFAFA', color: '#111827' }}>
      {/* Left: Thesis panel */}
      <div
        style={{
          flex: '40%',
          borderRight: '1px solid #E5E7EB',
          overflow: 'auto',
          padding: '20px',
          backgroundColor: 'white',
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: '#4B5563', fontSize: '12px' }}>YOUR THESIS</label>
          <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
            {thesis.split(/\s+/).length} words
          </p>
        </div>
        <div
          style={{
            backgroundColor: '#F9FAFB',
            padding: '16px',
            borderRadius: '6px',
            lineHeight: '1.6',
            fontSize: '14px',
            color: '#111827',
            whiteSpace: 'pre-wrap',
          }}
        >
          {thesis}
        </div>
        <button
          onClick={() => {
            setThesisLoaded(false);
            setThesis('');
            debateChat.clearHistory();
            writingChat.clearHistory();
          }}
          style={{
            marginTop: '12px',
            width: '100%',
            padding: '8px',
            backgroundColor: '#F3F4F6',
            border: '1px solid #D1D5DB',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#374151',
          }}
        >
          Edit / Replace
        </button>
      </div>

      {/* Right: Chat panel */}
      <div style={{ flex: '60%', display: 'flex', flexDirection: 'column' }}>
        {/* Mode tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', backgroundColor: 'white' }}>
          <button
            onClick={() => handleModeSwitch('debate')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: mode === 'debate' ? 'white' : '#F9FAFB',
              borderBottom: mode === 'debate' ? '2px solid #2563EB' : 'none',
              color: mode === 'debate' ? '#2563EB' : '#666',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: mode === 'debate' ? 600 : 500,
            }}
          >
            💬 Debate
          </button>
          <button
            onClick={() => handleModeSwitch('writing')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: mode === 'writing' ? 'white' : '#F9FAFB',
              borderBottom: mode === 'writing' ? '2px solid #2563EB' : 'none',
              color: mode === 'writing' ? '#2563EB' : '#666',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: mode === 'writing' ? 600 : 500,
            }}
          >
            ✍ Writing Help
          </button>
        </div>

        {/* Chat */}
        {acknowledged && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {currentChat.error && (
              <div
                style={{
                  margin: '12px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#FEF2F2',
                  color: '#991B1B',
                  border: '1px solid #FCA5A5',
                  fontSize: '13px',
                }}
              >
                {currentChat.error}
              </div>
            )}
            <ChatPanel
              key={mode}
              messages={currentChat.messages}
              onSend={(text) => { void currentChat.sendMessage(text, thesis); }}
              isStreaming={currentChat.isStreaming}
              isWarmingUp={currentChat.isWarmingUp}
              onCancel={currentChat.cancelGeneration}
              placeholder={
                mode === 'debate'
                  ? 'Continue the debate...'
                  : 'Ask for help improving your writing...'
              }
              disabled={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};
