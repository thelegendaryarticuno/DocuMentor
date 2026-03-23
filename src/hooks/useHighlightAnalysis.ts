import { useState, useCallback } from 'react';
import { ModelCategory } from '@runanywhere/web';
import { TextGeneration } from '@runanywhere/web-llamacpp';
import { useModelLoader } from './useModelLoader';

export type ImportanceLevel = 'low' | 'medium' | 'critical';

export interface AnalyzedChunk {
  text: string;
  importance: ImportanceLevel;
  reason: string;
  chunkIndex: number;
}

export interface AnalysisProgress {
  current: number;
  total: number;
  percentage: number;
}

interface UseHighlightAnalysisReturn {
  analyzeChunks: (chunks: string[]) => Promise<AnalyzedChunk[]>;
  progress: AnalysisProgress | null;
  isAnalyzing: boolean;
  error: string | null;
}

/**
 * Hook for analyzing document chunks and determining importance
 */
export function useHighlightAnalysis(): UseHighlightAnalysisReturn {
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loader = useModelLoader(ModelCategory.Language);

  const analyzeChunk = useCallback(
    async (chunk: string, index: number): Promise<AnalyzedChunk> => {
      // STRICT prompt - most content should be "low" importance
      const prompt = `Classify this text as:
- "critical" ONLY if it contains URGENT info, warnings, key requirements, or critical steps
- "medium" if somewhat important but not critical
- "low" for most general/descriptive content (BE STRICT - most text is low)

Text: ${chunk.slice(0, 600)}

Answer with ONLY: critical, medium, or low`;

      try {
        const result = await TextGeneration.generate(prompt, {
          maxTokens: 30, // Very short response for speed
          temperature: 0.1, // Lower temp = more consistent
          topP: 0.8,
          topK: 10,
        });

        const response = result.text.toLowerCase().trim();
        
        // STRICT parsing - default to low unless explicitly stated
        let importance: ImportanceLevel = 'low';
        let reason = 'General content';

        if (response.startsWith('critical') || response.includes('critical:')) {
          importance = 'critical';
          reason = 'Contains critical information or requirements';
        } else if (response.startsWith('medium') || response.includes('medium:')) {
          importance = 'medium';
          reason = 'Contains relevant supporting information';
        }

        return {
          text: chunk,
          importance,
          reason,
          chunkIndex: index,
        };
      } catch (err) {
        console.error(`Error analyzing chunk ${index}:`, err);
        // Fallback: use heuristics
        return {
          text: chunk,
          importance: estimateImportanceHeuristic(chunk),
          reason: 'Heuristic analysis',
          chunkIndex: index,
        };
      }
    },
    []
  );

  const analyzeChunks = useCallback(
    async (chunks: string[]): Promise<AnalyzedChunk[]> => {
      if (loader.state !== 'ready') {
        const ok = await loader.ensure();
        if (!ok) {
          setError('Model not ready. Please try again.');
          return [];
        }
      }

      setIsAnalyzing(true);
      setError(null);
      setProgress({ current: 0, total: chunks.length, percentage: 0 });

      const results: AnalyzedChunk[] = [];

      try {
        // Analyze chunks sequentially to avoid overwhelming the model
        for (let i = 0; i < chunks.length; i++) {
          const analyzed = await analyzeChunk(chunks[i], i);
          results.push(analyzed);

          // Update progress
          const current = i + 1;
          setProgress({
            current,
            total: chunks.length,
            percentage: Math.round((current / chunks.length) * 100),
          });
        }

        // POST-PROCESSING: Balance the importance levels
        // Ensure reasonable distribution: max 15% critical, max 35% medium
        const balancedResults = balanceImportance(results);

        return balancedResults;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Analysis failed';
        setError(errorMsg);
        return results; // Return partial results
      } finally {
        setIsAnalyzing(false);
        setProgress(null);
      }
    },
    [loader, analyzeChunk]
  );

  return {
    analyzeChunks,
    progress,
    isAnalyzing,
    error,
  };
}

/**
 * Balance importance distribution to prevent everything being marked important
 * Target: max 15% critical, max 35% medium, rest low
 */
