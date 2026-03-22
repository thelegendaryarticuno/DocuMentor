import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';

interface ChatPanelProps {
  messages: Message[];
  onSend: (text: string) => void;
  isStreaming: boolean;
  onCancel: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSend, isStreaming, onCancel }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-msg chat-msg-${msg.role} ${msg.role === 'user' ? 'right blue' : 'left grey'}`}
            style={{ textAlign: msg.role === 'user' ? 'right' : 'left' }}
          >
            {msg.content}
            {isStreaming && i === messages.length - 1 && msg.role === 'assistant' && (
              <span className="blinking-cursor">|</span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your document..."
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming || !input.trim()}>Send</button>
        {isStreaming && (
          <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
        )}
      </form>
    </div>
  );
};
