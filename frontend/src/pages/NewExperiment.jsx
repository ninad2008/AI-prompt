import React, { useState } from 'react';
import {
  Play,
  Sparkles,
  AlertCircle,
  CheckCircle,
  FileText,
  Clock,
  ArrowRight,
  Database,
  Workflow,
  HelpCircle,
} from 'lucide-react';
import { createExperiment, runExperiment } from '../services/api';

const TASK_CATEGORIES = [
  'Text Summarization',
  'Content Generation',
  'Question Answering',
  'Classification',
  'Data Extraction',
  'Logical Reasoning',
  'General Tasks',
];

const PREDEFINED_TEST_CASES = [
  {
    id: 1,
    label: 'Test Case 1: Simple Summarization',
    category: 'Text Summarization',
    name: 'Summarize Artificial Intelligence Definition',
    input: 'Artificial intelligence allows computers to perform tasks that normally require human intelligence, including learning, reasoning, and problem-solving.',
    expected: 'A short and accurate summary preserving the key meaning.',
    instructions: 'Keep the summary under 20 words.',
  },
  {
    id: 2,
    label: 'Test Case 2: Content Generation',
    category: 'Content Generation',
    name: 'College Cybersecurity Importance',
    input: 'Write a short paragraph explaining why cybersecurity is important for college students.',
    expected: 'A relevant paragraph mentioning digital safety, privacy, and responsible internet usage.',
    instructions: 'Emphasize actionable student habits such as strong passwords and phishing awareness.',
  },
  {
    id: 3,
    label: 'Test Case 3: Question Answering',
    category: 'Question Answering',
    name: 'RAM vs ROM Comparison',
    input: 'What is the difference between RAM and ROM?',
    expected: 'An accurate comparison explaining temporary versus non-volatile memory.',
    instructions: 'Include key differences regarding volatility, typical speed, and storage usage.',
  },
  {
    id: 4,
    label: 'Test Case 4: Data Extraction',
    category: 'Data Extraction',
    name: 'Extract Student Contact Record',
    input: 'Rahul is 21 years old, lives in Mumbai, and studies Computer Science. His email is rahul@example.com.',
    expected: 'Structured fields: Name, Age, City, Course, Email.',
    instructions: 'Format strictly as key-value pairs or structured list.',
  },
  {
    id: 5,
    label: 'Test Case 5: Edge Case (Empty / Minimal)',
    category: 'Text Summarization',
    name: 'Edge Case Validation Test',
    input: '   ',
    expected: 'Client and server rejection before LLM call.',
    instructions: 'Validates prevention of empty prompt execution.',
  },
];

