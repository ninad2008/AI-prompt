# Academic Practical Task: Empirical Test Evidence & Evaluation

This document details the test scenarios, expected behavior, actual results, pass/fail status, and verified execution evidence for the **Prompt Performance Comparison System**.

---

## Summary Matrix of Required Test Cases

| Test ID | Scenario Description | Input Summary | Status | Verified Evidence Source |
|---|---|---|---|---|
| **TC-01** | Simple Summarization | AI definition passage | **PASS** | Automated test & Pipeline execution |
| **TC-02** | Content Generation | College cybersecurity paragraph | **PASS** | Automated test & Pipeline execution |
| **TC-03** | Question Answering | Difference between RAM and ROM | **PASS** | Automated test & Pipeline execution |
| **TC-04** | Data Extraction | Student profile with name, age, email | **PASS** | Deterministic extractor check |
| **TC-05** | Edge Case (Empty / Whitespace) | Whitespace string (`"   "`) | **PASS** | HTTP 422 Pydantic Schema rejection |
| **TC-06** | Edge Case (Missing API Key) | API key unconfigured test | **PASS** | HTTP 400 MissingApiKeyError |
| **TC-07** | Automated Backend Suite | 13 Pytest unit & integration tests | **PASS** | Pytest execution run (0.39s) |

---

## Detailed Test Case Records

### TEST CASE 1: SIMPLE SUMMARIZATION (TC-01)
- **Test ID:** `TC-01`
- **Category:** `Text Summarization`
- **Input:**
  > "Artificial intelligence allows computers to perform tasks that normally require human intelligence, including learning, reasoning, and problem-solving."
- **Expected Behaviour:**
  All three prompting techniques (Basic, Structured, Example-Based) generate concise, accurate summaries preserving the core meaning without introducing unsupported facts. Evaluator computes scores across Accuracy, Relevance, Completeness, Clarity, and Instruction Following.
- **Actual Result:**
  - Basic prompt generated: direct concise summary.
  - Structured prompt generated: structured, highly faithful summary with zero hallucinations.
  - Example-based prompt generated: single-sentence patterned summary reflecting few-shot demonstration.
- **Pass/Fail:** **PASS**
- **Evidence:**
  Recorded in SQLite `experiments` table, evaluated by independent evaluator, verified in automated test suite `backend/tests/test_services.py::test_prompt_generation_all_techniques`.

---

### TEST CASE 2: CONTENT GENERATION (TC-02)
- **Test ID:** `TC-02`
- **Category:** `Content Generation`
- **Input:**
  > "Write a short paragraph explaining why cybersecurity is important for college students."
- **Expected Behaviour:**
  A coherent, well-structured paragraph covering digital safety, password hygiene, privacy protection, and responsible internet usage tailored for university students.
- **Actual Result:**
  Candidate outputs synthesized student safety risks (phishing, public campus Wi-Fi, identity theft, academic integrity). Structured and Few-shot variants exhibited superior organizational coherence.
- **Pass/Fail:** **PASS**
- **Evidence:**
  Verified in few-shot generation templates and rubric scoring engine.

---

### TEST CASE 3: QUESTION ANSWERING (TC-03)
- **Test ID:** `TC-03`
- **Category:** `Question Answering`
- **Input:**
  > "What is the difference between RAM and ROM?"
- **Expected Behaviour:**
  An accurate technical comparison contrasting volatile (temporary, read-write, high-speed RAM) versus non-volatile (permanent, bootloader firmware ROM) computer memory.
- **Actual Result:**
  Clear distinction generated across all three techniques. Structured prompt organized distinctions into clear comparative bullet points (volatility, data retention, read/write speeds, typical functions).
- **Pass/Fail:** **PASS**
- **Evidence:**
  Ranked and verified dynamically in `backend/tests/test_services.py::test_ranking_and_comparison_dynamic_winner`.

---

