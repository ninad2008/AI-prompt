import React, { useEffect, useState } from 'react';
import { Search, Filter, ExternalLink, Download, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchExperiments, getExportUrl } from '../services/api';

export default function History({ setActiveTab, setSelectedExperimentId }) {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchExperiments();
      setExperiments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInspect = (id) => {
    setSelectedExperimentId(id);
    setActiveTab('compare');
  };

  const filteredExperiments = experiments.filter((exp) => {
    const matchesSearch =
      exp.experiment_name.toLowerCase().includes(search.toLowerCase()) ||
      exp.original_input.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || exp.task_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="history-page">
      {/* Search and Filters */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', padding: '8px 12px 8px 36px', fontSize: '0.85rem' }}
              placeholder="Search experiments by name or input..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '180px', padding: '8px 12px', fontSize: '0.85rem' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="Text Summarization">Text Summarization</option>
            <option value="Content Generation">Content Generation</option>
            <option value="Question Answering">Question Answering</option>
            <option value="Classification">Classification</option>
            <option value="Data Extraction">Data Extraction</option>
            <option value="Logical Reasoning">Logical Reasoning</option>
            <option value="General Tasks">General Tasks</option>
          </select>
        </div>

        <button className="btn btn-secondary" onClick={loadData} disabled={loading} style={{ fontSize: '0.825rem' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="notification-banner danger">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Experiments Table */}
      <div className="glass-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Experiment Name</th>
                <th>Category</th>
                <th>Model</th>
                <th>Created At</th>
                <th>Status</th>
                <th>Results Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExperiments.length > 0 ? (
                filteredExperiments.map((exp) => (
                  <tr key={exp.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{exp.experiment_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {exp.original_input}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{exp.task_category}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{exp.model_name}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(exp.created_at).toLocaleString()}
                    </td>
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
                      <span style={{ fontSize: '0.85rem' }}>{exp.prompt_results?.length || 0} / 3 prompts</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {exp.status === 'COMPLETED' && (
                          <>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleInspect(exp.id)}
                              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                              title="View Full Report"
                            >
                              <span>Report</span>
                              <ExternalLink size={12} />
                            </button>
                            <a
                              href={getExportUrl(exp.id)}
                              download
                              className="btn btn-outline"
                              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                              title="Download CSV Export"
                            >
                              <Download size={12} />
                            </a>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading experiment records...' : 'No matching experiments found.'}
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

