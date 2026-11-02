"""
Trigger-Action Automation & Experiment Processing Engine

Orchestrates the 4-stage pipeline:
Stage 1: Prompt Preparation (generation and persistence)
Stage 2: AI Execution (concurrent LLM execution via same model)
Stage 3: Evaluation & Comparison (blind rubric scoring and ranking)
Stage 4: Automation & Storage (verifiable trigger-action workflow and CSV generation)
"""

import os
import csv
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session

from backend.app.models.entities import Experiment, PromptResult, Evaluation, WorkflowLog
from backend.app.services.prompt_generator import PromptGenerator
from backend.app.services.llm_service import llm_service
from backend.app.services.evaluator import EvaluationEngine
from backend.app.services.comparison import rank_and_compare

EXPORTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../exports"))
os.makedirs(EXPORTS_DIR, exist_ok=True)

def generate_csv_report(experiment: Experiment, comparison_data: Dict[str, Any]) -> str:
    """
    Generates an Excel-compatible CSV export file for the completed experiment.
    """
    file_path = os.path.join(EXPORTS_DIR, f"experiment_{experiment.id}.csv")

    with open(file_path, mode="w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)

        # Header metadata
        writer.writerow(["PROMPT PERFORMANCE COMPARISON SYSTEM - EXPERIMENT REPORT"])
        writer.writerow(["Experiment ID", experiment.id])
        writer.writerow(["Experiment Name", experiment.experiment_name])
        writer.writerow(["Task Category", experiment.task_category])
        writer.writerow(["Model Used", experiment.model_name])
        writer.writerow(["Timestamp", experiment.created_at.isoformat()])
        writer.writerow(["Winning Technique", comparison_data.get("winning_technique", "N/A")])
        writer.writerow([])

        # Task Details
        writer.writerow(["TASK SPECIFICATION"])
        writer.writerow(["Original Input", experiment.original_input])
        writer.writerow(["Expected Output", experiment.expected_output])
        writer.writerow(["Additional Instructions", experiment.additional_instructions or "None"])
        writer.writerow([])

        # Quantitative Comparison Table
        writer.writerow(["QUANTITATIVE PERFORMANCE EVALUATION"])
        writer.writerow([
            "Rank",
            "Prompting Technique",
            "Weighted Score (%)",
            "Accuracy (25%)",
            "Relevance (20%)",
            "Completeness (20%)",
            "Clarity (15%)",
            "Instruction Following (20%)",
            "Execution Time (s)",
            "Input Tokens",
            "Output Tokens"
        ])

        for item in comparison_data.get("ranking", []):
            writer.writerow([
                item.get("rank"),
                item.get("technique"),
                f"{item.get('weighted_score')}%",
                item.get("accuracy"),
                item.get("relevance"),
                item.get("completeness"),
                item.get("clarity"),
                item.get("instruction_following"),
                item.get("execution_time"),
                item.get("input_tokens") or "N/A",
                item.get("output_tokens") or "N/A"
            ])

        writer.writerow([])

        # Qualitative Analysis
        writer.writerow(["COMPARATIVE ANALYSIS & WINNER EXPLANATION"])
        writer.writerow(["Explanation", comparison_data.get("winner_explanation", "")])
        writer.writerow(["Conclusion", comparison_data.get("conclusion", "")])
        writer.writerow([])

        # Prompt & Response Transcripts
        writer.writerow(["PROMPT & RESPONSE TRANSCRIPTS"])
        for pr in experiment.prompt_results:
            writer.writerow([f"--- {pr.prompting_type.upper()} PROMPT ---"])
            writer.writerow(["Generated Prompt", pr.generated_prompt])
            writer.writerow(["AI Response", pr.ai_response])
            if pr.evaluation:
                writer.writerow(["Evaluator Justification", pr.evaluation.evaluator_explanation])
            writer.writerow([])

    return file_path

async def run_experiment_pipeline(experiment_id: str, db: Session) -> Dict[str, Any]:
    """
    Executes all 4 processing stages with database persistence and verifiable automation.
    """
    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise ValueError(f"Experiment {experiment_id} not found.")

    try:
        # -------------------------------------------------------------
        # STAGE 1: PROMPT PREPARATION
        # -------------------------------------------------------------
        experiment.status = "RUNNING"
        db.commit()

        # Generate all 3 prompt versions
        generated_prompts = PromptGenerator.generate_all(
            task_category=experiment.task_category,
            original_input=experiment.original_input,
            expected_output=experiment.expected_output,
            additional_instructions=experiment.additional_instructions or ""
        )

        # Clear any existing prompt results for clean rerun
        for old_pr in experiment.prompt_results:
            db.delete(old_pr)
        db.commit()

        prompt_results_map: Dict[str, PromptResult] = {}
        for p_type, p_text in generated_prompts.items():
            pr = PromptResult(
                experiment_id=experiment.id,
                prompting_type=p_type,
                generated_prompt=p_text,
                status="PENDING"
            )
            db.add(pr)
            prompt_results_map[p_type] = pr

        db.commit()

        # -------------------------------------------------------------
        # STAGE 2: AI EXECUTION
        # -------------------------------------------------------------
        llm_results = await llm_service.execute_comparison(
            prompts=generated_prompts,
            model_name=experiment.model_name
        )

        for p_type, res in llm_results.items():
            pr = prompt_results_map[p_type]
            pr.ai_response = res.response_text
            pr.execution_time = res.execution_time
            pr.input_tokens = res.input_tokens
            pr.output_tokens = res.output_tokens
            pr.status = "COMPLETED"

        db.commit()

        # -------------------------------------------------------------
        # STAGE 3: EVALUATION AND COMPARISON
        # -------------------------------------------------------------
        technique_evaluations: Dict[str, Dict[str, Any]] = {}

        for p_type, pr in prompt_results_map.items():
            eval_data = await EvaluationEngine.evaluate_response(
                task_category=experiment.task_category,
                original_input=experiment.original_input,
                expected_output=experiment.expected_output,
                ai_response=pr.ai_response or "",
                model_name=experiment.model_name,
                additional_instructions=experiment.additional_instructions or ""
            )

            evaluation = Evaluation(
                prompt_result_id=pr.id,
                accuracy=eval_data["accuracy"],
                relevance=eval_data["relevance"],
                completeness=eval_data["completeness"],
                clarity=eval_data["clarity"],
                instruction_following=eval_data["instruction_following"],
                weighted_score=eval_data["weighted_score"],
                evaluator_explanation=eval_data.get("detailed_explanation", ""),
                evaluation_status="COMPLETED"
            )
            db.add(evaluation)

            technique_evaluations[p_type] = {
                "execution_time": pr.execution_time,
                "input_tokens": pr.input_tokens,
                "output_tokens": pr.output_tokens,
                "evaluation": eval_data
            }

        db.commit()

        # -------------------------------------------------------------
        # STAGE 4: TRIGGER-ACTION AUTOMATION & STORAGE
        # -------------------------------------------------------------
        trigger_name = "ON_ALL_PROMPTS_EVALUATION_COMPLETED"
        trigger_time = datetime.utcnow()

        # CONDITION CHECK:
        # Verify all three prompting techniques have valid completed evaluations
        has_all_three = len(technique_evaluations) == 3
        has_valid_scores = all(
            t["evaluation"]["weighted_score"] >= 0.0 for t in technique_evaluations.values()
        )
        condition_passed = has_all_three and has_valid_scores

        if not condition_passed:
            log_entry = WorkflowLog(
                experiment_id=experiment.id,
                trigger_name=trigger_name,
                trigger_timestamp=trigger_time,
                condition_result=False,
                action_description="Condition check failed: Incomplete prompt evaluations.",
                execution_status="FAILED",
                error_message="One or more prompt evaluations did not complete with valid scores."
            )
            db.add(log_entry)
            experiment.status = "FAILED"
            db.commit()
            raise ValueError("Trigger condition check failed: Incomplete evaluations.")

        # ACTION:
        # 1. Calculate winning technique & rankings
        exp_dict = {
            "task_category": experiment.task_category,
            "original_input": experiment.original_input,
            "expected_output": experiment.expected_output,
        }
        comparison_report = rank_and_compare(exp_dict, technique_evaluations)

        # 2. Generate CSV export
        db.refresh(experiment)
        csv_path = generate_csv_report(experiment, comparison_report)

        # 3. Record verified Workflow Log
        action_desc = (
            f"Evaluated all 3 techniques -> Ranked winner '{comparison_report['winning_technique']}' "
            f"with score {comparison_report['ranking'][0]['weighted_score']}% -> "
            f"Persisted to SQLite -> Generated CSV report: {os.path.basename(csv_path)}"
        )

        log_entry = WorkflowLog(
            experiment_id=experiment.id,
            trigger_name=trigger_name,
            trigger_timestamp=trigger_time,
            condition_result=True,
            action_description=action_desc,
            execution_status="SUCCESS",
            error_message=None
        )
        db.add(log_entry)

        experiment.status = "COMPLETED"
        db.commit()

        return {
            "status": "COMPLETED",
            "experiment_id": experiment.id,
            "comparison": comparison_report,
            "csv_path": csv_path
        }

    except Exception as e:
        db.rollback()
        try:
            exp_record = db.query(Experiment).filter(Experiment.id == experiment_id).first()
            if exp_record:
                exp_record.status = "FAILED"
                err_log = WorkflowLog(
                    experiment_id=exp_record.id,
                    trigger_name="PIPELINE_ERROR",
                    trigger_timestamp=datetime.utcnow(),
                    condition_result=False,
                    action_description="Execution terminated due to an uncaught exception.",
                    execution_status="FAILED",
                    error_message=str(e)
                )
                db.add(err_log)
                db.commit()
        except Exception:
            pass
        raise e

