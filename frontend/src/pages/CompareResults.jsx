import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Download,
  Clock,
  Cpu,
  ChevronDown,
  ChevronUp,
  Award,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Cell,
} from 'recharts';
import { fetchExperiments, fetchExperimentReport, getExportUrl } from '../services/api';

export default function CompareResults({ selectedExperimentId, setSelectedExperimentId }) {
  const [experiments, setExperiments] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPrompts, setExpandedPrompts] = useState({});

  useEffect(() => {
    loadExperimentsList();
  }, []);

  useEffect(() => {
    if (selectedExperimentId) {
      loadReport(selectedExperimentId);
    }
  }, [selectedExperimentId]);

  const loadExperimentsList = async () => {
    try {
      const list = await fetchExperiments();
      const completed = list.filter((e) => e.status === 'COMPLETED');
      setExperiments(completed);
      if (completed.length > 0) {
        if (!selectedExperimentId) {
          setSelectedExperimentId(completed[0].id);
        }
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const loadReport = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchExperimentReport(id);
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePromptExpand = (type) => {
    setExpandedPrompts((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  // Prepare chart data
  const finalScoresBarData = report?.techniques?.map((t) => ({
    name: t.prompting_type,
    score: t.weighted_score,
    fill:
      t.prompting_type === report.winning_technique
        ? '#8b5cf6'
        : t.prompting_type === 'Basic'
        ? '#3b82f6'
        : '#10b981',
  })) || [];

  const radarData = [
    { criterion: 'Accuracy (25%)' },
    { criterion: 'Relevance (20%)' },
    { criterion: 'Completeness (20%)' },
    { criterion: 'Clarity (15%)' },
    { criterion: 'Inst. Following (20%)' },
  ];

  if (report?.techniques) {
    report.techniques.forEach((t) => {
      radarData[0][t.prompting_type] = t.accuracy;
      radarData[1][t.prompting_type] = t.relevance;
      radarData[2][t.prompting_type] = t.completeness;
      radarData[3][t.prompting_type] = t.clarity;
      radarData[4][t.prompting_type] = t.instruction_following;
    });
  }

  return (
    <div className="compare-results-page">
      {/* Experiment Selector Bar */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Select Experiment:</span>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '280px', padding: '8px 12px' }}
            value={selectedExperimentId || ''}
            onChange={(e) => setSelectedExperimentId(e.target.value)}
          >
            {experiments.map((exp) => (
              <option key={exp.id} value={exp.id}>
                {exp.experiment_name} ({exp.task_category})
              </option>
            ))}
          </select>
        </div>

        {report && (
          <a
            href={getExportUrl(report.experiment_id)}
            download
            className="btn btn-secondary"
            style={{ fontSize: '0.825rem', padding: '8px 14px' }}
          >
            <Download size={15} />
            <span>Export CSV / Excel</span>
          </a>
        )}
      </div>

      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--accent-primary)', margin: '0 auto 16px auto' }} />
          <h3>Generating Comparison Analysis...</h3>
          <p style={{ color: 'var(--text-muted)' }}>Synthesizing evaluations and calculating rankings...</p>
        </div>
      ) : error ? (
        <div className="notification-banner danger">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      ) : report ? (
        <>
          {/* Winner Announcement Banner */}
          <div className="winner-banner">
            <div className="winner-trophy">
              <Trophy size={30} />
            </div>
            <div className="winner-text" style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Rank #1 Top Performer</span>
                <span style={{ fontSize: '0.8rem', color: '#a5b4fc', fontFamily: 'var(--font-mono)' }}>Model: {report.model_name}</span>
              </div>
              <h3>Winning Technique: {report.winning_technique}</h3>
              <p>{report.winner_explanation}</p>
            </div>
          </div>

          {/* Original Task Summary Card */}
          <div className="glass-card" style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
              ORIGINAL BENCHMARK TASK (IDENTICAL INPUT)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Task Category:</span>
                <div style={{ marginTop: '4px' }}><span className="badge badge-info">{report.task_category}</span></div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>User Input:</span>
                <div style={{ marginTop: '4px', fontSize: '0.875rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                  "{report.original_input}"
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Expected Ground Truth:</span>
                <div style={{ marginTop: '4px', fontSize: '0.875rem', color: '#94a3b8' }}>
                  {report.expected_output}
                </div>
              </div>
            </div>
          </div>

          {/* Side by Side 3 Techniques Comparison */}
          <div className="comparison-grid">
            {report.techniques.map((tech) => {
              const isWinner = tech.prompting_type === report.winning_technique;
              const isExpanded = expandedPrompts[tech.prompting_type];
              const sw = report.strengths_weaknesses?.[tech.prompting_type] || {};

              return (
                <div key={tech.prompting_type} className={`candidate-card ${isWinner ? 'is-winner' : ''}`}>
                  <div className="candidate-header">
                    <div>
                      <div className="candidate-type">{tech.prompting_type}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {tech.execution_time}s
                        </span>
                        {tech.output_tokens && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Cpu size={12} /> {tech.output_tokens} tok
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`candidate-score-pill ${tech.weighted_score >= 85 ? 'score-high' : tech.weighted_score >= 70 ? 'score-mid' : 'score-low'}`}>
                      {tech.weighted_score}%
                    </div>
                  </div>

                  {/* 5-Criteria Progress Bars */}
                  <div className="criteria-bars">
                    {[
                      { label: 'Accuracy (25%)', val: tech.accuracy },
                      { label: 'Relevance (20%)', val: tech.relevance },
                      { label: 'Completeness (20%)', val: tech.completeness },
                      { label: 'Clarity (15%)', val: tech.clarity },
                      { label: 'Inst. Following (20%)', val: tech.instruction_following },
                    ].map((crit) => (
                      <div key={crit.label} className="criterion-row">
                        <div className="criterion-meta">
                          <span>{crit.label}</span>
                          <span>{crit.val} / 10</span>
                        </div>
                        <div className="criterion-progress-bg">
                          <div className="criterion-progress-fill" style={{ width: `${crit.val * 10}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Generated Prompt Toggle */}
                  <div style={{ margin: '12px 0' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => togglePromptExpand(tech.prompting_type)}
                      style={{ width: '100%', fontSize: '0.75rem', padding: '6px 10px', justifyContent: 'space-between' }}
                    >
                      <span>{isExpanded ? 'Hide Full Prompt' : 'View Full Prompt'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {isExpanded && (
                      <div className="code-block" style={{ marginTop: '8px', fontSize: '0.75rem', maxHeight: '200px' }}>
                        {tech.generated_prompt}
                      </div>
                    )}
                  </div>

                  {/* Complete AI Response */}
                  <div style={{ marginTop: '8px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>
                      Candidate AI Output:
                    </span>
                    <div
                      style={{
                        padding: '12px',
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                        lineHeight: 1.6,
                        flex: 1,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {tech.ai_response}
                    </div>
                  </div>

                  {/* Evaluator Notes */}
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <strong>Evaluator Justification:</strong> {tech.explanation}
                    </div>
                    {sw.strengths?.length > 0 && (
                      <div style={{ color: '#34d399', marginTop: '4px' }}>
                        <strong>Strengths:</strong> {sw.strengths.join(', ')}
                      </div>
                    )}
                    {sw.weaknesses?.length > 0 && (
                      <div style={{ color: '#fbbf24', marginTop: '4px' }}>
                        <strong>Areas for improvement:</strong> {sw.weaknesses.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual Visualizations: Bar Chart & Radar Chart */}
          <div className="charts-grid">
            {/* Bar Chart: Overall Weighted Scores */}
            <div className="glass-card">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">Weighted Performance Scores</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Comparison of final weighted % scores</p>
                </div>
                <span className="badge badge-success">Empirical</span>
              </div>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={finalScoresBarData} margin={{ top: 20, right: 30, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      formatter={(val) => [`${val}%`, 'Weighted Score']}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {finalScoresBarData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar Chart: Evaluation Criteria Comparison */}
            <div className="glass-card">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">Evaluation Criteria Radar</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Multi-dimensional rubric comparison (0-10)</p>
                </div>
                <span className="badge badge-info">5-Criteria</span>
              </div>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="75%">
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="criterion" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis stroke="#64748b" domain={[0, 10]} angle={30} />
                    <Radar name="Basic" dataKey="Basic" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    <Radar name="Structured" dataKey="Structured" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                    <Radar name="Example-Based" dataKey="Example-Based" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Synthesis Conclusion Card */}
          <div className="glass-card" style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>Empirical Synthesis & Conclusion</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{report.conclusion}</p>
          </div>

          {/* Academic Evaluation Disclaimer */}
          <div className="notification-banner warning" style={{ fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} />
              <span>{report.ai_evaluation_disclaimer}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>No completed experiments found. Execute an experiment first!</p>
        </div>
      )}
    </div>
  );
}

