import { ReactNode } from 'react';

interface Mode {
  path: string;
  label: string;
  color: string;
  section: 'modes' | 'settings';
}

interface SidebarProps {
  activePath: string;
  onNavigate: (path: string) => void;
  isModelReady: boolean;
  isModelLoading: boolean;
}

const modesConfig: Mode[] = [
  { path: '/highlights', label: 'Smart Highlights', color: '#1D9E75', section: 'modes' },
  { path: '/student', label: 'Guided Learning', color: '#378ADD', section: 'modes' },
  { path: '/research', label: 'Research', color: '#D4537E', section: 'modes' },
  { path: '/settings', label: 'Settings', color: '#888780', section: 'settings' },
];

export function Sidebar({ activePath, onNavigate, isModelReady, isModelLoading }: SidebarProps) {
  const modes = modesConfig.filter(m => m.section === 'modes');
  const settings = modesConfig.filter(m => m.section === 'settings');

  const renderDocIcon = (): ReactNode => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">{renderDocIcon()}</div>
        <span className="sidebar-logo-text">DocuMentor</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Modes Section */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Modes</div>
          {modes.map((mode) => (
            <button
              key={mode.path}
              className={`sidebar-item ${activePath === mode.path ? 'active' : ''}`}
              style={
                activePath === mode.path ? ({ '--mode-color': mode.color } as React.CSSProperties) : undefined
              }
              onClick={() => onNavigate(mode.path)}
              title={mode.label}
            >
              <div className="sidebar-item-dot" style={{ backgroundColor: mode.color }} />
              <span className="sidebar-item-label">{mode.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Section */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Preferences</div>
          {settings.map((setting) => (
            <button
              key={setting.path}
              className={`sidebar-item ${activePath === setting.path ? 'active' : ''}`}
              style={
                activePath === setting.path ? ({ '--mode-color': setting.color } as React.CSSProperties) : undefined
              }
              onClick={() => onNavigate(setting.path)}
              title={setting.label}
            >
              <div className="sidebar-item-dot" style={{ backgroundColor: setting.color }} />
              <span className="sidebar-item-label">{setting.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className={`sidebar-footer-pulse ${isModelLoading ? 'loading' : ''}`} />
        <span>
          {isModelReady ? 'Model ready · On-device' : 'Model loading…'}
        </span>
      </div>
    </aside>
  );
}

