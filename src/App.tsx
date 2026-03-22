import { useState, useEffect } from 'react';
import { ModelCategory } from '@runanywhere/web';
import { initSDK } from './runanywhere';
import { ResearchMode } from './modes/ResearchMode';
import { ModelBanner } from './components/ModelBanner';
import { useModelLoader } from './hooks/useModelLoader';

let appLevelModelEnsurePromise: Promise<boolean> | null = null;

export function App() {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [mode, setMode] = useState<'research' | null>(null);
  const loader = useModelLoader(ModelCategory.Language);

  useEffect(() => {
    initSDK()
      .then(() => setSdkReady(true))
      .catch((err) => setSdkError(err instanceof Error ? err.message : String(err)));
  }, []);

  useEffect(() => {
    if (sdkReady) {
      // Start model loading once at app startup so mode switches do not re-trigger downloads.
      appLevelModelEnsurePromise ??= loader.ensure();
    }
  }, [loader.ensure, sdkReady]);

  if (sdkError) {
    return (
      <div className="app-loading">
        <h2>SDK Error</h2>
        <p className="error-text">{sdkError}</p>
      </div>
    );
  }

  if (!sdkReady) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <h2>Loading RunAnywhere SDK...</h2>
        <p>Initializing on-device AI engine</p>
      </div>
    );
  }

  // Mode selection
  if (!mode) {
    return (
      <div>
        <ModelBanner
          state={loader.state}
          progress={loader.progress}
          error={loader.error}
          onLoad={loader.ensure}
          label="LLM"
        />
        <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '12px' }}>DocuMentor</h1>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '40px' }}>
            Your documents. Your device. Your AI.
          </p>
          <p style={{ color: '#999', marginBottom: '40px' }}>
            Analyze your documents with on-device AI. Zero backend. 100% private.
          </p>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <button
              onClick={() => setMode('research')}
              style={{
                padding: '20px 40px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Research Mode
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', overflow: 'auto' }}>
      <ModelBanner
        state={loader.state}
        progress={loader.progress}
        error={loader.error}
        onLoad={loader.ensure}
        label="LLM"
      />
      <header
        style={{
          padding: '16px 20px',
          backgroundColor: 'white',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '20px' }}>Research Mode</h1>
        <button
          onClick={() => setMode(null)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#F3F4F6',
            border: '1px solid #D1D5DB',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Change Mode
        </button>
      </header>
      <ResearchMode />
    </div>
  );
}