export default function NewExperiment({ setActiveTab, setSelectedExperimentId, supportedModels = [] }) {
  const [formData, setFormData] = useState({
    experiment_name: '',
    task_category: 'Text Summarization',
    original_input: '',
    expected_output: '',
    additional_instructions: '',
    model_name: supportedModels[0] || 'gemini-3.5-flash',
  });

  const [formErrors, setFormErrors] = useState({});
  const [currentStage, setCurrentStage] = useState(0); // 0: Idle, 1: Prep, 2: Exec, 3: Eval, 4: Storage/Automation
  const [stageStatuses, setStageStatuses] = useState({
    1: 'pending',
    2: 'pending',
    3: 'pending',
    4: 'pending',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [executionError, setExecutionError] = useState(null);
  const [completedExperimentId, setCompletedExperimentId] = useState(null);

  const handleCategorySelect = (category) => {
    setFormData((prev) => ({ ...prev, task_category: category }));
  };

  const handlePreFill = (tc) => {
    setFormData({
      experiment_name: tc.name,
      task_category: tc.category,
      original_input: tc.input,
      expected_output: tc.expected,
      additional_instructions: tc.instructions,
      model_name: formData.model_name,
    });
    setFormErrors({});
  };

  const validate = () => {
    const errors = {};
    if (!formData.experiment_name.trim()) {
      errors.experiment_name = 'Experiment name is required.';
    }
    const trimmedInput = formData.original_input.trim();
    if (!trimmedInput) {
      errors.original_input = 'Original input cannot be empty or whitespace only.';
    } else if (trimmedInput.length < 5) {
      errors.original_input = 'Input must contain at least 5 non-whitespace characters.';
    }
    if (!formData.expected_output.trim()) {
      errors.expected_output = 'Expected output description is required for fair evaluation.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsProcessing(true);
    setExecutionError(null);
    setCompletedExperimentId(null);

    // Initial Stage 1: Prompt Preparation
    let activeStage = 1;
    setCurrentStage(1);
    setStageStatuses({ 1: 'running', 2: 'pending', 3: 'pending', 4: 'pending' });

    try {
      // Step A: Create Experiment in DB
      const exp = await createExperiment(formData);
      setCompletedExperimentId(exp.id);
      activeStage = 2;
      setStageStatuses((prev) => ({ ...prev, 1: 'completed', 2: 'running' }));
      setCurrentStage(2);

      // Step B: Trigger Pipeline Execution on Backend
      // The backend will run Stage 2 (Execution), Stage 3 (Evaluation), and Stage 4 (Automation & Storage)
      const res = await runExperiment(exp.id);

      // Update to completed
      activeStage = 4;
      setStageStatuses({ 1: 'completed', 2: 'completed', 3: 'completed', 4: 'completed' });
      setCurrentStage(4);
    } catch (err) {
      setExecutionError(err.message);
      setStageStatuses((prev) => ({
        ...prev,
        [activeStage]: 'failed',
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewReport = () => {
    if (completedExperimentId) {
      setSelectedExperimentId(completedExperimentId);
      setActiveTab('compare');
    }
  };

  return (
    <div className="new-experiment-page">
      {/* Test Scenarios Quick Load Bar */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Sparkles size={16} color="#818cf8" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-highlight)' }}>
            Academic Test Scenarios: Quick Pre-fill
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {PREDEFINED_TEST_CASES.map((tc) => (
            <button
              key={tc.id}
              type="button"
              className="category-pill"
              onClick={() => handlePreFill(tc)}
              disabled={isProcessing}
            >
              {tc.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4-Stage Workflow Progress Tracker */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Automated Processing Pipeline Stages
          </span>
          <span className="badge badge-info">
            {isProcessing ? 'Processing in progress' : currentStage === 4 ? 'All Stages Complete' : 'Ready'}
          </span>
        </div>

        <div className="stage-tracker">
          {/* Stage 1 */}
          <div
            className={`stage-step ${
              stageStatuses[1] === 'completed' ? 'completed' : stageStatuses[1] === 'running' ? 'active' : ''
            }`}
          >
            <div className="stage-circle">
              {stageStatuses[1] === 'completed' ? <CheckCircle size={18} /> : '1'}
            </div>
            <span className="stage-title">Stage 1: Prompt Preparation</span>
          </div>

          {/* Stage 2 */}
          <div
            className={`stage-step ${
              stageStatuses[2] === 'completed' ? 'completed' : stageStatuses[2] === 'running' ? 'active' : ''
            }`}
          >
            <div className="stage-circle">
              {stageStatuses[2] === 'completed' ? <CheckCircle size={18} /> : '2'}
            </div>
            <span className="stage-title">Stage 2: AI Execution</span>
          </div>

          {/* Stage 3 */}
          <div
            className={`stage-step ${
              stageStatuses[3] === 'completed' ? 'completed' : stageStatuses[3] === 'running' ? 'active' : ''
            }`}
          >
            <div className="stage-circle">
              {stageStatuses[3] === 'completed' ? <CheckCircle size={18} /> : '3'}
            </div>
            <span className="stage-title">Stage 3: Evaluation & Ranking</span>
          </div>

          {/* Stage 4 */}
          <div
            className={`stage-step ${
              stageStatuses[4] === 'completed' ? 'completed' : stageStatuses[4] === 'running' ? 'active' : ''
            }`}
          >
            <div className="stage-circle">
              {stageStatuses[4] === 'completed' ? <CheckCircle size={18} /> : '4'}
            </div>
            <span className="stage-title">Stage 4: Automation & Storage</span>
          </div>
        </div>

        {/* Execution Error Banner */}
        {executionError && (
          <div className="notification-banner danger" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{executionError}</span>
            </div>
            {executionError.includes('API Key is missing') && (
              <button
                className="btn btn-secondary"
                onClick={() => setActiveTab('settings')}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                Go to Settings
              </button>
            )}
          </div>
        )}

        {/* Stage 4 Completion Notification & Action CTA */}
        {stageStatuses[4] === 'completed' && completedExperimentId && (
          <div className="notification-banner success" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={20} />
              <div>
                <strong>Experiment Successfully Completed & Verified!</strong>
                <p style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                  All 3 prompting techniques evaluated, database persisted, and CSV report exported.
                </p>
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleViewReport} style={{ padding: '8px 16px' }}>
              <span>View Comparison Report</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Main Experiment Input Form */}
      <div className="glass-card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Task Name */}
            <div className="form-group">
              <label className="form-label">Task / Experiment Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Memory Comparison or News Summarization"
                value={formData.experiment_name}
                onChange={(e) => setFormData({ ...formData, experiment_name: e.target.value })}
                disabled={isProcessing}
              />
              {formErrors.experiment_name && <span className="form-error">{formErrors.experiment_name}</span>}
            </div>

            {/* AI Model Selection */}
            <div className="form-group">
              <label className="form-label">LLM Model (Identical for all 3 prompts)</label>
              <select
                className="form-select"
                value={formData.model_name}
                onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                disabled={isProcessing}
              >
                {(supportedModels.length > 0 ? supportedModels : ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3-flash-preview']).map(
                  (m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* Task Category Selection */}
          <div className="form-group">
            <label className="form-label">Task Category</label>
            <div className="category-pills">
              {TASK_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-pill ${formData.task_category === cat ? 'selected' : ''}`}
                  onClick={() => handleCategorySelect(cat)}
                  disabled={isProcessing}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Task Description / Original User Input */}
          <div className="form-group">
            <label className="form-label">
              Task Description / Original User Input *
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                (Will be injected into all 3 prompt techniques identically)
              </span>
            </label>
            <textarea
              className="form-textarea"
              placeholder="Enter the raw input text, query, or task instructions to be tested..."
              value={formData.original_input}
              onChange={(e) => setFormData({ ...formData, original_input: e.target.value })}
              disabled={isProcessing}
            />
            {formErrors.original_input && <span className="form-error">{formErrors.original_input}</span>}
          </div>

          {/* Expected Output */}
          <div className="form-group">
            <label className="form-label">
              Expected Output / Ground Truth Specification *
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                (Used by the independent evaluator to grade accuracy and completeness)
              </span>
            </label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '80px' }}
              placeholder="Describe what a high-quality, correct answer must contain or structure..."
              value={formData.expected_output}
              onChange={(e) => setFormData({ ...formData, expected_output: e.target.value })}
              disabled={isProcessing}
            />
            {formErrors.expected_output && <span className="form-error">{formErrors.expected_output}</span>}
          </div>

          {/* Additional Instructions */}
          <div className="form-group">
            <label className="form-label">
              Additional Instructions / Constraints (Optional)
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                (e.g. Word limit constraints, tone requirements, or forbidden topics)
              </span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Maximum 100 words. Simple language. No speculation."
              value={formData.additional_instructions}
              onChange={(e) => setFormData({ ...formData, additional_instructions: e.target.value })}
              disabled={isProcessing}
            />
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setFormData({
                  experiment_name: '',
                  task_category: 'Text Summarization',
                  original_input: '',
                  expected_output: '',
                  additional_instructions: '',
                  model_name: formData.model_name,
                });
                setFormErrors({});
              }}
              disabled={isProcessing}
            >
              Reset Form
            </button>

            <button type="submit" className="btn btn-primary" disabled={isProcessing}>
              <Play size={16} />
              <span>{isProcessing ? 'Executing 4-Stage Benchmark...' : 'Run Comparison Benchmark'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

