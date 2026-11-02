import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  History,
  Workflow,
  CheckSquare,
  BookOpen,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, healthInfo }) {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'new-experiment', label: 'New Experiment', icon: PlusCircle },
    { id: 'compare', label: 'Compare Results', icon: BarChart3 },
    { id: 'history', label: 'Experiment History', icon: History },
    { id: 'automation', label: 'Automation Logs', icon: Workflow },
    { id: 'test-cases', label: 'Test Cases', icon: CheckSquare },
    { id: 'documentation', label: 'Documentation', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Sparkles size={20} />
        </div>
        <div className="brand-info">
          <span className="brand-title">PromptBench</span>
          <span className="brand-subtitle">LLM Comparison</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="status-indicator">
          <div className={`status-dot ${healthInfo?.status === 'healthy' ? '' : 'disconnected'}`} />
          <span>{healthInfo?.status === 'healthy' ? 'Engine Online' : 'Connecting...'}</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Model: {healthInfo?.default_model || 'gemini-3.5-flash'}
        </div>
      </div>
    </aside>
  );
}

