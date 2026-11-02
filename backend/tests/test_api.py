import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "supported_models" in data
    assert "gemini-3.5-flash" in data["supported_models"]

def test_api_key_status_endpoint():
    response = client.get("/api/settings/api-key")
    assert response.status_code == 200
    data = response.json()
    assert "configured" in data
    assert "setup_instructions" in data

def test_create_experiment_success():
    payload = {
        "experiment_name": "Test Summarization Experiment",
        "task_category": "Text Summarization",
        "original_input": "Artificial intelligence allows computers to perform human intelligence tasks.",
        "expected_output": "A short and accurate summary.",
        "additional_instructions": "Maximum 20 words.",
        "model_name": "gemini-3.5-flash"
    }
    response = client.post("/api/experiments", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["experiment_name"] == payload["experiment_name"]
    assert data["status"] == "PENDING"
    assert "id" in data

def test_edge_case_empty_input_rejected():
    # TEST CASE 5: Empty input validation
    payload = {
        "experiment_name": "Edge Case Empty",
        "task_category": "Text Summarization",
        "original_input": "   ",  # Whitespace only
        "expected_output": "Summary"
    }
    response = client.post("/api/experiments", json=payload)
    assert response.status_code == 422  # Unprocessable Entity
    error_detail = response.json()["detail"]
    assert any("at least 5 non-whitespace characters" in str(err) for err in error_detail)

def test_edge_case_short_input_rejected():
    # Extremely short ambiguous input
    payload = {
        "experiment_name": "Short",
        "task_category": "Text Summarization",
        "original_input": "Hi",
        "expected_output": "Summary"
    }
    response = client.post("/api/experiments", json=payload)
    assert response.status_code == 422

def test_edge_case_invalid_category_rejected():
    payload = {
        "experiment_name": "Invalid Category",
        "task_category": "Unsupported Fake Category",
        "original_input": "This is a valid length text for testing.",
        "expected_output": "Output"
    }
    response = client.post("/api/experiments", json=payload)
    assert response.status_code == 422

def test_dashboard_stats_endpoint():
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_experiments" in data
    assert "total_prompts_tested" in data
    assert "technique_performance" in data
    assert "recent_experiments" in data

def test_workflows_history_endpoint():
    response = client.get("/api/workflows")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

