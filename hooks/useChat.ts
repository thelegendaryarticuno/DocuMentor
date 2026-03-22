import { useState, useRef } from 'react';
import { Message } from '../types';
import { RunAnywhere } from '../src/runanywhere';

export type ModelID = string;

interface UseChatParams {
  systemPrompt: string;
  docChunk: string;
  modelId: ModelID;
}

interface UseChatResult {
  messages: Message[];
  sendMessage: (text: string) => void;
  isStreaming: boolean;
  cancelGeneration: () => void;
}

export function useChat({ systemPrompt, docChunk, modelId }: UseChatParams): UseChatResult {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'user',
    content: docChunk
  }]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = (text: string) => {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    let assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);

    // @ts-ignore: TextGeneration is available from RunAnywhere
    const TextGeneration = RunAnywhere.TextGeneration;
    TextGeneration.generate({
      model: modelId,
      prompt: `${systemPrompt}\n${docChunk}\n${text}`,
      stream: true,
      onToken: (token: string) => {
        assistantMsg = { role: 'assistant', content: assistantMsg.content + token };
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last.role === 'assistant') {
            return [...prev.slice(0, -1), assistantMsg];
          }
          return prev;
        });
      },
      signal: controller.signal,
      onEnd: () => setIsStreaming(false),
      onError: () => setIsStreaming(false)
    });
  };

  const cancelGeneration = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  return { messages, sendMessage, isStreaming, cancelGeneration };
}
