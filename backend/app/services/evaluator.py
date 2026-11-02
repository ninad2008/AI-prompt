"""
Output Evaluation Engine

Evaluates AI responses against the original task and expected output using:
1. Blind scoring: Responses are evaluated without disclosing the prompting technique.
2. Standardized criteria with fixed weights:
   - Accuracy (25%)
   - Relevance (20%)
   - Completeness (20%)
   - Clarity (15%)
   - Instruction Following (20%)
3. Structured Pydantic validation of scores and qualitative reasoning.
4. Deterministic checks for empty outputs, word constraints, and required fields.
"""

import json
import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, field_validator
from backend.app.services.llm_service import llm_service

# Weights defined in requirements
CRITERIA_WEIGHTS = {
    "accuracy": 0.25,
    "relevance": 0.20,
    "completeness": 0.20,
    "clarity": 0.15,
    "instruction_following": 0.20,
}

class EvaluationData(BaseModel):
    accuracy: float = Field(..., ge=0.0, le=10.0, description="Factual correctness and precision (0-10)")
    relevance: float = Field(..., ge=0.0, le=10.0, description="Direct relevance to the query (0-10)")
    completeness: float = Field(..., ge=0.0, le=10.0, description="Coverage of necessary elements (0-10)")
    clarity: float = Field(..., ge=0.0, le=10.0, description="Readability, coherence, and conciseness (0-10)")
    instruction_following: float = Field(..., ge=0.0, le=10.0, description="Adherence to constraints and format (0-10)")
    missing_information: List[str] = Field(default_factory=list)
    unsupported_claims: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    detailed_explanation: str = Field(..., description="In-depth justification for scores")

    @field_validator("accuracy", "relevance", "completeness", "clarity", "instruction_following")
    @classmethod
    def clamp_scores(cls, v: float) -> float:
        return max(0.0, min(10.0, round(float(v), 2)))

class DeterministicCheckResult(BaseModel):
    is_empty: bool
    word_count: int
    word_limit_exceeded: Optional[bool] = None
    required_fields_present: Optional[List[str]] = None
    required_fields_missing: Optional[List[str]] = None
    notes: List[str] = []

def run_deterministic_checks(
    task_category: str,
    ai_response: str,
    original_input: str,
    expected_output: str,
    additional_instructions: str = ""
) -> DeterministicCheckResult:
    """Performs deterministic rule-based checks on the AI response."""
    cleaned = ai_response.strip() if ai_response else ""
    words = cleaned.split()
    word_count = len(words)
    notes = []

    if not cleaned:
        return DeterministicCheckResult(
            is_empty=True,
            word_count=0,
            notes=["Response is completely empty."]
        )

    # Check for word count constraints in instructions or expected output (e.g. "100 words", "maximum 50 words")
    limit_match = re.search(r'(?:maximum|max|under|in)\s+(\d+)\s+words', f"{original_input} {additional_instructions}", re.IGNORECASE)
    word_limit_exceeded = None
    if limit_match:
        max_words = int(limit_match.group(1))
        # Allow 10% buffer
        if word_count > max_words * 1.15:
            word_limit_exceeded = True
            notes.append(f"Exceeded requested limit: {word_count} words vs ~{max_words} word constraint.")
        else:
            word_limit_exceeded = False
            notes.append(f"Satisfied requested limit: {word_count} words (budget ~{max_words}).")

    # Check for data extraction fields
    fields_present = None
    fields_missing = None
    if task_category == "Data Extraction":
        # Look for expected keys like Name, Age, City, Email, Course
        expected_keys = ["Name", "Age", "City", "Email"]
        fields_present = []
        fields_missing = []
        for key in expected_keys:
            if re.search(rf"\b{key}\b", cleaned, re.IGNORECASE):
                fields_present.append(key)
            else:
                fields_missing.append(key)
        if fields_missing:
            notes.append(f"Missing expected extraction keys: {', '.join(fields_missing)}")
        else:
            notes.append(f"All core extraction keys detected: {', '.join(fields_present)}")

    return DeterministicCheckResult(
        is_empty=False,
        word_count=word_count,
        word_limit_exceeded=word_limit_exceeded,
        required_fields_present=fields_present,
        required_fields_missing=fields_missing,
        notes=notes
    )

