import { useState, useEffect } from 'react';
import { initSDK, getAccelerationMode } from './runanywhere';
import { ChatTab } from './components/ChatTab';
import { Sidebar } from './components/Sidebar';

type Tab = 'chat';

function getPageHeading(pathname: string): string {
  if (pathname === '/research') return 'research heading chatbot';
  if (pathname === '/dev') return 'dev mode chatbot heading';
  return 'home page chatbot';
}

export function App() {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [heading, setHeading] = useState(getPageHeading(window.location.pathname));

  useEffect(() => {
    initSDK()
      .then(() => setSdkReady(true))
      .catch((err) => setSdkError(err instanceof Error ? err.message : String(err)));
  }, []);

  useEffect(() => {
    const updateHeading = () => {
      const newPath = window.location.pathname;
      setCurrentPath(newPath);
      setHeading(getPageHeading(newPath));
    };
    window.addEventListener('popstate', updateHeading);
    return () => window.removeEventListener('popstate', updateHeading);
  }, []);

  const handleNavigate = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    setHeading(getPageHeading(path));
  };

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

  const accel = getAccelerationMode();

  return (
    <div className="app">
      <Sidebar currentPath={currentPath} onNavigate={handleNavigate} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <header className="app-header">
          <h1>{heading}</h1>
          {accel && <span className="badge">{accel === 'webgpu' ? 'WebGPU' : 'CPU'}</span>}
        </header>

        <nav className="tab-bar">
          <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>
            💬 Chat
          </button>
        </nav>

        <main className="tab-content">
          {activeTab === 'chat' && <ChatTab />}
        </main>
      </div>
    </div>
  );
}
