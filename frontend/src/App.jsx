import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import NewExperiment from './pages/NewExperiment';
import CompareResults from './pages/CompareResults';
import History from './pages/History';
import AutomationLogs from './pages/AutomationLogs';
import TestCases from './pages/TestCases';
import Documentation from './pages/Documentation';
import Settings from './pages/Settings';

import { fetchHealth, fetchApiKeyStatus } from './services/api';

import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedExperimentId, setSelectedExperimentId] = useState(null);
  const [healthInfo, setHealthInfo] = useState(null);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);

  const checkStatus = async () => {
    try {
      const [h, keyStatus] = await Promise.all([
        fetchHealth(),
        fetchApiKeyStatus(),
      ]);
      setHealthInfo(h);
      setApiKeyConfigured(keyStatus.configured);
    } catch (err) {
      console.warn('API connection check:', err.message);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthInfo={healthInfo}
      />

      <div className="main-wrapper">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          apiKeyConfigured={apiKeyConfigured}
        />

        <main className="page-container">
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              setSelectedExperimentId={setSelectedExperimentId}
            />
          )}

          {activeTab === 'new-experiment' && (
            <NewExperiment
              setActiveTab={setActiveTab}
              setSelectedExperimentId={setSelectedExperimentId}
              supportedModels={healthInfo?.supported_models || []}
            />
          )}

          {activeTab === 'compare' && (
            <CompareResults
              selectedExperimentId={selectedExperimentId}
              setSelectedExperimentId={setSelectedExperimentId}
            />
          )}

          {activeTab === 'history' && (
            <History
              setActiveTab={setActiveTab}
              setSelectedExperimentId={setSelectedExperimentId}
            />
          )}

          {activeTab === 'automation' && <AutomationLogs />}

          {activeTab === 'test-cases' && (
            <TestCases
              setActiveTab={setActiveTab}
              setSelectedExperimentId={setSelectedExperimentId}
            />
          )}

          {activeTab === 'documentation' && <Documentation />}

          {activeTab === 'settings' && (
            <Settings onApiKeyUpdated={checkStatus} />
          )}
        </main>
      </div>
    </div>
  );
}

