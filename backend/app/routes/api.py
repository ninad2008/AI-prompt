import os
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database.connection import get_db
from backend.app.models.entities import Experiment, PromptResult, Evaluation, WorkflowLog
from backend.app.schemas.experiment import (
    ExperimentCreate,
    ExperimentRead,
    ComparisonReport,
    TechniqueDetail,
    DashboardStats,
    ApiKeySettings,
    SUPPORTED_MODELS,
    VALID_TASK_CATEGORIES
)
from backend.app.services.llm_service import llm_service, MissingApiKeyError, LLMExecutionError
from backend.app.services.automation import run_experiment_pipeline, generate_csv_report, EXPORTS_DIR
from backend.app.services.comparison import rank_and_compare

router = APIRouter()

@router.get("/health")
def check_health(db: Session = Depends(get_db)):
    """Health check for backend, database connectivity, and API configuration."""
    try:
        db.execute(func.now())
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "database": db_status,
        "api_key_configured": llm_service.is_configured(),
        "default_model": os.getenv("DEFAULT_MODEL", "gemini-3.5-flash"),
        "supported_models": SUPPORTED_MODELS,
        "task_categories": VALID_TASK_CATEGORIES,
    }

@router.get("/settings/api-key")
def get_api_key_status():
    """Returns configuration status of the Gemini API key without leaking the key."""
    configured = llm_service.is_configured()
    masked = ""
    if configured:
        # provider key masked
        key = getattr(llm_service.provider, "_api_key", "")
        if len(key) >= 8:
            masked = f"{key[:4]}...{key[-4:]}"
        else:
            masked = "***configured***"
    return {
        "configured": configured,
        "masked_key": masked,
        "setup_instructions": (
            "To configure your Gemini API Key:\n"
            "1. Visit https://aistudio.google.com/app/apikey and create a free Gemini API key.\n"
            "2. Enter it below and click 'Save API Key', or place it in your .env file as GEMINI_API_KEY=...\n"
            "3. No credit card is required for the free tier."
        )
    }

@router.post("/settings/api-key")
def update_api_key(settings: ApiKeySettings):
    """Updates the Gemini API key dynamically and stores it in .env."""
    key = settings.api_key.strip()
    if not key or len(key) < 5:
        raise HTTPException(status_code=400, detail="Provided API key is invalid or too short.")

    llm_service.update_api_key(key)

    # Persist to .env file if feasible
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.env"))
    try:
        lines = []
        key_found = False
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        lines.append(f"GEMINI_API_KEY={key}\n")
                        key_found = True
                    else:
                        lines.append(line)
        if not key_found:
            lines.append(f"GEMINI_API_KEY={key}\n")
        with open(env_path, "w") as f:
            f.writelines(lines)
    except Exception:
        pass

    return {
        "status": "success",
        "message": "Gemini API key updated successfully.",
        "configured": True
    }

@router.get("/models")
def get_models():
    """Lists supported AI models."""
    return {"models": SUPPORTED_MODELS}

@router.post("/experiments", response_model=ExperimentRead, status_code=status.HTTP_201_CREATED)
def create_experiment(payload: ExperimentCreate, db: Session = Depends(get_db)):
    """Creates a new prompt comparison experiment record."""
    experiment = Experiment(
        experiment_name=payload.experiment_name,
        task_category=payload.task_category,
        original_input=payload.original_input,
        expected_output=payload.expected_output,
        additional_instructions=payload.additional_instructions,
        model_name=payload.model_name or "gemini-3.5-flash",
        status="PENDING"
    )
    db.add(experiment)
    db.commit()
    db.refresh(experiment)
    return experiment

@router.post("/experiments/{experiment_id}/run")
async def run_experiment(experiment_id: str, db: Session = Depends(get_db)):
    """
    Executes the 4-stage pipeline for the given experiment:
    1. Prompt Preparation
    2. AI Execution
    3. Evaluation & Comparison
    4. Automation & Storage
    """
    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found.")

    if not llm_service.is_configured():
        raise HTTPException(
            status_code=400,
            detail=(
                "Gemini API Key is missing. Please configure your key in Settings or add GEMINI_API_KEY to your .env file. "
                "You can get a free key at https://aistudio.google.com/app/apikey"
            )
        )

    try:
        result = await run_experiment_pipeline(experiment_id=experiment_id, db=db)
        return result
    except MissingApiKeyError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LLMExecutionError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")

@router.get("/experiments", response_model=List[ExperimentRead])
def list_experiments(db: Session = Depends(get_db)):
    """Lists all experiments in descending order of creation."""
    return db.query(Experiment).order_by(Experiment.created_at.desc()).all()

@router.get("/experiments/{experiment_id}", response_model=ExperimentRead)
def get_experiment(experiment_id: str, db: Session = Depends(get_db)):
    """Retrieves full details of a specific experiment."""
    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    return experiment

