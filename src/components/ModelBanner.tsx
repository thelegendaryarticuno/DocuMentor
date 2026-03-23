import { useState } from 'react';
import type { LoaderState } from '../hooks/useModelLoader';

interface Props {
  state: LoaderState;
  progress: number;
  error: string | null;
  onLoad: () => Promise<boolean>;
  label: string;
}

export function ModelBanner({ state, progress, error, onLoad, label }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoad = async () => {
    setIsLoading(true);
    try {
      console.log('Starting model download for', label);
      await onLoad();
      console.log('Model download completed');
    } catch (err) {
      console.error('Model download error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (state === 'ready') return null;

  return (
    <div className="model-banner">
      {state === 'idle' && (
        <>
          <span>No {label} model loaded.</span>
          <button 
            className="btn btn-sm" 
            onClick={handleLoad}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Download & Load'}
          </button>
        </>
      )}
      {state === 'downloading' && (
        <>
          <span>Downloading {label} model... {(progress * 100).toFixed(0)}%</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </>
      )}
      {state === 'loading' && <span>Warming up AI... Loading {label} model into engine.</span>}
      {state === 'error' && (
        <>
          <span className="error-text">Error: {error}</span>
          <button 
            className="btn btn-sm" 
            onClick={handleLoad}
            disabled={isLoading}
          >
            {isLoading ? 'Retrying...' : 'Retry'}
          </button>
        </>
      )}
    </div>
  );
}
