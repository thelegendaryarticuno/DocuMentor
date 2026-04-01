import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ModelCategory } from '@runanywhere/web';
import { initSDK } from './runanywhere';
import { Sidebar } from './components/Sidebar';
import { ModelBanner } from './components/ModelBanner';
import { ResearchMode } from './modes/ResearchMode';
import { StudentMode } from './modes/StudentMode';
import { SmartHighlightsMode } from './modes/SmartHighlightsMode';
import { HomePage } from './pages/HomePage';
import { Home } from './pages/Home';
import { ChatbotPage } from './pages/ChatbotPage';
import { useModelLoader } from './hooks/useModelLoader';

let appLevelModelEnsurePromise: Promise<boolean> | null = null;

export function App() {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const location = useLocation();
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

  const isHomeRoute = location.pathname === '/' || location.pathname === '/old-home' || location.pathname === '/chatbot';

  if (isHomeRoute) {
    return (
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/old-home" element={<Home />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <Sidebar
        activePath={location.pathname}
        onNavigate={(path) => (window.location.href = path)}
        isModelReady={loader.state === 'ready'}
        isModelLoading={loader.state === 'downloading' || loader.state === 'loading'}
      />

      {/* Main Area */}
      <div className="main-area">
        {/* Model Banner - only show when loading */}
        {loader.state === 'downloading' && (
          <ModelBanner progress={loader.progress * 100} modelName="Language Model" totalMB={4096} />
        )}

        {/* Tab Bar */}
        <div className="tab-bar">
          <button
            className={`tab-button ${location.pathname === '/highlights' ? 'active' : ''}`}
            onClick={() => (window.location.href = '/highlights')}
          >
            Smart Highlights
          </button>
          <button
            className={`tab-button ${location.pathname === '/student' ? 'active' : ''}`}
            onClick={() => (window.location.href = '/student')}
          >
            Guided Learning
          </button>
          <button
            className={`tab-button ${location.pathname === '/research' ? 'active' : ''}`}
            onClick={() => (window.location.href = '/research')}
          >
            Research
          </button>
          <div className="tab-spacer" />
          <div className="privacy-badge">
            <svg className="privacy-badge-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            100% on-device
          </div>
        </div>

        {/* Routes */}
        <div className="routes-container">
          <Routes>
            <Route path="/research" element={<ResearchMode />} />
            <Route path="/student" element={<StudentMode />} />
            <Route path="/highlights" element={<SmartHighlightsMode />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
