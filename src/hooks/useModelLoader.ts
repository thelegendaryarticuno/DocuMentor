import { useState, useCallback, useRef } from 'react';
import { ModelManager, ModelCategory, EventBus } from '@runanywhere/web';

export type LoaderState = 'idle' | 'downloading' | 'loading' | 'ready' | 'error';

interface ModelLoaderResult {
  state: LoaderState;
  progress: number;
  error: string | null;
  ensure: () => Promise<boolean>;
}

const sharedEnsurePromises = new Map<ModelCategory, Promise<boolean>>();

/**
 * Hook to download + load models for a given category.
 * Tracks download progress and loading state.
 *
 * @param category - Which model category to ensure is loaded.
 * @param coexist  - If true, only unload same-category models (allows STT+LLM+TTS to coexist).
 */
export function useModelLoader(category: ModelCategory, coexist = false): ModelLoaderResult {
  const [state, setState] = useState<LoaderState>(() =>
    ModelManager.getLoadedModel(category) ? 'ready' : 'idle',
  );
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const ensure = useCallback(async (): Promise<boolean> => {
    // Already loaded
    if (ModelManager.getLoadedModel(category)) {
      setState('ready');
      return true;
    }

    // Reuse in-flight ensure for same category to avoid duplicate load attempts.
    const existingEnsure = sharedEnsurePromises.get(category);
    if (existingEnsure) {
      const ok = await existingEnsure;
      setState(ok ? 'ready' : 'error');
      return ok;
    }

    if (loadingRef.current) return false;
    loadingRef.current = true;

    const ensurePromise = (async (): Promise<boolean> => {
      try {
        // Find a model for this category
        const models = ModelManager.getModels().filter((m) => m.modality === category);
        if (models.length === 0) {
          setError(`No ${category} model registered`);
          setState('error');
          return false;
        }

        const model = models[0];

        // Only call download when status indicates it's not already downloaded.
        // The SDK still checks IndexedDB internally, but this avoids redundant calls.
        const shouldDownload = model.status !== 'downloaded' && model.status !== 'loaded';
        if (shouldDownload) {
          setState('downloading');
          setProgress(0);

          const unsub = EventBus.shared.on('model.downloadProgress', (evt) => {
            if (evt.modelId === model.id) {
              setProgress(evt.progress ?? 0);
            }
          });

          try {
            await ModelManager.downloadModel(model.id);
          } finally {
            unsub();
          }
          setProgress(1);
        } else {
          setProgress(1);
        }

        // Load once per session unless already loaded.
        if (ModelManager.getLoadedModel(category)) {
          setState('ready');
          return true;
        }

        setState('loading');
        const ok = await ModelManager.loadModel(model.id, { coexist });
        if (ok) {
          setState('ready');
          return true;
        }

        setError('Failed to load model');
        setState('error');
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setState('error');
        return false;
      }
    })();

    sharedEnsurePromises.set(category, ensurePromise);

    try {
      return await ensurePromise;
    } finally {
      loadingRef.current = false;
      sharedEnsurePromises.delete(category);
    }
  }, [category, coexist]);

  return { state, progress, error, ensure };
}
