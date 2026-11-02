import React from 'react';
import { Sparkles, Key, AlertTriangle } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, apiKeyConfigured }) {
  const titles = {
    dashboard: 'Analytics & Overview',
    'new-experiment': 'Execute New Experiment',
    compare: 'Prompt Comparison Report',
    history: 'Experiment Archive',
    automation: 'Verifiable Workflow Logs',
    'test-cases': 'Academic Test Scenarios & Evidence',
    documentation: 'System Architecture & Documentation',
    settings: 'System & API Settings',
  };

  return (
    <header className="top-header">
      <div className="header-title-area">
        <h2 className="header-title">{titles[activeTab] || 'Prompt Performance Comparison'}</h2>
      </div>

      <div className="header-actions">
        {!apiKeyConfigured && (
          <button
            className="btn btn-secondary"
            onClick={() => setActiveTab('settings')}
            style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24', fontSize: '0.8rem' }}
          >
            <AlertTriangle size={15} />
            <span>Configure Gemini Key</span>
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={() => setActiveTab('new-experiment')}
          style={{ fontSize: '0.8rem', padding: '8px 14px' }}
        >
          <Sparkles size={15} />
          <span>New Experiment</span>
        </button>
      </div>
    </header>
  );
}

