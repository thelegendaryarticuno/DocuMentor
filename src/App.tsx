import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ModelCategory } from '@runanywhere/web';
import { initSDK } from './runanywhere';
import { ResearchMode } from './modes/ResearchMode';
import { StudentMode } from './modes/StudentMode';
import { Home } from './pages/Home';
import { useModelLoader } from './hooks/useModelLoader';

let appLevelModelEnsurePromise: Promise<boolean> | null = null;

export function App() {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
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

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/research" element={<ResearchMode />} />
      <Route path="/student" element={<StudentMode />} />
    </Routes>
  );
}
