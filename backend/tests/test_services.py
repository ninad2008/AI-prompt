import pytest
from backend.app.services.prompt_generator import PromptGenerator
from backend.app.services.evaluator import (
    calculate_weighted_score,
    run_deterministic_checks,
    CRITERIA_WEIGHTS,
)
from backend.app.services.comparison import rank_and_compare

def test_prompt_generation_all_techniques():
    input_text = "Artificial intelligence allows computers to perform tasks that normally require human intelligence."
    category = "Text Summarization"
    expected_output = "A short and accurate summary."

    prompts = PromptGenerator.generate_all(
        task_category=category,
        original_input=input_text,
        expected_output=expected_output
    )

    assert "Basic" in prompts
    assert "Structured" in prompts
    assert "Example-Based" in prompts

    # Verify identical original input is embedded in all three
    assert input_text in prompts["Basic"]
    assert input_text in prompts["Structured"]
    assert input_text in prompts["Example-Based"]

    # Verify Structured has explicit sections
    assert "### Objective:" in prompts["Structured"]
    assert "### Constraints:" in prompts["Structured"]
    assert "### Expected Output Format:" in prompts["Structured"]

    # Verify Example-Based contains few-shot demonstration
    assert "Example 1" in prompts["Example-Based"]

def test_weighted_score_calculation():
    # Final Score = (Acc * 0.25) + (Rel * 0.20) + (Comp * 0.20) + (Clar * 0.15) + (Inst * 0.20)
    # Perfect 10s: 10 * (0.25 + 0.20 + 0.20 + 0.15 + 0.20) = 10.0 -> 100.0%
    score_perfect = calculate_weighted_score(10.0, 10.0, 10.0, 10.0, 10.0)
    assert score_perfect == 100.0

    # Zeroes: 0.0%
    score_zero = calculate_weighted_score(0.0, 0.0, 0.0, 0.0, 0.0)
    assert score_zero == 0.0

    # Specific mixed scores:
    # 8*0.25 (2.0) + 7*0.20 (1.4) + 9*0.20 (1.8) + 6*0.15 (0.9) + 8*0.20 (1.6) = 7.7 -> 77.0%
    score_mixed = calculate_weighted_score(8.0, 7.0, 9.0, 6.0, 8.0)
    assert score_mixed == 77.0

def test_deterministic_checks():
    # Empty response check
    empty_check = run_deterministic_checks(
        task_category="Text Summarization",
        ai_response="   ",
        original_input="Summarize this",
        expected_output="Summary"
    )
    assert empty_check.is_empty is True
    assert empty_check.word_count == 0

    # Data extraction required fields check
    data_text = "Name: Rahul, Age: 21, City: Mumbai, Email: rahul@example.com, Course: Computer Science"
    det_check = run_deterministic_checks(
        task_category="Data Extraction",
        ai_response=data_text,
        original_input="Extract details",
        expected_output="Structured fields"
    )
    assert det_check.is_empty is False
    assert "Name" in det_check.required_fields_present
    assert "Age" in det_check.required_fields_present
    assert "Email" in det_check.required_fields_present
    assert len(det_check.required_fields_missing) == 0

