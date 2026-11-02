import React from 'react';
import { BookOpen, Layers, CheckCircle2, Shield, Database, Cpu } from 'lucide-react';

export default function Documentation() {
  return (
    <div className="documentation-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overview Card */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--accent-gradient)', color: '#fff' }}>
            <BookOpen size={18} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>System Technical Reference</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Comprehensive architecture documentation, mathematical formulas, prompting schemas, and database
          specifications for the Prompt Performance Comparison System.
        </p>
      </div>

      {/* Evaluation Rubric & Formula */}
      <div className="glass-card">
        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', color: '#a78bfa' }}>
          1. Five-Criteria Scoring Rubric & Weighted Formula
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>
          All three prompt variants are evaluated using an identical blind evaluation prompt. Each criterion is scored
          from 0.0 to 10.0 and combined into an overall percentage using the canonical weighting formula:
        </p>

        <div className="code-block" style={{ marginBottom: '16px' }}>
          Final Score (%) = (Accuracy × 0.25 + Relevance × 0.20 + Completeness × 0.20 + Clarity × 0.15 + Instruction_Following × 0.20) × 10
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Criterion</th>
                <th>Weight</th>
                <th>Evaluation Dimension</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Accuracy</strong></td>
                <td>25% (0.25)</td>
                <td>Factual fidelity, absence of hallucinations, alignment with ground truth.</td>
              </tr>
              <tr>
                <td><strong>Relevance</strong></td>
                <td>20% (0.20)</td>
                <td>Direct responsiveness to the user's inquiry without extraneous tangents.</td>
              </tr>
              <tr>
                <td><strong>Completeness</strong></td>
                <td>20% (0.20)</td>
                <td>Coverage of all requested facets, steps, and required details.</td>
              </tr>
              <tr>
                <td><strong>Clarity</strong></td>
                <td>15% (0.15)</td>
                <td>Syntactic flow, readability, formatting, and ease of comprehension.</td>
              </tr>
              <tr>
                <td><strong>Instruction Following</strong></td>
                <td>20% (0.20)</td>
                <td>Strict compliance with formatting guidelines, word limits, and constraints.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3 Prompting Techniques Structure */}
      <div className="glass-card">
        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', color: '#60a5fa' }}>
          2. The Three Prompt Engineering Paradigms
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <h5 style={{ color: '#60a5fa', marginBottom: '8px' }}>A. Basic Prompting</h5>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Zero-shot direct instruction without specialized constraints or formatting scaffolds.
            </p>
            <div className="code-block" style={{ fontSize: '0.75rem', maxHeight: '140px' }}>
              Summarize the following passage clearly and concisely: [USER INPUT]
            </div>
          </div>

          <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <h5 style={{ color: '#a78bfa', marginBottom: '8px' }}>B. Structured Prompting</h5>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Decomposed prompt incorporating explicit Role, Objective, Context, Steps, Constraints, and Output Schema.
            </p>
            <div className="code-block" style={{ fontSize: '0.75rem', maxHeight: '140px' }}>
              You are an expert...{"\n"}
              ### Objective: ...{"\n"}
              ### Steps: ...{"\n"}
              ### Constraints: ...{"\n"}
              ### Input: [USER INPUT]
            </div>
          </div>

          <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h5 style={{ color: '#34d399', marginBottom: '8px' }}>C. Example-Based (Few-Shot)</h5>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Demonstrates input-output exemplar pairs illustrating style, tone, and formatting without revealing target answers.
            </p>
            <div className="code-block" style={{ fontSize: '0.75rem', maxHeight: '140px' }}>
              --- Example 1 ---{"\n"}
              Input: ... Output: ...{"\n"}
              --- Target Task ---{"\n"}
              Input: [USER INPUT]
            </div>
          </div>
        </div>
      </div>

      {/* Database Schema */}
      <div className="glass-card">
        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', color: '#34d399' }}>
          3. Relational Database Schema (SQLite & SQLAlchemy)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-highlight)', marginBottom: '6px' }}>TABLE: experiments</div>
            <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: '16px', lineHeight: 1.6 }}>
              <li>id (UUID, PK)</li>
              <li>experiment_name (String)</li>
              <li>task_category (String)</li>
              <li>original_input (Text)</li>
              <li>expected_output (Text)</li>
              <li>additional_instructions (Text)</li>
              <li>model_name (String)</li>
              <li>created_at (DateTime)</li>
              <li>status (PENDING/RUNNING/COMPLETED)</li>
            </ul>
          </div>

          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-highlight)', marginBottom: '6px' }}>TABLE: prompt_results</div>
            <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: '16px', lineHeight: 1.6 }}>
              <li>id (UUID, PK)</li>
              <li>experiment_id (UUID, FK)</li>
              <li>prompting_type (Basic/Structured/Example)</li>
              <li>generated_prompt (Text)</li>
              <li>ai_response (Text)</li>
              <li>execution_time (Float, s)</li>
              <li>input_tokens / output_tokens (Int)</li>
              <li>status (COMPLETED/FAILED)</li>
            </ul>
          </div>

          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-highlight)', marginBottom: '6px' }}>TABLE: evaluations</div>
            <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: '16px', lineHeight: 1.6 }}>
              <li>id (UUID, PK)</li>
              <li>prompt_result_id (UUID, FK)</li>
              <li>accuracy / relevance (Float)</li>
              <li>completeness / clarity (Float)</li>
              <li>instruction_following (Float)</li>
              <li>weighted_score (Float, 0-100%)</li>
              <li>evaluator_explanation (Text)</li>
              <li>evaluation_status (COMPLETED)</li>
            </ul>
          </div>

          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-highlight)', marginBottom: '6px' }}>TABLE: workflow_logs</div>
            <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: '16px', lineHeight: 1.6 }}>
              <li>id (UUID, PK)</li>
              <li>experiment_id (UUID, FK)</li>
              <li>trigger_name (String)</li>
              <li>trigger_timestamp (DateTime)</li>
              <li>condition_result (Boolean)</li>
              <li>action_description (Text)</li>
              <li>execution_status (SUCCESS/FAILED)</li>
              <li>error_message (Text)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Responsible AI Safeguards */}
      <div className="glass-card">
        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', color: '#fbbf24' }}>
          4. Responsible AI & Validation Safeguards
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <div>• <strong>AI-Assisted Notice:</strong> All scores are transparently labeled as automated heuristics rather than objective ground truth.</div>
          <div>• <strong>Identical Model & Input:</strong> Strict experimental control guarantees all 3 techniques receive identical inputs and use the exact same LLM model.</div>
          <div>• <strong>Blind Scoring:</strong> Candidate outputs are labeled anonymously to prevent evaluator preference bias.</div>
          <div>• <strong>Credential Protection:</strong> API keys are kept strictly on the backend and never passed to the client.</div>
        </div>
      </div>
    </div>
  );
}

