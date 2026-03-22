import { useState, useRef, useCallback } from 'react';
import { ModelCategory } from '@runanywhere/web';
import { TextGeneration } from '@runanywhere/web-llamacpp';
import { useModelLoader } from './useModelLoader';
import { Message, createMessage } from '../types';

export type ModelID = string;

export interface UseChatOptions {
  systemPrompt: string;
  modelId: ModelID;
  maxTokens?: number;
}

export interface UseChatReturn {
  messages: Message[];
  sendMessage: (userText: string, docChunk?: string) => Promise<void>;
  isStreaming: boolean;
  isWarmingUp: boolean;
  cancelGeneration: () => void;
  clearHistory: () => void;
  error: string | null;
}

export function useChat({ systemPrompt, modelId, maxTokens = 300 }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const loader = useModelLoader(ModelCategory.Language);

  const sendMessage = useCallback(
    async (userText: string, docChunk?: string) => {
      const normalizedUserText = userText.trim();
      if (!normalizedUserText && !docChunk) return;
      if (isStreaming) return;

      if (loader.state !== 'ready') {
        const ok = await loader.ensure();
        if (!ok) {
          setError('AI model is loading. Please wait and try again.');
          return;
        }
      }

      setError(null);
      setIsWarmingUp(true);
      const effectiveUserText = normalizedUserText || 'Start the analysis using the provided document context.';
      const userMsg = createMessage('user', effectiveUserText);

      const assistantMsg = createMessage('assistant', '');
      const nextMessages = [...messages, userMsg, assistantMsg];
      const assistantIdx = nextMessages.length - 1;
      let timedOutBeforeFirstToken = false;
      let firstTokenTimeout: ReturnType<typeof setTimeout> | null = null;
      setMessages(nextMessages);
      setIsStreaming(true);

      try {
        // Trim context for faster inference in chat modes.
        const trimmedChunk = docChunk
          ? docChunk.split(' ').slice(0, 800).join(' ')
          : '';
        const contextSnippet = trimmedChunk ? trimmedChunk.slice(0, 1200) : '';
        const brevityInstruction = 'Respond concisely in under 120 words unless the user asks for details.';
        const basePrompt = contextSnippet
          ? `${systemPrompt}\n\n${brevityInstruction}\n\nDocument context:\n${contextSnippet}\n\nQuestion: ${effectiveUserText}`
          : `${systemPrompt}\n\n${brevityInstruction}\n\nQuestion: ${effectiveUserText}`;

        const cappedMaxTokens = Math.min(Math.max(maxTokens, 64), 500);
        let accumulated = '';
        let streamPayload: Awaited<ReturnType<typeof TextGeneration.generateStream>>;
        try {
          streamPayload = await TextGeneration.generateStream(basePrompt, {
            maxTokens: cappedMaxTokens,
            temperature: 0.4,
          });
        } catch (streamInitError) {
          const streamErrMsg = streamInitError instanceof Error ? streamInitError.message : String(streamInitError);
          const isSignatureMismatch = /function signature mismatch|streaming generation crashed/i.test(streamErrMsg);
          if (!isSignatureMismatch) throw streamInitError;

          // Fallback to non-stream generation when streaming bindings fail.
          const generated = await TextGeneration.generate(basePrompt, {
            maxTokens: cappedMaxTokens,
            temperature: 0.4,
          });
          const finalText = (generated.text || '').trim() || 'No response generated. Please try again.';
          setIsWarmingUp(false);
          setMessages((prev) => {
            const updated = [...prev];
            const existing = updated[assistantIdx];
            if (existing && existing.role === 'assistant') {
              updated[assistantIdx] = {
                ...existing,
                content: finalText,
              };
            }
            return updated;
          });
          return;
        }

        const { stream, result: resultPromise, cancel } = streamPayload;

        firstTokenTimeout = setTimeout(() => {
          if (!accumulated.trim()) {
            timedOutBeforeFirstToken = true;
            cancel();
          }
        }, 180000);

        cancelRef.current = cancel;

        for await (const token of stream) {
          if (timedOutBeforeFirstToken) break;
          accumulated += token;
          if (isWarmingUp) setIsWarmingUp(false);
          setMessages((prev) => {
            const updated = [...prev];
            const existing = updated[assistantIdx];
            if (existing && existing.role === 'assistant') {
              updated[assistantIdx] = {
                ...existing,
                content: accumulated,
              };
            }
            return updated;
          });
        }

        if (firstTokenTimeout) {
          clearTimeout(firstTokenTimeout);
          firstTokenTimeout = null;
        }

        const result = await resultPromise;
        let finalText = (result.text || accumulated || '').trim();

        // Fallback retry with a simpler prompt if model returns empty output.
        if (!finalText) {
          const fallbackPrompt = docChunk
            ? `${trimmedChunk.slice(0, 900)}\n\nQuestion: ${effectiveUserText}\nAnswer in under 100 words.`
            : effectiveUserText;
          try {
            const fallback = await TextGeneration.generateStream(fallbackPrompt, {
              maxTokens: 200,
              temperature: 0.3,
            });
            cancelRef.current = fallback.cancel;
            let fallbackAccumulated = '';
            for await (const token of fallback.stream) {
              fallbackAccumulated += token;
              if (isWarmingUp) setIsWarmingUp(false);
              setMessages((prev) => {
                const updated = [...prev];
                const existing = updated[assistantIdx];
                if (existing && existing.role === 'assistant') {
                  updated[assistantIdx] = {
                    ...existing,
                    content: fallbackAccumulated,
                  };
                }
                return updated;
              });
            }
            const fallbackResult = await fallback.result;
            finalText = (fallbackResult.text || fallbackAccumulated || '').trim();
          } catch (fallbackStreamError) {
            const fallbackErrMsg = fallbackStreamError instanceof Error ? fallbackStreamError.message : String(fallbackStreamError);
            const isSignatureMismatch = /function signature mismatch|streaming generation crashed/i.test(fallbackErrMsg);
            if (!isSignatureMismatch) throw fallbackStreamError;

            const fallbackResult = await TextGeneration.generate(fallbackPrompt, {
              maxTokens: 200,
              temperature: 0.3,
            });
            finalText = (fallbackResult.text || '').trim();
          }
        }

        if (!finalText) {
          finalText = 'No response generated. Please try a shorter question or click Load on the model banner.';
          setError('The AI returned an empty response. Please try again.');
        }

        setMessages((prev) => {
          const updated = [...prev];
          const existing = updated[assistantIdx];
          if (existing && existing.role === 'assistant') {
            updated[assistantIdx] = {
              ...existing,
              content: finalText,
            };
          }
          return updated;
        });

        if (finalText.startsWith('No response generated.')) {
          setError('The AI returned an empty response. Please try again.');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        if (timedOutBeforeFirstToken) {
          setError('AI is taking too long to start. Please retry with a shorter prompt.');
          setMessages((prev) => {
            const updated = [...prev];
            const existing = updated[assistantIdx];
            if (existing && existing.role === 'assistant' && !existing.content.trim()) {
              updated[assistantIdx] = {
                ...existing,
                content: 'Still warming up and could not start generating in time. Please try again.',
              };
            }
            return updated;
          });
          return;
        }
        if (errorMsg !== 'Cancelled' && errorMsg !== 'AbortError') {
          setError(errorMsg);
          setMessages((prev) => {
            const updated = [...prev];
            const existing = updated[assistantIdx];
            if (existing && existing.role === 'assistant' && !existing.content.trim()) {
              updated[assistantIdx] = {
                ...existing,
                content: `Error: ${errorMsg}`,
              };
            }
            return updated;
          });
        } else {
          setMessages((prev) => {
            const updated = [...prev];
            const existing = updated[assistantIdx];
            if (existing && existing.role === 'assistant' && existing.content.trim()) {
              updated[assistantIdx] = {
                ...existing,
                content: `${existing.content}\n\n[Cancelled]`,
              };
            }
            return updated;
          });
        }
      } finally {
        if (firstTokenTimeout) {
          clearTimeout(firstTokenTimeout);
        }
        cancelRef.current = null;
        setIsStreaming(false);
        setIsWarmingUp(false);
      }
    },
    [isStreaming, isWarmingUp, loader, maxTokens, messages, systemPrompt]
  );

  const cancelGeneration = useCallback(() => {
    cancelRef.current?.();
    setIsStreaming(false);
    setIsWarmingUp(false);
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsWarmingUp(false);
  }, []);

  return {
    messages,
    sendMessage,
    isStreaming,
    isWarmingUp,
    cancelGeneration,
    clearHistory,
    error,
  };
}
