# Prompt Engineering Techniques & Evaluation Rubric Reference

This document provides complete architectural specifications, templates, and exemplars for all prompting paradigms and evaluation prompts implemented in the **Prompt Performance Comparison System**.

---

## 1. Experimental Integrity Principle

To ensure fair empirical evaluation:
1. **Identical Model:** All three techniques are executed against the exact same underlying LLM model (e.g. `gemini-2.5-flash`).
2. **Identical Input:** The user's original task and raw input text are fed verbatim into all three prompt templates.
3. **Independent Execution:** Each prompt is dispatched independently to prevent context contamination across techniques.
4. **Blind Scoring:** The evaluation engine grades candidate responses anonymously without knowing which prompt engineering method produced them.

---

## 2. Prompt Version Specifications

### Version 1: Basic Prompting (Zero-Shot Direct)
- **Concept:** Direct, straightforward command instruction without explicit reasoning frameworks, roles, or few-shot exemplars.
- **Template:**
  ```text
  [Direct Category Command]: [ADDITIONAL CONSTRAINTS]

  [ORIGINAL INPUT]
  ```
- **Example (Text Summarization):**
  ```text
  Summarize the following passage clearly and concisely: Note: Maximum 20 words.

  Artificial intelligence allows computers to perform tasks that normally require human intelligence, including learning, reasoning, and problem-solving.
  ```

---

### Version 2: Structured Prompting (Decomposed Schema)
- **Concept:** Multi-section cognitive scaffolding explicitly providing Role, Objective, Context, Step-by-Step Instructions, Constraints, Expected Output Schema, and Quality Requirements.
- **Template:**
  ```text
  You are an [EXPERT ROLE].

  ### Objective:
  [CATEGORY OBJECTIVE]

  ### Context:
  This task belongs to the '[TASK CATEGORY]' domain. The output must satisfy rigorous academic and technical evaluation standards.

  ### Step-by-Step Instructions:
  1. Read the input thoroughly to identify the primary entities, facts, or instructions.
  2. Address every explicit constraint or question posed in the input.
  3. Filter out irrelevant details while preserving all critical information.
  4. Formulate the response directly matching the requested structure.
  5. Review the final response against the constraints before concluding.

  ### Constraints:
  - Maintain strict factual fidelity to the provided input.
  - Do not extrapolate, assume, or hallucinate unsupported claims.
  - Adhere strictly to tone, length, and formatting expectations.
  - Additional constraint: [USER ADDITIONAL INSTRUCTIONS]

  ### Expected Output Format:
  [EXPECTED OUTPUT SPECIFICATION]

  ### Quality Requirements:
  [QUALITY METRIC SPECIFICATION]

  ### Input:
  [ORIGINAL INPUT]

  Provide your final, structured response below:
  ```

---

### Version 3: Example-Based Prompting (Few-Shot Demonstration)
- **Concept:** Conditions the model by demonstrating input-output pairs that model desired tone, depth, and structure without revealing or leaking the solution to the target test input.
- **Template:**
  ```text
  You are an [EXPERT ROLE].
  Objective: [CATEGORY OBJECTIVE]

  Study the following demonstrated example(s) to understand the expected formatting, tone, and depth:

  --- Example 1 ---
  Input:
  [CATEGORY EXEMPLAR INPUT 1]

  Output:
  [CATEGORY EXEMPLAR OUTPUT 1]

  --- Target Task ---
  Now perform the same operation for the following target input.
  Additional constraint: [USER ADDITIONAL INSTRUCTIONS]
  Follow the demonstrated style, preserve exact meaning, and avoid unsupported claims.

  Input:
  [ORIGINAL INPUT]

  Output:
  ```

---

## 3. Independent Evaluator Prompt (Blind Scoring Rubric)

Candidate outputs are evaluated using an independent LLM prompt designed to prevent bias:

```text
You are an impartial, objective Senior AI Evaluation Judge.
Your task is to evaluate an AI candidate response against the user task and expected ground truth.

### Task Domain: {task_category}
### Original User Input / Task:
{original_input}
Additional Task Constraints: {additional_instructions}

### Expected Ground Truth / Target Criteria:
{expected_output}

### Candidate AI Response to Evaluate:
{candidate_response}

### Evaluation Rubric (Score each from 0.0 to 10.0):
1. Accuracy (weight 25%): Factual truthfulness, absence of hallucination or errors.
2. Relevance (weight 20%): Directly answers the prompt without unneeded tangents.
3. Completeness (weight 20%): Covers all essential aspects asked in the prompt.
4. Clarity (weight 15%): Logical flow, syntax, readability, formatting, and precision.
5. Instruction Following (weight 20%): Strict adherence to constraints, word count, and structure.

### Strict Requirements:
- Be rigorous and discriminatory. Do not hand out 10s easily.
- If the candidate missed a constraint, penalize Instruction Following.
- If the candidate invented unsupported claims, penalize Accuracy.
- Output MUST be a valid JSON object matching this exact schema:
{
  "accuracy": 8.5,
  "relevance": 9.0,
  "completeness": 8.0,
  "clarity": 9.5,
  "instruction_following": 8.0,
  "missing_information": ["item 1"],
  "unsupported_claims": [],
  "strengths": ["Clear formatting", "Direct response"],
  "weaknesses": ["Slightly concise on details"],
  "detailed_explanation": "Comprehensive paragraph explaining rationale for all scores."
}
```

---

## 4. Canonical Weighting Formula

$$\text{Final Weighted Score (\%)} = \left(0.25 \cdot \text{Acc} + 0.20 \cdot \text{Rel} + 0.20 \cdot \text{Comp} + 0.15 \cdot \text{Clar} + 0.20 \cdot \text{Inst}\right) \times 10$$

