import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, Database, Server } from 'lucide-react';
import { fetchApiKeyStatus, saveApiKey, fetchHealth } from '../services/api';

export default function Settings({ onApiKeyUpdated }) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keyStatus, setKeyStatus] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [keyData, healthData] = await Promise.all([
        fetchApiKeyStatus(),
        fetchHealth(),
      ]);
      setKeyStatus(keyData);
      setHealth(healthData);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      setErrorMessage('Please enter a valid Gemini API key.');
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);
      setErrorMessage(null);
      await saveApiKey(apiKeyInput.trim());
      setStatusMessage('Gemini API key configured successfully!');
      setApiKeyInput('');
      await loadData();
      if (onApiKeyUpdated) onApiKeyUpdated();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page" style={{ maxWidth: '800px' }}>
      {/* API Key Configuration Card */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--accent-gradient)', color: '#fff' }}>
            <Key size={18} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Gemini API Key Configuration</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>
          The Prompt Performance Comparison System executes real model prompts using the official Google Gen AI SDK.
          Your API key is securely handled by the backend server and never exposed to the frontend.
        </p>

        {statusMessage && (
          <div className="notification-banner success" style={{ marginBottom: '16px' }}>
            <CheckCircle2 size={16} />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="notification-banner danger" style={{ marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div style={{ marginBottom: '18px', padding: '14px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Current Status:</span>
            {keyStatus?.configured ? (
              <span className="badge badge-success" style={{ gap: '4px' }}>
                <CheckCircle2 size={12} /> Configured ({keyStatus.masked_key})
              </span>
            ) : (
              <span className="badge badge-warning" style={{ gap: '4px' }}>
                <AlertCircle size={12} /> Key Not Configured
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveKey}>
          <div className="form-group">
            <label className="form-label">Enter Gemini API Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="AIzaSy..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              disabled={saving}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Get a free API key from Google AI Studio</span>
              <ExternalLink size={12} />
            </a>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />}
              <span>{saving ? 'Saving...' : 'Save API Key'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* System Environment & Diagnostic Info */}
      <div className="glass-card">
        <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '14px' }}>System Diagnostics</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem' }}>
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Server size={14} /> Backend Server:
            </div>
            <div style={{ fontWeight: 600, color: '#34d399' }}>
              FastAPI (Python 3.11) — {health?.status || 'Active'}
            </div>
          </div>

          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Database size={14} /> Database Connection:
            </div>
            <div style={{ fontWeight: 600, color: '#34d399' }}>
              SQLite / SQLAlchemy — {health?.database || 'Connected'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supported Models:</span>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
            {(health?.supported_models || ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3-flash-preview']).map((m) => (
              <span key={m} className="badge badge-technique-basic" style={{ fontFamily: 'var(--font-mono)' }}>
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