function balanceImportance(chunks: AnalyzedChunk[]): AnalyzedChunk[] {
  if (chunks.length === 0) return chunks;

  // Count current distribution
  const critical = chunks.filter(c => c.importance === 'critical');
  const medium = chunks.filter(c => c.importance === 'medium');
  const low = chunks.filter(c => c.importance === 'low');

  // Calculate percentages
  const criticalPct = (critical.length / chunks.length) * 100;
  const mediumPct = (medium.length / chunks.length) * 100;

  // Target max percentages
  const MAX_CRITICAL_PCT = 15; // Only 15% should be critical
  const MAX_MEDIUM_PCT = 35;   // Only 35% should be medium

  // If distribution is reasonable, return as-is
  if (criticalPct <= MAX_CRITICAL_PCT && mediumPct <= MAX_MEDIUM_PCT) {
    return chunks;
  }

  // Need to rebalance - demote excess items
  const rebalanced = [...chunks];

  // If too many critical, demote some to medium
  if (criticalPct > MAX_CRITICAL_PCT) {
    const excessCount = Math.ceil(critical.length - (chunks.length * MAX_CRITICAL_PCT / 100));
    let demoted = 0;
    
    for (let i = rebalanced.length - 1; i >= 0 && demoted < excessCount; i--) {
      if (rebalanced[i].importance === 'critical') {
        rebalanced[i] = {
          ...rebalanced[i],
          importance: 'medium',
          reason: 'Important content (rebalanced)'
        };
        demoted++;
      }
    }
  }

  // If too many medium, demote some to low
  const currentMedium = rebalanced.filter(c => c.importance === 'medium');
  const currentMediumPct = (currentMedium.length / chunks.length) * 100;
  
  if (currentMediumPct > MAX_MEDIUM_PCT) {
    const excessCount = Math.ceil(currentMedium.length - (chunks.length * MAX_MEDIUM_PCT / 100));
    let demoted = 0;
    
    for (let i = rebalanced.length - 1; i >= 0 && demoted < excessCount; i--) {
      if (rebalanced[i].importance === 'medium' && rebalanced[i].reason !== 'Important content (rebalanced)') {
        rebalanced[i] = {
          ...rebalanced[i],
          importance: 'low',
          reason: 'General content'
        };
        demoted++;
      }
    }
  }

  return rebalanced;
}

/**
 * Heuristic-based importance estimation (fallback)
 * STRICT - Most content should be "low"
 */
function estimateImportanceHeuristic(text: string): ImportanceLevel {
  const lowerText = text.toLowerCase();
  
  // CRITICAL indicators - VERY strict (must have multiple strong signals)
  const criticalKeywords = [
    'warning', 'error', 'critical', 'danger', 'urgent',
    'must not', 'do not', 'never', 'required', 'mandatory'
  ];
  
  // MEDIUM indicators - somewhat strict
  const mediumKeywords = [
    'important', 'note', 'should', 'recommend', 'key point'
  ];
  
  // Count EXACT phrase matches (not just word presence)
  let criticalScore = 0;
  let mediumScore = 0;
  
  // Check for critical patterns
  if (lowerText.includes('warning:') || lowerText.includes('caution:')) criticalScore += 2;
  if (lowerText.includes('error:') || lowerText.includes('critical:')) criticalScore += 2;
  if (lowerText.includes('do not') || lowerText.includes('must not')) criticalScore += 2;
  if (lowerText.includes('required') && lowerText.includes('must')) criticalScore += 1;
  
  // Only mark critical if we have strong evidence (score >= 3)
  if (criticalScore >= 3) return 'critical';
  
  // Check for medium patterns
  if (lowerText.includes('important:') || lowerText.includes('note:')) mediumScore += 2;
  if (lowerText.includes('tip:') || lowerText.includes('recommendation:')) mediumScore += 1;
  if (/^\d+\.\s+[A-Z]/.test(text)) mediumScore += 1; // Numbered list item
  if (lowerText.includes('should') || lowerText.includes('recommend')) mediumScore += 1;
  
  // Only mark medium if we have clear evidence (score >= 3)
  if (mediumScore >= 3) return 'medium';
  
  // Also check if chunk starts with header-like text
  if (/^[A-Z][^.!?]{3,50}:/.test(text.trim())) {
    return 'medium'; // Headers are usually important
  }
  
  // DEFAULT: most content is low importance
  return 'low';
}
