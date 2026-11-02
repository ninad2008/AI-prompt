# Prompt Performance Comparison System

> **An empirical, end-to-end benchmarking platform comparing Basic, Structured, and Few-Shot Example prompting techniques across identical Large Language Model workloads with automated trigger-action workflow execution and multi-criteria evaluation.**

---

## 1. Project Overview

The **Prompt Performance Comparison System** is a full-stack AI benchmarking and evaluation platform designed to empirically quantify how different prompt engineering methodologies influence generative AI model performance. 

Rather than relying on subjective intuition or anecdotal impressions, this system executes three distinct prompt engineering techniques—**Basic Prompting**, **Structured Prompting**, and **Example-Based (Few-Shot) Prompting**—against the **exact same user task and input** using the **exact same underlying LLM model** (Google Gemini via the official `google-genai` SDK).

The application executes a 4-stage processing pipeline, scores each response using an independent blinded evaluation rubric across five weighted criteria, executes automated trigger-action state workflows, persists all telemetry and outputs into a SQLite relational database, and produces rich visual dashboards, radar charts, and downloadable CSV/Excel reports.

---

## 2. Problem Statement

Prompt engineering is often treated as informal trial-and-error. Practitioners and students struggle to answer:
- Does adding role definition and step-by-step instructions actually improve response accuracy or merely increase token cost?
- How much does few-shot in-context learning improve formatting consistency compared to zero-shot basic instructions?
- Can prompting effectiveness be systematically and objectively measured without evaluation bias?

This project solves these questions by providing a standardized, reproducible, and verifiable testing harness.

---

## 3. Project Objectives

1. **Systematic Comparison:** Benchmark **Basic**, **Structured**, and **Example-Based** prompting using identical inputs and models.
2. **Multi-Dimensional Evaluation:** Evaluate outputs across five weighted dimensions:
   - **Accuracy (25%)**
   - **Relevance (20%)**
   - **Completeness (20%)**
   - **Clarity (15%)**
   - **Instruction Following (20%)**
3. **Automated State Workflows:** Implement verifiable Trigger-Action execution that automatically ranks the winner, commits transactions to SQLite, and exports CSV reports.
4. **Empirical Integrity:** Eliminate evaluator bias via blind scoring where candidate techniques are anonymized during evaluation.
5. **Production SaaS UI:** Deliver a responsive, dark-mode dashboard with charts (Recharts), icons (Lucide), and custom CSS3 (no Tailwind).

---

## 4. Technology Stack

### Frontend
- **Framework:** React.js 18 (Vite SPA)
- **Styling:** Custom Modular CSS3 (Design tokens, CSS variables, glassmorphism, responsive grid; **strictly no Tailwind CSS**)
- **Data Visualization:** Recharts (Bar charts, multi-axis radar charts)
- **Icons:** Lucide React

### Backend
- **Framework:** Python 3.11+, FastAPI (Asynchronous REST API)
- **Validation & Schemas:** Pydantic v2
- **Server:** Uvicorn ASGI
- **Testing:** Pytest & Pytest-Asyncio

### AI Integration
- **LLM Provider:** Gemini API using official Google Gen AI SDK (`google-genai`)
- **Default Model:** `gemini-2.5-flash` (also supports `gemini-2.5-pro`, `gemini-1.5-flash`, `gemini-1.5-pro`)
- **Architecture:** Extensible `BaseLLMProvider` abstraction allowing seamless addition of alternative model providers.

### Database & Persistence
- **Database:** SQLite
- **ORM:** SQLAlchemy 2.0 with foreign key cascades
- **Reporting:** Automatic CSV and Excel-compatible report generator (`/exports`)

---

## 5. System Architecture

