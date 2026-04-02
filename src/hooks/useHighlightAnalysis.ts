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
      // HYBRID APPROACH: Use heuristics first, then AI for edge cases
      
      // Step 1: Check for obvious patterns with heuristics
      const heuristicResult = analyzeWithHeuristics(chunk);
      
      // Step 2: If heuristics are confident, use them (faster!)
      if (heuristicResult.confidence >= 0.8) {
        return {
          text: chunk,
          importance: heuristicResult.importance,
          reason: heuristicResult.reason,
          chunkIndex: index,
        };
      }
      
      // Step 3: Use AI for uncertain cases with improved prompt
      try {
        const truncated = chunk.slice(0, 500); // Shorter for speed
        const prompt = `Classify the importance of the text below.

      Text:
      """
      ${truncated}
      """

      Reply with exactly one token (no punctuation, no explanation):
      critical
      medium
      low`;

        const result = await TextGeneration.generate(prompt, {
          maxTokens: 10, // Very short - just one word
          temperature: 0.05, // Very low for consistency
          topP: 0.7,
          topK: 5,
        });

        const response = result.text.toLowerCase().trim();
        const aiImportance = parseAIImportance(response);
        const { importance, reason } = combineImportance(heuristicResult, aiImportance);

        return {
          text: chunk,
          importance,
          reason,
          chunkIndex: index,
        };
      } catch (err) {
        console.error(`Error analyzing chunk ${index}:`, err);
        // Fallback to heuristics
        return {
          text: chunk,
          importance: heuristicResult.importance,
          reason: heuristicResult.reason,
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

function parseAIImportance(response: string): ImportanceLevel | null {
  const firstToken = response
    .replace(/[^a-z\s]/g, ' ')
    .trim()
    .split(/\s+/)[0];

  if (firstToken === 'critical' || firstToken === 'medium' || firstToken === 'low') {
    return firstToken;
  }

  // Fallback: use standalone words only (avoids accidental substring matches)
  if (/\bcritical\b/.test(response)) return 'critical';
  if (/\bmedium\b/.test(response)) return 'medium';
  if (/\blow\b/.test(response)) return 'low';

  return null;
}

function combineImportance(
  heuristicResult: { importance: ImportanceLevel; confidence: number },
  aiImportance: ImportanceLevel | null
): { importance: ImportanceLevel; reason: string } {
  if (!aiImportance) {
    return {
      importance: heuristicResult.importance,
      reason: 'Heuristic classification (AI response unclear)',
    };
  }

  if (heuristicResult.confidence >= 0.7) {
    return {
      importance: heuristicResult.importance,
      reason: 'Heuristic classification (high confidence)',
    };
  }

  if (heuristicResult.importance === aiImportance) {
    const reasonByLevel: Record<ImportanceLevel, string> = {
      critical: 'AI + heuristics agree on critical content',
      medium: 'AI + heuristics agree on important content',
      low: 'AI + heuristics agree on general content',
    };
    return {
      importance: aiImportance,
      reason: reasonByLevel[aiImportance],
    };
  }

  // For low-confidence disagreements, keep AI result instead of forcing medium.
  return {
    importance: aiImportance,
    reason: 'AI classification used for ambiguous content',
  };
}

/**
 * Advanced heuristic analyzer with confidence scoring
 * Returns both importance level and confidence (0-1)
 */
function analyzeWithHeuristics(text: string): {
  importance: ImportanceLevel;
  reason: string;
  confidence: number;
} {
  const lowerText = text.toLowerCase();
  const trimmed = text.trim();
  
  let criticalScore = 0;
  let mediumScore = 0;
  let confidence = 0;
  
  // === CRITICAL INDICATORS (High confidence) ===
  
  // Explicit warning labels (very high confidence)
  if (/^(warning|caution|danger|critical|error|alert):/i.test(trimmed)) {
    criticalScore += 10;
    confidence = 0.95;
  }
  
  // Strong prohibitions
  if (lowerText.includes('do not ') || lowerText.includes('must not ') || 
      lowerText.includes('never ') || lowerText.includes('forbidden')) {
    criticalScore += 8;
    confidence = Math.max(confidence, 0.9);
  }
  
  // Mandatory requirements
  if ((lowerText.includes('must ') || lowerText.includes('required')) &&
      (lowerText.includes('immediately') || lowerText.includes('mandatory'))) {
    criticalScore += 7;
    confidence = Math.max(confidence, 0.85);
  }
  
  // Time-sensitive urgency
  if (lowerText.includes('within ') && /\d+\s*(hour|minute|day)/.test(lowerText)) {
    criticalScore += 6;
    confidence = Math.max(confidence, 0.8);
  }
  
  // Security/safety terms
  if (lowerText.includes('security breach') || lowerText.includes('data loss') ||
      lowerText.includes('unauthorized access') || lowerText.includes('compromise')) {
    criticalScore += 6;
    confidence = Math.max(confidence, 0.8);
  }
  
  // === MEDIUM INDICATORS (Medium confidence) ===
  
  // Explicit importance labels
  if (/^(important|note|tip|recommendation|best practice):/i.test(trimmed)) {
    mediumScore += 8;
    confidence = Math.max(confidence, 0.85);
  }
  
  // Advisory language
  if (lowerText.includes('should ') || lowerText.includes('recommend') ||
      lowerText.includes('advised') || lowerText.includes('suggest')) {
    mediumScore += 5;
    confidence = Math.max(confidence, 0.7);
  }
  
  // Numbered/structured content (often important)
  if (/^\d+\.\s+[A-Z]/.test(trimmed) || /^[A-Z][^.!?]{5,60}:/.test(trimmed)) {
    mediumScore += 4;
    confidence = Math.max(confidence, 0.65);
  }
  
  // Action verbs (indicates instructions)
  const actionVerbs = ['ensure', 'verify', 'check', 'confirm', 'review', 'validate'];
  if (actionVerbs.some(verb => lowerText.includes(verb + ' '))) {
    mediumScore += 3;
    confidence = Math.max(confidence, 0.6);
  }
  
  // === CLASSIFY ===
  
  // Critical if high critical score
  if (criticalScore >= 6) {
    return {
      importance: 'critical',
      reason: 'Contains warnings, requirements, or urgent information',
      confidence,
    };
  }
  
  // Medium if medium score high enough or some critical signals
  if (mediumScore >= 6 || criticalScore >= 3) {
    return {
      importance: 'medium',
      reason: 'Contains important information or instructions',
      confidence: confidence || 0.65,
    };
  }
  
  // Check if it's likely just background/descriptive
  const lowIndicators = [
    'background', 'introduction', 'history', 'overview',
    'for example', 'such as', 'this document', 'the system'
  ];
  
  if (lowIndicators.some(indicator => lowerText.includes(indicator))) {
    confidence = Math.max(confidence, 0.7);
  }
  
  // Default to low
  return {
    importance: 'low',
    reason: 'General or descriptive content',
    confidence: confidence || 0.5,
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
