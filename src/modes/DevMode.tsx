import React, { useState, useMemo, useCallback } from 'react';
import { scanAllChunks } from '../lib/privacyScanner';
import { ScannerFindings } from '../components/ScannerFindings';
import { ChatPanel } from '../components/ChatPanel';
import { useChat } from '../hooks/useChat';
import { Finding, ScanResult } from '../types';

const DEMO_FILE = `AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STRIPE_SECRET_KEY=sk_live_REDACTED_EXAMPLE_KEY
DATABASE_URL=postgres://admin:supersecret@db.example.com:5432/proddb
GITHUB_TOKEN=ghp_ExampleTokenHere1234567890abcdef
API_BASE_URL=https://api.example.com
NODE_ENV=production
PORT=3000`;

const DEV_QA_PROMPT = 'You are a helpful developer assistant. Explain the code, configuration, or document clearly. Answer questions about what it does and potential issues.';
const DEFAULT_MODEL_ID = 'lfm2-350m-q4_k_m';

export const DevMode: React.FC<{ systemPrompt?: string; modelId?: string }> = ({
  systemPrompt = DEV_QA_PROMPT,
  modelId = DEFAULT_MODEL_ID,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [docText, setDocText] = useState('');
  const [chunks, setChunks] = useState<string[]>([]);
  const [redactedChunks, setRedactedChunks] = useState<string[]>([]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chat = useChat({ systemPrompt, modelId, maxTokens: 300 });

  const handleLoadDemo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate chunking (split into 2000 char chunks)
      const newChunks = [];
      for (let i = 0; i < DEMO_FILE.length; i += 2000) {
        newChunks.push(DEMO_FILE.slice(i, i + 2000));
      }

      const result = scanAllChunks(newChunks);
      const redactedChunks = result.redactedText.split('\n\n');
      setScanResult(result);
      setRedactedChunks(redactedChunks);
      setChunks(newChunks);
      setDocText(DEMO_FILE);

      // Create a fake file object
      const blob = new Blob([DEMO_FILE], { type: 'text/plain' });
      const file = new File([blob], '.env (demo)', { type: 'text/plain' });
      setFile(file);

      if (result.hasBlockingFindings) {
        setShowScanner(true);
      } else {
        setAcknowledged(true);
        // Auto-send first message for demo
        setTimeout(() => {
          void chat.sendMessage('What secrets are in this file?', redactedChunks[0]);
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load demo');
    } finally {
      setLoading(false);
    }
  }, [chat]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;

      setLoading(true);
      setError(null);
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const text = reader.result as string;
          const newChunks = [];
          for (let i = 0; i < text.length; i += 2000) {
            newChunks.push(text.slice(i, i + 2000));
          }

          const result = scanAllChunks(newChunks);
          const redactedChunks = result.redactedText.split('\n\n');
          setScanResult(result);
          setRedactedChunks(redactedChunks);
          setChunks(newChunks);
          setDocText(text);
          setFile(f);
          setAcknowledged(false);

          if (result.hasBlockingFindings) {
            setShowScanner(true);
          } else {
            setAcknowledged(true);
            setTimeout(() => {
              void chat.sendMessage('What does this file contain?', redactedChunks[0]);
            }, 500);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to read file');
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setLoading(false);
      };

      reader.readAsText(f);
    },
    []
  );

  const handleScannerProceed = (updatedFindings: Finding[]) => {
    setScanResult(prev => (prev ? { ...prev, findings: updatedFindings } : null));
    setShowScanner(false);
    setAcknowledged(true);

    // Auto-trigger first message
    setTimeout(() => {
      void chat.sendMessage('What does this file contain?', redactedChunks[0]);
    }, 500);
  };

  const handleScannerCancel = () => {
    setFile(null);
    setDocText('');
    setChunks([]);
    setRedactedChunks([]);
    setScanResult(null);
    setShowScanner(false);
    setAcknowledged(false);
    chat.clearHistory();
  };

  const mediumLowFindings = scanResult?.findings.filter(f => f.severity === 'MEDIUM' || f.severity === 'LOW') || [];
  const redactedCount = scanResult?.findings.filter(
    f => f.severity === 'CRITICAL' || f.severity === 'HIGH' || !f.ignored
  ).length || 0;

  // Empty state
  if (!file) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '16px' }}>Dev Mode — Configuration & Code Analysis</h2>
        <div
          style={{
            border: '2px dashed #D1D5DB',
            borderRadius: '8px',
            padding: '40px',
            marginBottom: '20px',
            backgroundColor: '#F9FAFB',
          }}
        >
          <p style={{ fontSize: '16px', marginBottom: '16px', color: '#666' }}>
            Drop a .env, config file, code doc, or any text document
          </p>
          <label
            style={{
              position: 'relative',
              cursor: 'pointer',
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#2563EB',
              color: 'white',
              borderRadius: '6px',
              fontWeight: 500,
            }}
          >
            Choose File
            <input
              type="file"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".env,.txt,.md,.js,.ts,.json,.yaml,.yml,.config"
            />
          </label>
        </div>

        <button
          onClick={handleLoadDemo}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'default' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Loading...' : 'Load Demo .env File'}
        </button>

        {error && <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '4px' }}>{error}</div>}
      </div>
    );
  }

  // Scanner blocking modal
  if (showScanner && scanResult) {
    return (
      <ScannerFindings
        findings={scanResult.findings}
        onProceed={handleScannerProceed}
        onCancel={handleScannerCancel}
        filename={file.name}
      />
    );
  }

  // Main chat view
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', backgroundColor: '#FAFAFA' }}>
      {/* Left: Document Viewer */}
      <div style={{ flex: '40%', borderRight: '1px solid #E5E7EB', overflow: 'auto', padding: '20px' }}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: '#999', fontSize: '12px' }}>DOCUMENT (redacted view)</label>
          <div
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              backgroundColor: '#DBEAFE',
              color: '#1E40AF',
              borderRadius: '3px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {redactedCount} redacted
          </div>
        </div>
        <pre
          style={{
            backgroundColor: 'white',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
            border: '1px solid #E5E7EB',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
        >
          {redactedChunks[0] || docText}
        </pre>

        {mediumLowFindings.length > 0 && (
          <div
            style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: '#FFFBEB',
              color: '#92400E',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            ⚠️ {mediumLowFindings.length} low-risk pattern(s) were found and redacted. AI will see the cleaned version.
          </div>
        )}
      </div>

      {/* Right: Chat */}
      <div style={{ flex: '60%', display: 'flex', flexDirection: 'column' }}>
        {redactedCount > 0 && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#DBEAFE',
              borderBottom: '1px solid #E5E7EB',
              fontSize: '12px',
              color: '#1E40AF',
            }}
          >
            🔒 {redactedCount} secrets redacted · AI sees cleaned version only
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {!acknowledged ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Processing file...</div>
          ) : (
            <>
              {chat.error && (
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
                  {chat.error}
                </div>
              )}
              <ChatPanel
                messages={chat.messages}
                onSend={(text) => { void chat.sendMessage(text, redactedChunks[0]); }}
                isStreaming={chat.isStreaming}
                isWarmingUp={chat.isWarmingUp}
                onCancel={chat.cancelGeneration}
                disabled={false}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