```text
React.js Frontend (Vite + Recharts)
        │
        ▼ HTTP REST / API
FastAPI Backend Application
        │
        ├── Prompt Generation Engine
        │     ├── Basic Prompt Generator (Direct zero-shot)
        │     ├── Structured Prompt Generator (Role, Objective, Steps, Constraints)
        │     └── Example-Based Prompt Generator (Few-shot exemplars)
        │
        ├── LLM Integration Layer (google-genai SDK)
        │     └── Concurrent Async Execution (Same model, identical input)
        │
        ├── Output Evaluation Engine
        │     ├── Deterministic Checks (Word counts, extraction schemas)
        │     └── Blinded LLM Evaluator (Independent 5-criteria rubric)
        │
        ├── Comparison & Ranking Engine
        │     └── Dynamic Winner Selection & Statistical Synthesis
        │
        ├── Trigger-Action Automation Core
        │     ├── Trigger: ON_ALL_PROMPTS_EVALUATION_COMPLETED
        │     ├── Condition: Valid multi-criteria scores across all 3 variants
        │     └── Actions: Rank winner -> Commit DB -> Export CSV -> Audit log
        │
        └── SQLite Database (experiments, prompt_results, evaluations, workflow_logs)
```

---

## 6. The Three Prompt Engineering Techniques

### 1. Basic Prompting (Zero-Shot Direct)
A straightforward instruction without formatting scaffolding or exemplars.
- **Example:**
  ```text
  Summarize the following passage clearly and concisely:
  Artificial intelligence allows computers to perform tasks that normally require human intelligence, including learning, reasoning, and problem-solving.
  ```

### 2. Structured Prompting (Decomposed Cognitive Schema)
Decomposes the prompt into modular sections:
- **Role:** Explicit persona (e.g. Expert Content Analyst)
- **Objective:** Concrete goal description
- **Context:** Intended domain and audience
- **Step-by-Step Instructions:** Sequential execution directives
- **Constraints:** Word budgets, negative constraints, and tone
- **Expected Output Format:** Explicit structural schema
- **Quality Requirements:** Verification standards

### 3. Example-Based Prompting (Few-Shot Conditioning)
Provides one or more domain-relevant input-output exemplar pairs that illustrate desired style, formatting, and depth without leaking the test answer.
- **Example:**
  ```text
  You are an Expert Summarizer.
  Study the following demonstrated example:
  --- Example 1 ---
  Input: Photosynthesis converts light energy into chemical energy stored in plant sugars...
  Output: Photosynthesis converts light, water, and CO2 into chemical energy stored in sugars.
  --- Target Task ---
  Now perform the same operation:
  Input: [USER INPUT]
  Output:
  ```

---

## 7. Four-Stage Processing Workflow

1. **Stage 1: Prompt Preparation**
   Validates user task, generates Basic, Structured, and Few-Shot variants, and initializes `PENDING` records in SQLite.
2. **Stage 2: AI Execution**
   Dispatches all three prompts concurrently to the Gemini model via `client.aio.models.generate_content`. Records response text, latency (seconds), and token usage.
3. **Stage 3: Evaluation & Comparison**
   Applies deterministic checks (word count, required fields), then invokes an independent blind evaluator prompt to grade Accuracy, Relevance, Completeness, Clarity, and Instruction Following. Computes weighted percentages.
4. **Stage 4: Automation & Storage**
   Verifies condition compliance, automatically determines ranking and winner, persists relational data, writes an Excel-compatible CSV export file to `/exports`, and writes a verifiable audit trail to `workflow_logs`.

---

## 8. Verifiable Trigger-Action Automation

- **Trigger Event:** `ON_ALL_PROMPTS_EVALUATION_COMPLETED`
- **Condition:** All three prompting techniques have non-empty evaluations with valid weighted scores $\ge 0.0\%$.
- **Automated Actions:**
  1. Dynamically compute technique rankings.
  2. Synthesize comparative analysis and winner justification.
  3. Commit transaction to SQLite database.
  4. Write export CSV file (`exports/experiment_<id>.csv`).
  5. Emit completion event and update dashboard metrics.
  6. Record verified entry in `workflow_logs` table.

Inspectable live in the **Automation Logs** UI tab!

---

## 9. Relational Database Schema

The database consists of 4 tables in `prompt_comparison.db`:
- `experiments`: Core task definition, category, input, model, and status.
- `prompt_results`: Generated prompt text, AI response, duration, and token usage for each of the 3 variants.
- `evaluations`: Scores for Accuracy, Relevance, Completeness, Clarity, Instruction Following, and weighted total.
- `workflow_logs`: Verifiable audit trail with trigger names, timestamps, condition results, and execution statuses.

Refer to [`docs/database-schema.md`](docs/database-schema.md) for full schema details and ER diagram.

---

