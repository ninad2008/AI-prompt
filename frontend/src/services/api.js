const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchApiKeyStatus() {
  const res = await fetch(`${API_BASE}/settings/api-key`);
  if (!res.ok) throw new Error(`Failed to fetch API key status: ${res.statusText}`);
  return res.json();
}

export async function saveApiKey(apiKey) {
  const res = await fetch(`${API_BASE}/settings/api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to save API key');
  }
  return res.json();
}

export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  if (!res.ok) throw new Error(`Failed to fetch dashboard stats: ${res.statusText}`);
  return res.json();
}

export async function fetchExperiments() {
  const res = await fetch(`${API_BASE}/experiments`);
  if (!res.ok) throw new Error(`Failed to fetch experiments: ${res.statusText}`);
  return res.json();
}

export async function fetchExperiment(id) {
  const res = await fetch(`${API_BASE}/experiments/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch experiment details: ${res.statusText}`);
  return res.json();
}

export async function createExperiment(data) {
  const res = await fetch(`${API_BASE}/experiments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    let msg = 'Failed to create experiment';
    if (err.detail) {
      if (Array.isArray(err.detail)) {
        msg = err.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
      } else {
        msg = err.detail;
      }
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function runExperiment(id) {
  const res = await fetch(`${API_BASE}/experiments/${id}/run`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to execute experiment');
  }
  return res.json();
}

export async function fetchExperimentReport(id) {
  const res = await fetch(`${API_BASE}/experiments/${id}/report`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch comparison report');
  }
  return res.json();
}

export async function fetchWorkflowLogs() {
  const res = await fetch(`${API_BASE}/workflows`);
  if (!res.ok) throw new Error(`Failed to fetch workflow logs: ${res.statusText}`);
  return res.json();
}

export function getExportUrl(id) {
  return `${API_BASE}/experiments/${id}/export`;
}

