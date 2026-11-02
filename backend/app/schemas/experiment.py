from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict

VALID_TASK_CATEGORIES = [
    "Text Summarization",
    "Content Generation",
    "Question Answering",
    "Classification",
    "Data Extraction",
    "Logical Reasoning",
    "General Tasks",
]

SUPPORTED_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3-flash-preview",
]

class ExperimentCreate(BaseModel):
    experiment_name: str = Field(..., min_length=2, max_length=255, description="Name or title of the experiment")
    task_category: str = Field(..., description="Category of the task")
    original_input: str = Field(..., description="The user task description or raw text input to process")
    expected_output: str = Field(..., description="Expected output description or ground truth reference")
    additional_instructions: Optional[str] = Field(default="", description="Optional additional guidance or constraints")
    model_name: Optional[str] = Field(default="gemini-3.5-flash", description="Underlying LLM model identifier")

    @field_validator("original_input")
    @classmethod
    def validate_original_input(cls, v: str) -> str:
        trimmed = v.strip() if v else ""
        if len(trimmed) < 5:
            raise ValueError("Original input must contain at least 5 non-whitespace characters.")
        return trimmed

    @field_validator("experiment_name")
    @classmethod
    def validate_experiment_name(cls, v: str) -> str:
        trimmed = v.strip() if v else ""
        if not trimmed:
            raise ValueError("Experiment name cannot be empty.")
        return trimmed

    @field_validator("task_category")
    @classmethod
    def validate_task_category(cls, v: str) -> str:
        if v not in VALID_TASK_CATEGORIES:
            raise ValueError(f"Task category must be one of: {', '.join(VALID_TASK_CATEGORIES)}")
        return v

class EvaluationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    prompt_result_id: str
    accuracy: float
    relevance: float
    completeness: float
    clarity: float
    instruction_following: float
    weighted_score: float
    evaluator_explanation: Optional[str] = None
    evaluation_status: str

class PromptResultRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    experiment_id: str
    prompting_type: str
    generated_prompt: str
    ai_response: Optional[str] = None
    execution_time: float
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    status: str
    evaluation: Optional[EvaluationRead] = None

class WorkflowLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    experiment_id: str
    trigger_name: str
    trigger_timestamp: datetime
    condition_result: bool
    action_description: str
    execution_status: str
    error_message: Optional[str] = None

class ExperimentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    experiment_name: str
    task_category: str
    original_input: str
    expected_output: str
    additional_instructions: Optional[str] = None
    model_name: str
    created_at: datetime
    status: str
    prompt_results: List[PromptResultRead] = []
    workflow_logs: List[WorkflowLogRead] = []

class TechniqueDetail(BaseModel):
    prompting_type: str
    generated_prompt: str
    ai_response: str
    execution_time: float
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    accuracy: float
    relevance: float
    completeness: float
    clarity: float
    instruction_following: float
    weighted_score: float
    explanation: str

class ComparisonReport(BaseModel):
    experiment_id: str
    experiment_name: str
    task_category: str
    model_name: str
    original_input: str
    expected_output: str
    additional_instructions: Optional[str] = None
    techniques: List[TechniqueDetail]
    ranking: List[Dict[str, Any]]
    winning_technique: str
    winner_explanation: str
    strengths_weaknesses: Dict[str, Dict[str, List[str]]]
    conclusion: str
    ai_evaluation_disclaimer: str = (
        "Note: All response evaluation scores and rankings are produced via an automated, "
        "blinded LLM-assisted evaluation rubric. They represent rigorous automated estimates rather "
        "than absolute human ground truth."
    )

class DashboardStats(BaseModel):
    total_experiments: int
    total_prompts_tested: int
    average_evaluation_score: float
    best_performing_technique: str
    technique_performance: Dict[str, float]
    recent_experiments: List[Dict[str, Any]]

class ApiKeySettings(BaseModel):
    api_key: str