@router.get("/experiments/{experiment_id}/report", response_model=ComparisonReport)
def get_experiment_report(experiment_id: str, db: Session = Depends(get_db)):
    """Generates and retrieves the full structured comparison report for an experiment."""
    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found.")

    if experiment.status != "COMPLETED" or len(experiment.prompt_results) < 3:
        raise HTTPException(
            status_code=400,
            detail=f"Experiment report unavailable. Current experiment status is '{experiment.status}'."
        )

    technique_evaluations: Dict[str, Dict[str, Any]] = {}
    technique_details: List[TechniqueDetail] = []

    for pr in experiment.prompt_results:
        ev = pr.evaluation
        if not ev:
            continue

        detail = TechniqueDetail(
            prompting_type=pr.prompting_type,
            generated_prompt=pr.generated_prompt,
            ai_response=pr.ai_response or "",
            execution_time=pr.execution_time,
            input_tokens=pr.input_tokens,
            output_tokens=pr.output_tokens,
            accuracy=ev.accuracy,
            relevance=ev.relevance,
            completeness=ev.completeness,
            clarity=ev.clarity,
            instruction_following=ev.instruction_following,
            weighted_score=ev.weighted_score,
            explanation=ev.evaluator_explanation or ""
        )
        technique_details.append(detail)

        technique_evaluations[pr.prompting_type] = {
            "execution_time": pr.execution_time,
            "input_tokens": pr.input_tokens,
            "output_tokens": pr.output_tokens,
            "evaluation": {
                "accuracy": ev.accuracy,
                "relevance": ev.relevance,
                "completeness": ev.completeness,
                "clarity": ev.clarity,
                "instruction_following": ev.instruction_following,
                "weighted_score": ev.weighted_score,
                "detailed_explanation": ev.evaluator_explanation,
            }
        }

    exp_dict = {
        "task_category": experiment.task_category,
        "original_input": experiment.original_input,
        "expected_output": experiment.expected_output,
    }
    comp_data = rank_and_compare(exp_dict, technique_evaluations)

    return ComparisonReport(
        experiment_id=experiment.id,
        experiment_name=experiment.experiment_name,
        task_category=experiment.task_category,
        model_name=experiment.model_name,
        original_input=experiment.original_input,
        expected_output=experiment.expected_output,
        additional_instructions=experiment.additional_instructions,
        techniques=technique_details,
        ranking=comp_data["ranking"],
        winning_technique=comp_data["winning_technique"],
        winner_explanation=comp_data["winner_explanation"],
        strengths_weaknesses=comp_data["strengths_weaknesses"],
        conclusion=comp_data["conclusion"]
    )

@router.api_route("/experiments/{experiment_id}/export", methods=["GET", "HEAD"])
def export_experiment(experiment_id: str, db: Session = Depends(get_db)):
    """Exports the experiment report as a downloadable CSV file."""
    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found.")

    csv_path = os.path.join(EXPORTS_DIR, f"experiment_{experiment.id}.csv")
    if not os.path.exists(csv_path):
        # Generate it on demand
        try:
            report = get_experiment_report(experiment_id=experiment_id, db=db)
            csv_path = generate_csv_report(experiment, report.model_dump())
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Cannot generate export: {str(e)}")

    import re
    safe_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", experiment.experiment_name)[:40]
    return FileResponse(
        path=csv_path,
        media_type="text/csv",
        filename=f"experiment_{safe_name}_{experiment.id[:8]}.csv"
    )

@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Computes actual, dynamic dashboard statistics from persisted SQLite records."""
    total_experiments = db.query(Experiment).count()
    total_prompts_tested = db.query(PromptResult).count()

    evals = db.query(Evaluation).filter(Evaluation.evaluation_status == "COMPLETED").all()
    avg_score = round(sum(e.weighted_score for e in evals) / len(evals), 1) if evals else 0.0

    # Aggregate scores per technique
    technique_scores: Dict[str, List[float]] = {"Basic": [], "Structured": [], "Example-Based": []}
    prompt_results = db.query(PromptResult).join(Evaluation).all()
    for pr in prompt_results:
        if pr.evaluation and pr.prompting_type in technique_scores:
            technique_scores[pr.prompting_type].append(pr.evaluation.weighted_score)

    technique_averages = {}
    for tech, scores in technique_scores.items():
        technique_averages[tech] = round(sum(scores) / len(scores), 1) if scores else 0.0

    # Best performing technique
    best_technique = "N/A"
    if any(technique_averages.values()):
        best_technique = max(technique_averages.items(), key=lambda x: x[1])[0]

    # Recent experiments
    recent_exps = db.query(Experiment).order_by(Experiment.created_at.desc()).limit(5).all()
    recent_list = []
    for exp in recent_exps:
        # Determine winner if completed
        winner = "Pending"
        top_score = 0.0
        if exp.status == "COMPLETED" and exp.prompt_results:
            scored = [
                (pr.prompting_type, pr.evaluation.weighted_score)
                for pr in exp.prompt_results if pr.evaluation
            ]
            if scored:
                scored.sort(key=lambda x: x[1], reverse=True)
                winner = scored[0][0]
                top_score = scored[0][1]

        recent_list.append({
            "id": exp.id,
            "experiment_name": exp.experiment_name,
            "task_category": exp.task_category,
            "status": exp.status,
            "model_name": exp.model_name,
            "created_at": exp.created_at.isoformat(),
            "winner": winner,
            "top_score": top_score
        })

    return DashboardStats(
        total_experiments=total_experiments,
        total_prompts_tested=total_prompts_tested,
        average_evaluation_score=avg_score,
        best_performing_technique=best_technique,
        technique_performance=technique_averages,
        recent_experiments=recent_list
    )

@router.get("/workflows")
def list_workflow_logs(db: Session = Depends(get_db)):
    """Retrieves all verifiable trigger-action workflow execution logs."""
    logs = db.query(WorkflowLog).order_by(WorkflowLog.trigger_timestamp.desc()).all()
    output = []
    for log in logs:
        output.append({
            "id": log.id,
            "experiment_id": log.experiment_id,
            "trigger_name": log.trigger_name,
            "trigger_timestamp": log.trigger_timestamp.isoformat(),
            "condition_result": log.condition_result,
            "action_description": log.action_description,
            "execution_status": log.execution_status,
            "error_message": log.error_message
        })
    return output

