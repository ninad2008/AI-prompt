import React, { useEffect, useState } from 'react';
import { Workflow, CheckCircle2, XCircle, Clock, Database, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { fetchWorkflowLogs } from '../services/api';

export default function AutomationLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWorkflowLogs();
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="automation-logs-page">
      {/* Workflow Explanation Banner */}
      <div className="glass-card" style={{ marginBottom: '24px', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--accent-gradient)', color: '#fff' }}>
            <Workflow size={18} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Autonomous Backend Trigger-Action Engine</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          Every experiment execution is verified through an automated state machine. When all three AI candidates are
          evaluated, the pipeline triggers an automated event, validates the condition (ensuring valid non-zero
          multi-criteria scores), automatically ranks the winner, commits the transaction to SQLite, and compiles a CSV export.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px' }}>
          <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: 700 }}>TRIGGER</span>
            <div style={{ fontSize: '0.825rem', fontWeight: 500, marginTop: '2px' }}>ON_ALL_PROMPTS_EVALUATION_COMPLETED</div>
          </div>
          <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.72rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>CONDITION</span>
            <div style={{ fontSize: '0.825rem', fontWeight: 500, marginTop: '2px' }}>All 3 techniques have valid weighted scores</div>
          </div>
          <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.72rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700 }}>AUTOMATED ACTION</span>
            <div style={{ fontSize: '0.825rem', fontWeight: 500, marginTop: '2px' }}>Rank winner + SQLite commit + CSV export</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Verifiable Execution Audit Trail</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cryptographically referenced SQLite workflow_logs records</p>
        </div>
        <button className="btn btn-secondary" onClick={loadLogs} disabled={loading} style={{ fontSize: '0.825rem' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {error && (
        <div className="notification-banner danger">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Logs Table */}
      <div className="glass-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Trigger Event</th>
                <th>Trigger Timestamp</th>
                <th>Condition Evaluated</th>
                <th>Action Executed</th>
                <th>Database Record ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="badge badge-technique-basic" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                        {log.trigger_name}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(log.trigger_timestamp).toLocaleString()}
                    </td>
                    <td>
                      {log.condition_result ? (
                        <span className="badge badge-success" style={{ gap: '4px' }}>
                          <CheckCircle2 size={12} /> Passed (True)
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ gap: '4px' }}>
                          <XCircle size={12} /> Failed (False)
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.825rem', maxWidth: '380px' }}>{log.action_description}</div>
                      {log.error_message && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '4px' }}>
                          {log.error_message}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.experiment_id.slice(0, 8)}...
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${log.execution_status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}`}
                      >
                        {log.execution_status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {loading ? 'Fetching audit records...' : 'No workflow triggers executed yet.'}
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

