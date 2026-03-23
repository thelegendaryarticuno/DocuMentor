import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
        <div style={{ 
          padding: '16px 24px', 
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#6B7280',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#374151';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
            }}
          >
            ← Back
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
              Research Mode
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>
              Thesis Debate & Writing Assistant
            </p>
          </div>
        </div>

        <div style={{ padding: '40px 24px', maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: '#111827' }}>
                📝 Paste your thesis section:
              </label>
              <textarea
                value={thesis}
                onChange={handlePasteThesis}
                placeholder="Enter your thesis, argument, or essay section here..."
                style={{
                  width: '100%',
                  minHeight: '240px',
                  padding: '16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  onClick={handleLoadThesis}
                  disabled={!thesis.trim()}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: thesis.trim() ? '#10B981' : '#D1D5DB',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: thesis.trim() ? 'pointer' : 'default',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (thesis.trim()) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#059669';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (thesis.trim()) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10B981';
                    }
                  }}
                >
                  Load Thesis
                </button>
                <label
                  style={{
                    padding: '10px 24px',
                    backgroundColor: 'white',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  📤 Upload .txt or .md
                  <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} accept=".txt,.md" />
                </label>
              </div>
            </div>

            <div>
              <div
                style={{
                  padding: '32px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  textAlign: 'center',
                  height: 'fit-content',
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎯</div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#111827' }}>
                  Try Demo Thesis
                </h3>
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
                  Load a sample thesis to see how debate and writing features work
                </p>
                <button
                  onClick={handleLoadDemo}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2563EB';
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3B82F6';
                  }}
                >
                  Load Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main research view
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#FAFAFA' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#6B7280',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#374151';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
          }}
        >
          ← Home
        </button>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>
          Research Mode
        </h2>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Thesis panel */}
        <div
          style={{
            flex: '35%',
            borderRight: '1px solid #E5E7EB',
            overflow: 'auto',
            padding: '20px',
            backgroundColor: 'white',
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: 600 }}>YOUR THESIS</label>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
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
              marginBottom: '16px',
              minHeight: '200px',
              maxHeight: 'calc(100vh - 300px)',
              overflow: 'auto'
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
              width: '100%',
              padding: '10px',
              backgroundColor: '#F3F4F6',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#374151',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E5E7EB';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F3F4F6';
            }}
          >
            📝 Edit / Replace
          </button>
        </div>

        {/* Right: Chat panel */}
        <div style={{ flex: '65%', display: 'flex', flexDirection: 'column', backgroundColor: '#FAFAFA' }}>
          {/* Mode tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', backgroundColor: 'white' }}>
            <button
              onClick={() => handleModeSwitch('debate')}
              style={{
                flex: 1,
                padding: '12px 16px',
                backgroundColor: mode === 'debate' ? 'white' : '#F9FAFB',
                borderBottom: mode === 'debate' ? '3px solid #10B981' : 'none',
                color: mode === 'debate' ? '#10B981' : '#6B7280',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: mode === 'debate' ? 600 : 500,
                transition: 'all 0.2s'
              }}
            >
              💬 Debate
            </button>
            <button
              onClick={() => handleModeSwitch('writing')}
              style={{
                flex: 1,
                padding: '12px 16px',
                backgroundColor: mode === 'writing' ? 'white' : '#F9FAFB',
                borderBottom: mode === 'writing' ? '3px solid #10B981' : 'none',
                color: mode === 'writing' ? '#10B981' : '#6B7280',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: mode === 'writing' ? 600 : 500,
                transition: 'all 0.2s'
              }}
            >
              ✍️ Writing Help
            </button>
          </div>

          {/* Chat */}
          {acknowledged && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
    </div>
  );
};