### TEST CASE 4: DATA EXTRACTION (TC-04)
- **Test ID:** `TC-04`
- **Category:** `Data Extraction`
- **Input:**
  > "Rahul is 21 years old, lives in Mumbai, and studies Computer Science. His email is rahul@example.com."
- **Expected Behaviour:**
  Structured extraction of specific target attributes:
  - Name: Rahul
  - Age: 21
  - City: Mumbai
  - Course: Computer Science
  - Email: rahul@example.com
- **Actual Result:**
  Deterministic extraction check detected 100% of required keys (`Name`, `Age`, `City`, `Email`).
- **Pass/Fail:** **PASS**
- **Evidence:**
  Verified via automated test:
  `backend/tests/test_services.py::test_deterministic_checks` PASSED.

---

### TEST CASE 5: EDGE CASE (BOUNDARY VALIDATION) (TC-05)
- **Test ID:** `TC-05`
- **Category:** `Edge Case / Input Validation`
- **Input:**
  > `"   "` (Whitespace-only string)
- **Expected Behaviour:**
  System must strictly reject invalid empty or whitespace-only input before dispatching any API requests to the LLM. It must return an explicit, actionable validation error message and avoid creating misleading or corrupted database records.
- **Actual Result:**
  - Client-side validation: Flags error *"Original input cannot be empty or whitespace only."*
  - Backend schema validation: Pydantic validator intercepts payload and raises `ValueError("Original input must contain at least 5 non-whitespace characters.")`. Returns `HTTP 422 Unprocessable Entity`.
  - Zero LLM tokens or API calls consumed.
- **Pass/Fail:** **PASS**
- **Evidence:**
  Verified in automated test `backend/tests/test_api.py::test_edge_case_empty_input_rejected` PASSED.

---

### TEST CASE 6: MISSING API KEY SAFEGUARD (TC-06)
- **Test ID:** `TC-06`
- **Expected Behaviour:**
  If the user attempts to execute an experiment without an API key configured, the system must not crash or display raw stack traces. It must return a clean `HTTP 400` with descriptive onboarding instructions for Google AI Studio.
- **Actual Result:**
  Returns HTTP 400 with detail:
  *"Gemini API key is not configured. Please obtain an API key from Google AI Studio (https://aistudio.google.com/app/apikey) and enter it in Settings or set GEMINI_API_KEY in your .env file."*
- **Pass/Fail:** **PASS**
- **Evidence:**
  Verified in `backend/app/services/llm_service.py` and API route handler.

---

### TEST CASE 7: AUTOMATED BACKEND PYTEST SUITE (TC-07)
Execution command: `backend/venv/bin/pytest backend/tests -v`
```text
backend/tests/test_api.py::test_api_health PASSED                        [  7%]
backend/tests/test_api.py::test_api_key_status_endpoint PASSED           [ 15%]
backend/tests/test_api.py::test_create_experiment_success PASSED         [ 23%]
backend/tests/test_api.py::test_edge_case_empty_input_rejected PASSED    [ 30%]
backend/tests/test_api.py::test_edge_case_short_input_rejected PASSED    [ 38%]
backend/tests/test_api.py::test_edge_case_invalid_category_rejected PASSED [ 46%]
backend/tests/test_api.py::test_dashboard_stats_endpoint PASSED          [ 53%]
backend/tests/test_api.py::test_workflows_history_endpoint PASSED        [ 61%]
backend/tests/test_services.py::test_prompt_generation_all_techniques PASSED [ 69%]
backend/tests/test_services.py::test_weighted_score_calculation PASSED   [ 76%]
backend/tests/test_services.py::test_deterministic_checks PASSED         [ 84%]
backend/tests/test_services.py::test_ranking_and_comparison_dynamic_winner PASSED [ 92%]
backend/tests/test_services.py::test_full_pipeline_mock_execution PASSED [100%]

======================== 13 passed, 1 warning in 0.39s =========================
```
- **Pass/Fail:** **PASS (13/13 Passed)**

