import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Text,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base

def generate_uuid():
    return str(uuid.uuid4())

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    experiment_name = Column(String(255), nullable=False)
    task_category = Column(String(100), nullable=False)
    original_input = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    additional_instructions = Column(Text, nullable=True)
    model_name = Column(String(100), nullable=False, default="gemini-2.5-flash")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, RUNNING, COMPLETED, FAILED

    # Relationships
    prompt_results = relationship("PromptResult", back_populates="experiment", cascade="all, delete-orphan")
    workflow_logs = relationship("WorkflowLog", back_populates="experiment", cascade="all, delete-orphan")

class PromptResult(Base):
    __tablename__ = "prompt_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    experiment_id = Column(String(36), ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False)
    prompting_type = Column(String(50), nullable=False)  # Basic, Structured, Example-Based
    generated_prompt = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=True)
    execution_time = Column(Float, default=0.0)
    input_tokens = Column(Integer, nullable=True)
    output_tokens = Column(Integer, nullable=True)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, COMPLETED, FAILED

    # Relationships
    experiment = relationship("Experiment", back_populates="prompt_results")
    evaluation = relationship("Evaluation", back_populates="prompt_result", uselist=False, cascade="all, delete-orphan")

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    prompt_result_id = Column(String(36), ForeignKey("prompt_results.id", ondelete="CASCADE"), nullable=False, unique=True)
    accuracy = Column(Float, nullable=False, default=0.0)              # 0.0 - 10.0
    relevance = Column(Float, nullable=False, default=0.0)             # 0.0 - 10.0
    completeness = Column(Float, nullable=False, default=0.0)          # 0.0 - 10.0
    clarity = Column(Float, nullable=False, default=0.0)               # 0.0 - 10.0
    instruction_following = Column(Float, nullable=False, default=0.0) # 0.0 - 10.0
    weighted_score = Column(Float, nullable=False, default=0.0)        # 0.0 - 100.0%
    evaluator_explanation = Column(Text, nullable=True)
    evaluation_status = Column(String(50), default="PENDING", nullable=False) # PENDING, COMPLETED, FAILED

    # Relationships
    prompt_result = relationship("PromptResult", back_populates="evaluation")

class WorkflowLog(Base):
    __tablename__ = "workflow_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    experiment_id = Column(String(36), ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False)
    trigger_name = Column(String(255), nullable=False)
    trigger_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    condition_result = Column(Boolean, nullable=False, default=False)
    action_description = Column(Text, nullable=False)
    execution_status = Column(String(50), nullable=False)  # SUCCESS, FAILED
    error_message = Column(Text, nullable=True)

    # Relationships
    experiment = relationship("Experiment", back_populates="workflow_logs")

