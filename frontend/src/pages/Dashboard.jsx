import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Layers,
  Cpu,
  Trophy,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { fetchDashboardStats } from '../services/api';

export default function Dashboard({ setActiveTab, setSelectedExperimentId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const chartData = [
    {
      name: 'Basic',
      score: stats?.technique_performance?.Basic || 0,
      fill: '#3b82f6',
    },
    {
      name: 'Structured',
      score: stats?.technique_performance?.Structured || 0,
      fill: '#8b5cf6',
    },
    {
      name: 'Example-Based',
      score: stats?.technique_performance?.['Example-Based'] || 0,
      fill: '#10b981',
    },
  ];

  const handleViewExperiment = (id) => {
    setSelectedExperimentId(id);
    setActiveTab('compare');
  };

  return (
    <div className="dashboard-page">
      {/* Hero Welcome Banner */}
      <div
        className="glass-card"
        style={{
          marginBottom: '28px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.4) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  display: 'flex',
                }}
              >
                <Sparkles size={18} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Academic AI Benchmarking System
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>
              Prompt Performance Comparison System
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '720px', fontSize: '0.925rem' }}>
              Empirical multi-technique benchmarking for Large Language Models. Compares Basic, Structured,
              and Few-Shot Example prompting against identical tasks to evaluate Accuracy, Relevance, Completeness, Clarity,
              and Instruction Following with automated trigger-action workflow execution.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={loadData} disabled={loading} title="Refresh Dashboard">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button className="btn btn-primary" onClick={() => setActiveTab('new-experiment')}>
              <span>Quick Start Experiment</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="notification-banner danger">
          <span>Failed to load analytics: {error}</span>
          <button className="btn btn-secondary" onClick={loadData} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper stat-icon-indigo">
            <Layers size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Experiments</span>
            <span className="stat-value">{stats ? stats.total_experiments : '...'}</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper stat-icon-purple">
            <Cpu size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Prompts Tested</span>
            <span className="stat-value">{stats ? stats.total_prompts_tested : '...'}</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper stat-icon-emerald">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Avg Evaluation Score</span>
            <span className="stat-value">
              {stats ? (stats.average_evaluation_score > 0 ? `${stats.average_evaluation_score}%` : 'N/A') : '...'}
            </span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper stat-icon-amber">
            <Trophy size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Top Prompt Technique</span>
            <span className="stat-value" style={{ fontSize: '1.25rem' }}>
              {stats?.best_performing_technique || 'None yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Chart & Info */}
      <div className="charts-grid">
        <div className="glass-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Technique Performance Benchmark</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Average weighted score (%) across all evaluated prompts
              </p>
            </div>
            <span className="badge badge-info">Weighted Rubric</span>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                  formatter={(value) => [`${value}%`, 'Average Score']}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="chart-card-header">
              <h3 className="chart-title">Benchmark Architecture</h3>
              <span className="badge badge-success">Google GenAI SDK</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
              This system conducts standardized blind evaluations across three core prompting paradigms under identical conditions:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '10px 14px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                <strong style={{ color: '#60a5fa', fontSize: '0.85rem' }}>1. Basic Prompting:</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Direct, zero-shot instruction without explicit constraints or formatting scaffolding.
                </p>
              </div>

              <div style={{ padding: '10px 14px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '8px', borderLeft: '3px solid #8b5cf6' }}>
                <strong style={{ color: '#a78bfa', fontSize: '0.85rem' }}>2. Structured Prompting:</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Multi-part decomposed schema with explicit Role, Objective, Constraints, Steps, and Output Schema.
                </p>
              </div>

              <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                <strong style={{ color: '#34d399', fontSize: '0.85rem' }}>3. Example-Based Prompting:</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Few-shot exemplar conditioning demonstrating target pattern and formatting without data leakage.
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Evaluation Criteria: 5-Part Weighted Rubric</span>
            <button className="btn btn-outline" onClick={() => setActiveTab('documentation')} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
              View Documentation
            </button>
          </div>
        </div>
      </div>

      {/* Recent Experiments History Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Recent Experiment History</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest prompts executed and evaluated</p>
          </div>
          <button className="btn btn-outline" onClick={() => setActiveTab('history')} style={{ fontSize: '0.8rem' }}>
            View Full History
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Experiment Name</th>
                <th>Task Category</th>
                <th>Model</th>
                <th>Status</th>
                <th>Top Performer</th>
                <th>Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_experiments?.length > 0 ? (
                stats.recent_experiments.map((exp) => (
                  <tr key={exp.id}>
                    <td style={{ fontWeight: 600 }}>{exp.experiment_name}</td>
                    <td>
                      <span className="badge badge-info">{exp.task_category}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{exp.model_name}</td>
                    <td>
                      <span
                        className={`badge ${
                          exp.status === 'COMPLETED'
                            ? 'badge-success'
                            : exp.status === 'RUNNING'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td>
                      {exp.winner !== 'Pending' ? (
                        <span style={{ fontWeight: 600, color: '#a78bfa' }}>{exp.winner}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>In progress</span>
                      )}
                    </td>
                    <td>
                      {exp.top_score > 0 ? (
                        <span style={{ fontWeight: 700, color: '#34d399' }}>{exp.top_score}%</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {exp.status === 'COMPLETED' ? (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleViewExperiment(exp.id)}
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                        >
                          <span>Compare</span>
                          <ExternalLink size={12} />
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No experiments conducted yet. Click "Quick Start Experiment" to execute your first benchmark!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

