import { useEffect, useState } from 'react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Sidebar({ currentPath, onNavigate }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const routes = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/research', icon: '🔬', label: 'Research' },
    { path: '/dev', icon: '⚙️', label: 'Dev' },
  ];

  const handleNavigate = (path: string) => {
    onNavigate(path);
  };

  return (
    <aside className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
           onMouseEnter={() => setIsExpanded(true)}
           onMouseLeave={() => setIsExpanded(false)}
    >
      <nav className="sidebar-nav">
        {routes.map((route) => (
          <button
            key={route.path}
            className={`sidebar-link ${currentPath === route.path ? 'active' : ''}`}
            onClick={() => handleNavigate(route.path)}
            title={route.label}
          >
            <span className="sidebar-icon">{route.icon}</span>
            <span className="sidebar-label">{route.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