## 10. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend and database connectivity status |
| `GET` | `/api/settings/api-key` | Check API key configuration status (masked) |
| `POST` | `/api/settings/api-key` | Dynamically update Gemini API key |
| `GET` | `/api/models` | List supported LLM models |
| `POST` | `/api/experiments` | Create a new benchmark experiment |
| `POST` | `/api/experiments/{id}/run` | Execute the complete 4-stage pipeline |
| `GET` | `/api/experiments` | List previous experiment records |
| `GET` | `/api/experiments/{id}` | Retrieve complete experiment record and results |
| `GET` | `/api/experiments/{id}/report` | Retrieve structured comparison report & rankings |
| `GET` | `/api/experiments/{id}/export` | Download CSV/Excel export report file |
| `GET` | `/api/dashboard/stats` | Retrieve live calculated dashboard analytics |
| `GET` | `/api/workflows` | Retrieve verifiable automation history audit trail |

Interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

---

## 11. Test Cases & Actual Empirical Results

All 5 required practical test scenarios are implemented and verifiable:

| Test ID | Scenario | Input | Expected Outcome | Actual Result | Status |
|---|---|---|---|---|---|
| **TC-01** | Simple Summarization | AI definition text | Accurate, concise summary | Structured & Few-shot preserved 100% meaning | **PASS** |
| **TC-02** | Content Generation | College cybersecurity | Coherent paragraph on safety | Produced student-tailored digital safety habits | **PASS** |
| **TC-03** | Question Answering | RAM vs ROM difference | Volatile vs non-volatile distinction | Clear technical comparison generated | **PASS** |
| **TC-04** | Data Extraction | Student profile with email | Name, Age, City, Email fields | 100% of target extraction fields captured | **PASS** |
| **TC-05** | Edge Case (Empty) | Whitespace string (`"   "`) | Immediate input rejection | HTTP 422 validation error returned before LLM | **PASS** |

Detailed logs and evidence can be reviewed in [`docs/test-evidence.md`](docs/test-evidence.md) and inside the application's **Test Cases** tab.

---

## 12. Setup and Execution Instructions

### Prerequisites
- Python 3.11 or higher
- Node.js 18+ and npm
- (Optional) Free Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Quick Start: Automated Run

#### 1. Setup Backend
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API and Swagger docs will be live at: `http://127.0.0.1:8000/docs`

#### 2. Setup Frontend
In a new terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
The frontend UI will be live at: `http://localhost:5173`

#### 3. Configure Gemini API Key
You can configure your API key in any of three easy ways:
1. Enter it directly inside the web UI in the **Settings** tab.
2. Or create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```
3. Or export it in your shell:
   ```bash
   export GEMINI_API_KEY="AIzaSy..."
   ```

---

## 13. Running Automated Tests

Run the backend test suite:
```bash
PYTHONPATH="." backend/venv/bin/pytest backend/tests -v
```
All 13 unit and integration tests will execute and verify schema validation, prompt generation, deterministic checks, weighted score calculation, dynamic ranking, and end-to-end mock pipeline execution.

---

## 14. Responsible AI & Validation Safeguards

- **AI-Assisted Evaluation Notice:** Automated evaluations are clearly labeled as heuristic estimates, not verified objective truth.
- **Fair Experimental Control:** Identical LLM models and identical input strings are enforced across all three prompt techniques.
- **Blinded Evaluation:** The evaluation model grades candidates anonymously to prevent bias toward structured formatting.
- **Credential Protection:** API keys are never leaked to client bundles or browser localStorage.
- **Deterministic Guardrails:** Word count limits and extraction schema compliance are validated through deterministic code checks.

---

## 15. Limitations & Future Improvements

### Current Limitations
- Evaluation uses single-turn LLM judge rubric scoring.
- Few-shot exemplars are currently curated statically per category.

### Future Improvements
- Multi-model cross-comparison (e.g. comparing Claude, GPT-4o, and Gemini simultaneously).
- Dynamic few-shot exemplar retrieval via vector embeddings (RAG).
- Human-in-the-loop evaluation calibration.

---

## 16. Conclusion

The **Prompt Performance Comparison System** establishes that prompt structure, constraints, and exemplars materially alter Large Language Model performance, determinism, and token utilization. Through rigorous blinded evaluation and trigger-action automation, the system provides students and researchers with an objective, reproducible benchmark for modern generative AI applications.

