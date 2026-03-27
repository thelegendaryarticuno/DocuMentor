import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';

interface ChatPanelProps {
  messages: Message[];
  onSend: (text: string) => void;
  isStreaming: boolean;
  isWarmingUp?: boolean;
  onCancel: () => void;
  placeholder?: string;
  emptyStateText?: string;
  disabled?: boolean;
  disabledReason?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSend,
  isStreaming,
  isWarmingUp = false,
  onCancel,
  placeholder = 'Ask anything about your document...',
  emptyStateText = 'Upload a document and ask anything...',
  disabled = false,
  disabledReason,
}) => {
  const [input, setInput] = useState('');
  const [streamElapsedMs, setStreamElapsedMs] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (!isStreaming) {
      setStreamElapsedMs(0);
      return;
    }

    const startedAt = Date.now();
    setStreamElapsedMs(0);
    const interval = setInterval(() => {
      setStreamElapsedMs(Date.now() - startedAt);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isStreaming]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || disabled) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim() || isStreaming || disabled) return;
      onSend(input);
      setInput('');
    }
  };

  const generationStatus = !isStreaming
    ? null
    : streamElapsedMs < 60_000
      ? 'Thinking...'
      : streamElapsedMs < 120_000
        ? 'Evaluating the counterexample...'
        : 'Structuring your answer...';

  return (
    <div className="chat-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="chat-messages" style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>
            <p>{emptyStateText}</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isLastAssistantStreamingPlaceholder =
            isStreaming &&
            i === messages.length - 1 &&
            msg.role === 'assistant' &&
            !msg.content;

          return (
          <div
            key={msg.id}
            className={`message message-${msg.role}`}
            style={{
              marginBottom: '12px',
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: msg.role === 'user' ? '#2563EB' : '#F3F4F6',
                color: msg.role === 'user' ? 'white' : 'black',
                wordWrap: 'break-word',
              }}
            >
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                {msg.content || (isLastAssistantStreamingPlaceholder ? generationStatus : '')}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', opacity: 0.6 }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid #eee' }}>
        {disabled ? (
          <div style={{ padding: '12px', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '4px' }}>
            {disabledReason || 'Chat is disabled'}
          </div>
        ) : (
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isStreaming}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontFamily: 'inherit',
                fontSize: '14px',
                minHeight: '40px',
                maxHeight: '100px',
                resize: 'vertical',
                opacity: isStreaming ? 0.5 : 1,
              }}
              rows={1}
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                style={{
                  padding: '10px 16px',
                  borderRadius: '4px',
                  backgroundColor: isStreaming || !input.trim() ? '#D1D5DB' : '#2563EB',
                  color: 'white',
                  border: 'none',
                  cursor: isStreaming || !input.trim() ? 'default' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Send
              </button>
              {isStreaming && (
                <button
                  type="button"
                  onClick={onCancel}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '4px',
                    backgroundColor: '#EF4444',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