def test_ranking_and_comparison_dynamic_winner():
    # Test that winner is dynamically determined by actual score, never hardcoded
    experiment_data = {
        "task_category": "Question Answering",
        "original_input": "What is RAM?",
        "expected_output": "RAM explanation",
    }
    technique_results = {
        "Basic": {
            "execution_time": 1.2,
            "evaluation": {
                "accuracy": 9.5,
                "relevance": 9.5,
                "completeness": 9.0,
                "clarity": 9.5,
                "instruction_following": 9.5,
                "weighted_score": 94.0,
                "detailed_explanation": "Extremely concise and completely accurate.",
                "strengths": ["Clear", "Accurate"],
                "weaknesses": []
            }
        },
        "Structured": {
            "execution_time": 2.1,
            "evaluation": {
                "accuracy": 8.0,
                "relevance": 8.0,
                "completeness": 8.5,
                "clarity": 8.0,
                "instruction_following": 8.0,
                "weighted_score": 81.0,
                "detailed_explanation": "Structured but slightly verbose.",
                "strengths": ["Organized"],
                "weaknesses": ["Wordy"]
            }
        },
        "Example-Based": {
            "execution_time": 2.4,
            "evaluation": {
                "accuracy": 8.5,
                "relevance": 8.5,
                "completeness": 8.5,
                "clarity": 8.5,
                "instruction_following": 8.5,
                "weighted_score": 85.0,
                "detailed_explanation": "Good examples used.",
                "strengths": ["Well patterned"],
                "weaknesses": []
            }
        }
    }

    result = rank_and_compare(experiment_data, technique_results)
    # Basic scored highest (94.0%), so Basic MUST be ranked 1st!
    assert result["winning_technique"] == "Basic"
    assert result["ranking"][0]["technique"] == "Basic"
    assert result["ranking"][1]["technique"] == "Example-Based"
    assert result["ranking"][2]["technique"] == "Structured"

@pytest.mark.asyncio
async def test_full_pipeline_mock_execution():
    from backend.app.database.connection import SessionLocal
    from backend.app.models.entities import Experiment
    from backend.app.services.automation import run_experiment_pipeline
    from backend.app.services.llm_service import BaseLLMProvider, LLMResult, llm_service

    # Create dummy mock provider to test pipeline orchestrator deterministically
    class MockProvider(BaseLLMProvider):
        def validate_configuration(self) -> bool:
            return True

        async def generate(self, prompt: str, model_name: str, temperature: float = 0.7) -> LLMResult:
            if "### Evaluation Rubric" in prompt:
                # Evaluator mock response
                json_eval = '{"accuracy": 9.0, "relevance": 8.5, "completeness": 9.0, "clarity": 9.5, "instruction_following": 9.0, "missing_information": [], "unsupported_claims": [], "strengths": ["Well structured"], "weaknesses": [], "detailed_explanation": "Strong candidate."}'
                return LLMResult(
                    response_text=json_eval,
                    execution_time=0.1,
                    input_tokens=150,
                    output_tokens=80,
                    model_name=model_name,
                    provider="mock"
                )
            # Candidate mock response
            return LLMResult(
                response_text="Artificial intelligence enables computers to perform human-like cognitive tasks such as reasoning and problem-solving.",
                execution_time=0.2,
                input_tokens=100,
                output_tokens=40,
                model_name=model_name,
                provider="mock"
            )

    original_provider = llm_service.provider
    llm_service.provider = MockProvider()

    db = SessionLocal()
    try:
        exp = Experiment(
            experiment_name="Mock E2E Pipeline Test",
            task_category="Text Summarization",
            original_input="Artificial intelligence allows computers to perform tasks that normally require human intelligence.",
            expected_output="Short accurate summary.",
            additional_instructions="Keep concise.",
            model_name="gemini-3.5-flash",
            status="PENDING"
        )
        db.add(exp)
        db.commit()
        db.refresh(exp)

        # Run pipeline
        res = await run_experiment_pipeline(exp.id, db)

        assert res["status"] == "COMPLETED"
        assert "comparison" in res
        assert "winning_technique" in res["comparison"]
        assert len(res["comparison"]["ranking"]) == 3

        # Verify DB records
        db.refresh(exp)
        assert exp.status == "COMPLETED"
        assert len(exp.prompt_results) == 3
        assert len(exp.workflow_logs) >= 1
        assert exp.workflow_logs[0].execution_status == "SUCCESS"
        assert exp.workflow_logs[0].condition_result is True

        for pr in exp.prompt_results:
            assert pr.ai_response is not None
            assert pr.evaluation is not None
            assert pr.evaluation.weighted_score > 0

    finally:
        llm_service.provider = original_provider
        db.close()
