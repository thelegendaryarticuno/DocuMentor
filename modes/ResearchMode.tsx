import React, { useState, useMemo } from 'react';
import { scanChunk, redactChunk } from '../lib/privacyScanner';
import { ScannerFindings } from '../components/ScannerFindings';
import { ChatPanel } from '../components/ChatPanel';
import { useChat } from '../hooks/useChat';
import { Message, Finding } from '../types';

// Assume useDocument and prompts are imported and available
// import { useDocument } from '../useDocument';
// import { RESEARCH_DEBATE_PROMPT, RESEARCH_WRITING_PROMPT } from '../prompts';

interface ResearchModeProps {
  thesis: string;
  docChunks: string[];
  modelId: string;
  debatePrompt: string;
  writingPrompt: string;
}

export const ResearchMode: React.FC<ResearchModeProps> = ({ thesis, docChunks, modelId, debatePrompt, writingPrompt }) => {
  const [writingHelp, setWritingHelp] = useState(false);
  const [ack, setAck] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Scan all chunks for findings
  const allFindings = useMemo(() => docChunks.flatMap(scanChunk), [docChunks]);
  const hasCriticalOrHigh = allFindings.some(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');
  const redactedChunks = useMemo(
    () => hasCriticalOrHigh ? docChunks.map(chunk => redactChunk(chunk, scanChunk(chunk))) : docChunks,
    [docChunks, hasCriticalOrHigh]
  );
  const docChunk = redactedChunks.join('\n\n');
  const systemPrompt = writingHelp ? writingPrompt : debatePrompt;
  const chat = useChat({ systemPrompt, docChunk, modelId });

  // Reset chat history on mode switch
  const handleToggle = () => {
    if (window.confirm('Switching modes will reset chat history. Continue?')) {
      setWritingHelp(w => !w);
      setResetKey(k => k + 1);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, borderRight: '1px solid #eee', overflow: 'auto', padding: 16 }}>
        <h3>Thesis</h3>
        <div style={{ whiteSpace: 'pre-wrap' }}>{thesis}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!ack && hasCriticalOrHigh ? (
          <ScannerFindings findings={allFindings} onAcknowledge={() => setAck(true)} />
        ) : (
          <>
            <ChatPanel
              key={resetKey}
              messages={chat.messages}
              onSend={chat.sendMessage}
              isStreaming={chat.isStreaming}
              onCancel={chat.cancelGeneration}
            />
            <div style={{ marginTop: 8 }}>
              <label>
                <input type="checkbox" checked={writingHelp} onChange={handleToggle} /> Writing Help
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