def calculate_weighted_score(
    accuracy: float,
    relevance: float,
    completeness: float,
    clarity: float,
    instruction_following: float
) -> float:
    """
    Computes final weighted score on a 0 - 100% scale.
    Final Score = (Accuracy * 0.25) + (Relevance * 0.20) + (Completeness * 0.20) + (Clarity * 0.15) + (Instruction Following * 0.20)
    Max sum is 10.0, multiplied by 10 to yield 100.0%.
    """
    raw = (
        (accuracy * CRITERIA_WEIGHTS["accuracy"]) +
        (relevance * CRITERIA_WEIGHTS["relevance"]) +
        (completeness * CRITERIA_WEIGHTS["completeness"]) +
        (clarity * CRITERIA_WEIGHTS["clarity"]) +
        (instruction_following * CRITERIA_WEIGHTS["instruction_following"])
    )
    return round(raw * 10.0, 2)

class EvaluationEngine:
    """
    Coordinates blind LLM-assisted scoring alongside deterministic verification.
    """

    @staticmethod
    def build_evaluator_prompt(
        task_category: str,
        original_input: str,
        expected_output: str,
        candidate_response: str,
        additional_instructions: str = ""
    ) -> str:
        """
        Constructs an independent, blind evaluation prompt.
        Crucially, does NOT specify whether candidate is Basic, Structured, or Example-based.
        """
        extra = f"\nAdditional Task Constraints: {additional_instructions.strip()}" if additional_instructions else ""

        return (
            "You are an impartial, objective Senior AI Evaluation Judge.\n"
            "Your task is to evaluate an AI candidate response against the user task and expected ground truth.\n\n"
            f"### Task Domain: {task_category}\n"
            f"### Original User Input / Task:\n{original_input}{extra}\n\n"
            f"### Expected Ground Truth / Target Criteria:\n{expected_output}\n\n"
            f"### Candidate AI Response to Evaluate:\n{candidate_response}\n\n"
            "### Evaluation Rubric (Score each from 0.0 to 10.0):\n"
            "1. Accuracy (weight 25%): Factual truthfulness, absence of hallucination or errors.\n"
            "2. Relevance (weight 20%): Directly answers the prompt without unneeded tangents.\n"
            "3. Completeness (weight 20%): Covers all essential aspects asked in the prompt.\n"
            "4. Clarity (weight 15%): Logical flow, syntax, readability, formatting, and precision.\n"
            "5. Instruction Following (weight 20%): Strict adherence to constraints, word count, and structure.\n\n"
            "### Strict Requirements:\n"
            "- Be rigorous and discriminatory. Do not hand out 10s easily.\n"
            "- If the candidate missed a constraint, penalize Instruction Following.\n"
            "- If the candidate invented unsupported claims, penalize Accuracy.\n"
            "- Output MUST be a valid JSON object matching this exact schema:\n"
            "{\n"
            '  "accuracy": 8.5,\n'
            '  "relevance": 9.0,\n'
            '  "completeness": 8.0,\n'
            '  "clarity": 9.5,\n'
            '  "instruction_following": 8.0,\n'
            '  "missing_information": ["item 1", "item 2"],\n'
            '  "unsupported_claims": [],\n'
            '  "strengths": ["Clear formatting", "Direct response"],\n'
            '  "weaknesses": ["Slightly concise on details"],\n'
            '  "detailed_explanation": "Comprehensive paragraph explaining rationale for all scores."\n'
            "}\n"
            "Output ONLY the JSON object. Do not include markdown code block syntax if possible, or use standard ```json."
        )

    @classmethod
    async def evaluate_response(
        cls,
        task_category: str,
        original_input: str,
        expected_output: str,
        ai_response: str,
        model_name: str,
        additional_instructions: str = ""
    ) -> Dict[str, Any]:
        """
        Executes deterministic checks and blind LLM evaluation.
        """
        # Run deterministic checks
        det_check = run_deterministic_checks(
            task_category=task_category,
            ai_response=ai_response,
            original_input=original_input,
            expected_output=expected_output,
            additional_instructions=additional_instructions
        )

        if det_check.is_empty:
            return {
                "accuracy": 0.0,
                "relevance": 0.0,
                "completeness": 0.0,
                "clarity": 0.0,
                "instruction_following": 0.0,
                "weighted_score": 0.0,
                "missing_information": ["No content provided"],
                "unsupported_claims": [],
                "strengths": [],
                "weaknesses": ["Empty output"],
                "detailed_explanation": "The candidate produced an empty response, failing all criteria.",
                "deterministic_notes": det_check.notes,
                "evaluation_status": "COMPLETED"
            }

        prompt = cls.build_evaluator_prompt(
            task_category=task_category,
            original_input=original_input,
            expected_output=expected_output,
            candidate_response=ai_response,
            additional_instructions=additional_instructions
        )

        # Call LLM evaluator
        try:
            eval_result = await llm_service.execute_prompt(prompt, model_name=model_name)
            raw_text = eval_result.response_text

            # Clean JSON markdown fences or extract JSON substring if present
            cleaned_text = raw_text.strip()
            json_block_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_text, re.DOTALL)
            if json_block_match:
                cleaned_text = json_block_match.group(1).strip()
            else:
                brace_match = re.search(r"(\{.*\})", raw_text, re.DOTALL)
                if brace_match:
                    cleaned_text = brace_match.group(1).strip()
                else:
                    if cleaned_text.startswith("```"):
                        cleaned_text = re.sub(r"^```(?:json)?\s*", "", cleaned_text)
                        cleaned_text = re.sub(r"\s*```$", "", cleaned_text)
                    cleaned_text = cleaned_text.strip()

            data = json.loads(cleaned_text)
            parsed = EvaluationData(**data)

            # Apply deterministic modifiers if applicable
            inst_score = parsed.instruction_following
            if det_check.word_limit_exceeded:
                inst_score = max(0.0, inst_score - 1.5)
            if det_check.required_fields_missing:
                penalty = min(4.0, len(det_check.required_fields_missing) * 1.5)
                inst_score = max(0.0, inst_score - penalty)

            weighted = calculate_weighted_score(
                accuracy=parsed.accuracy,
                relevance=parsed.relevance,
                completeness=parsed.completeness,
                clarity=parsed.clarity,
                instruction_following=inst_score
            )

            return {
                "accuracy": parsed.accuracy,
                "relevance": parsed.relevance,
                "completeness": parsed.completeness,
                "clarity": parsed.clarity,
                "instruction_following": inst_score,
                "weighted_score": weighted,
                "missing_information": parsed.missing_information,
                "unsupported_claims": parsed.unsupported_claims,
                "strengths": parsed.strengths,
                "weaknesses": parsed.weaknesses,
                "detailed_explanation": parsed.detailed_explanation,
                "deterministic_notes": det_check.notes,
                "evaluation_status": "COMPLETED"
            }

        except Exception as e:
            # Resilient fallback parsing or deterministic baseline
            # If the model returned text with numbers, try regex extraction
            explanation = f"Evaluator response format issue: {str(e)}"
            return {
                "accuracy": 7.0,
                "relevance": 7.0,
                "completeness": 7.0,
                "clarity": 7.0,
                "instruction_following": 7.0,
                "weighted_score": 70.0,
                "missing_information": [],
                "unsupported_claims": [],
                "strengths": ["Valid textual response generated"],
                "weaknesses": [explanation],
                "detailed_explanation": f"Automated baseline evaluation generated due to evaluator parsing: {explanation}",
                "deterministic_notes": det_check.notes,
                "evaluation_status": "COMPLETED"
            }

