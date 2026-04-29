# DataGuard AI

> **Autonomous data quality monitoring with AI-powered remediation.**
> Detects schema drift, generates Python fix scripts via Google Gemini, and executes them in a sandboxed environment — all in real time.

[![Live Demo](https://img.shields.io/badge/Live_Demo-data--quality--agent.vercel.app-6d5ff5?style=for-the-badge)](https://data-quality-agent.vercel.app)
[![API Docs](https://img.shields.io/badge/API_Docs-Swagger_UI-009688?style=for-the-badge)](https://dataguard-api.onrender.com/docs)

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=flat&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Tailwind](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-886FBF?style=flat&logo=googlegemini&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

---

## Try It Live

**Frontend:** [https://data-quality-agent.vercel.app](https://data-quality-agent.vercel.app)
**Backend API:** [https://dataguard-api.onrender.com/docs](https://dataguard-api.onrender.com/docs)

> **Note:** The backend runs on Render's free tier and sleeps after 15 minutes of inactivity. The first page load may take 30–60 seconds while the server wakes up. After that, everything is instant.

---

## What This Project Does

Enterprise data pipelines fail silently when schemas drift or data quality degrades — a column suddenly disappears, nulls spike out of nowhere, or values switch from numbers to strings. By the time anyone notices, downstream dashboards are broken and analysts are debugging stale reports.

**DataGuard AI is an autonomous agent that catches and fixes these issues before they break things.**

Here's the workflow:

1. **Register a data source** (any CSV URL — could be a S3 bucket, public dataset, internal API)
2. The agent **profiles the data** and stores a baseline schema snapshot
3. Every few minutes, a **background scheduler scans** all sources and compares current data against the baseline
4. When anomalies are detected, the agent calls **Google Gemini** to generate a custom Python remediation script
5. You can **review the AI-generated code** and click "Run" to execute it in an isolated sandbox
6. The dashboard shows **health scores, anomaly history, and execution logs** in real time

This is the same pattern used by enterprise tools like Monte Carlo and Great Expectations — except built from scratch with a custom scheduling engine and sandboxed Python executor instead of plugging into existing orchestration platforms.

---

## Key Features

### Schema Drift Detection
The agent detects six types of data anomalies by comparing baseline vs. current profiles:
- **Missing columns** — when expected columns disappear
- **New columns** — unexpected schema additions
- **Null spikes** — sudden increase in null values (>10 percentage points)
- **Dtype changes** — when numeric columns become strings, etc.
- **Cardinality collapse** — unique values dropping by more than 50%
- **Row count drops** — pipeline failures causing data loss

Each anomaly is automatically classified by severity (critical, high, medium, low).

### AI-Powered Remediation
For every detected anomaly, the system sends the schema context to Google Gemini and receives back:
- A safe, idempotent Python function (`def remediate(df) -> df`)
- A plain-English explanation of what the script does and why

Scripts are constrained to use only pandas and numpy — no file I/O, no network calls, no subprocess execution.

### Sandboxed Python Execution
AI-generated code runs in an isolated subprocess with:
- A restricted `__builtins__` dict (no `eval`, `exec`, `open`, `__import__`)
- A 10-second execution timeout
- Output capture and error reporting
- Process termination on timeout

### Background Monitoring
A custom APScheduler-based task runner periodically scans all registered sources without external dependencies like Celery or Airflow. Every scan triggers anomaly detection, AI script generation, and database persistence.

### Premium Dashboard
- **Command Center** — Health ring, source stats, recent activity feeds
- **Data Sources** — Registered feeds with health bars and one-click scanning
- **Anomalies** — Severity-coded list with expandable AI scripts
- **Script Runs** — Execution history with timing and output logs

---

## How to Use the Live Demo

### 1. Open the Dashboard
Visit [data-quality-agent.vercel.app](https://data-quality-agent.vercel.app). Wait 30 seconds on first load while the backend wakes up.

### 2. Register a Clean Data Source
- Click **Data Sources** → **+ Add Source**
- Try one of these public datasets:
  - **Titanic:** `https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv`
  - **Iris:** `https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv`
- Click **Register Source**, then **Scan Now**

The first scan stores the baseline. Health stays at 100%.

### 3. Simulate a Data Quality Issue
The system detects **changes** from baseline. To trigger anomalies:

1. Create a paste at [pastebin.com](https://pastebin.com) with clean CSV data
2. Register that URL as a source on the dashboard, then scan (stores baseline)
3. Edit the paste to introduce issues: drop a column, add nulls, change data types
4. Click **Scan Now** again — anomalies appear with AI-generated fix scripts

### 4. Run an AI Remediation
- Open the **Anomalies** page
- Expand any detected anomaly
- Read the AI-generated Python script and explanation
- Click **Run Remediation** — the sandbox executes the script and returns success/failure with output
- Check the **Script Runs** page for full execution history

---

## Architecture

```
┌─────────────────────┐       ┌──────────────────────┐       ┌───────────────┐
│   Next.js 14        │──────▶│   FastAPI            │──────▶│  PostgreSQL   │
│   (Vercel)          │       │   (Render — Docker)  │       │  (Neon)       │
└─────────────────────┘       └──────────────────────┘       └───────────────┘
                                        │
                              ┌─────────┼──────────┐
                              ▼         ▼          ▼
                        ┌──────────┐ ┌──────┐ ┌───────────────┐
                        │ Gemini   │ │Redis │ │ APScheduler + │
                        │ (LLM)    │ │ (Up- │ │ Multiprocess  │
                        │          │ │stash)│ │ Sandbox       │
                        └──────────┘ └──────┘ └───────────────┘
```

### Tech Stack

| Layer        | Technology                                       |
|--------------|--------------------------------------------------|
| Frontend     | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Backend      | FastAPI, SQLAlchemy 2, Pydantic v2, APScheduler  |
| Database     | PostgreSQL (Neon)                                |
| Cache/Queue  | Redis (Upstash)                                  |
| AI           | Google Gemini 2.0 Flash                          |
| Sandbox      | Python `multiprocessing` with restricted globals |
| Containerization | Docker                                       |
| Hosting      | Vercel (frontend) + Render (backend)             |

---

## Engineering Highlights

These are the parts of the project worth a deeper look:

**`backend/app/services/sandbox.py`** — Isolated Python execution engine. Spawns a subprocess with an allowlisted `__builtins__` dict, enforces a 10-second timeout, captures output and exceptions. No external sandbox library — built from scratch with `multiprocessing`.

**`backend/app/services/anomaly_detector.py`** — Schema diff engine. Compares baseline vs. current DataFrame profiles and classifies anomalies with severity logic.

**`backend/app/services/llm_agent.py`** — Gemini integration with a constrained system prompt that enforces output format (JSON with `code` + `explanation` keys) and safety rules (no I/O, no imports beyond pd/np).

**`backend/app/services/scheduler.py`** — Custom APScheduler integration that runs inside the FastAPI process. Handles scan orchestration, anomaly persistence, and AI script generation in one loop.

**`frontend/app/page.tsx`** — Dashboard with animated health ring (SVG stroke-dashoffset interpolation), staggered card animations, and severity-coded activity feeds.

---

## Project Structure

```
data-quality-agent/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + lifespan
│   │   ├── config.py            # Environment config (pydantic-settings)
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── models.py            # 4 tables: sources, anomalies, scripts, runs
│   │   ├── schemas.py           # Pydantic request/response models
│   │   ├── routers/
│   │   │   ├── dashboard.py     # Aggregate stats endpoint
│   │   │   ├── sources.py       # CRUD + manual scan trigger
│   │   │   ├── anomalies.py     # List with filtering
│   │   │   ├── scripts.py       # View + execute remediation
│   │   │   ├── runs.py          # Execution history
│   │   │   └── demo.py          # Seed sample anomalies for demo
│   │   └── services/
│   │       ├── profiler.py      # Fetch + profile DataFrames
│   │       ├── anomaly_detector.py
│   │       ├── llm_agent.py     # Gemini API integration
│   │       ├── sandbox.py       # Isolated Python execution
│   │       └── scheduler.py     # Background monitoring loop
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── layout.tsx           # Root layout + sidebar
│   │   ├── page.tsx             # Dashboard
│   │   ├── sources/page.tsx     # Source management
│   │   ├── anomalies/page.tsx   # Anomaly viewer + remediation runner
│   │   └── runs/page.tsx        # Execution logs
│   ├── components/
│   │   └── Sidebar.tsx          # Navigation
│   ├── lib/api.ts               # Typed API client
│   └── globals.css              # Tailwind + custom theme
├── docker-compose.yml           # Local dev with Postgres + Redis
└── README.md
```

---

## Running Locally

If you want to run the project on your own machine:

**Prerequisites:** Python 3.11+, Node.js 20+, a free Gemini API key, and a free Neon PostgreSQL connection string.

```bash
# Clone
git clone https://github.com/aishwaryasajjan77/data-quality-agent.git
cd data-quality-agent

# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in DATABASE_URL and GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000

# Frontend (in a new terminal)
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To populate the dashboard with sample anomalies for testing:
```bash
curl -X POST http://localhost:8000/api/demo/seed
```

---

## API Reference

Full interactive docs: [dataguard-api.onrender.com/docs](https://dataguard-api.onrender.com/docs)

| Method | Endpoint                          | Purpose                                  |
|--------|-----------------------------------|------------------------------------------|
| GET    | `/api/dashboard`                  | Aggregate stats + recent activity        |
| GET    | `/api/sources`                    | List all registered data sources         |
| POST   | `/api/sources`                    | Register a new data source               |
| POST   | `/api/sources/{id}/scan`          | Trigger manual scan                      |
| DELETE | `/api/sources/{id}`               | Remove a source                          |
| GET    | `/api/anomalies`                  | List detected anomalies (filterable)     |
| GET    | `/api/scripts`                    | List AI-generated remediation scripts    |
| POST   | `/api/scripts/{id}/run`           | Execute a remediation script in sandbox  |
| GET    | `/api/runs`                       | Execution history                        |

---

## Cost

Every component runs on a genuinely free tier — total cost is **$0/month**:

| Service          | Provider    | Free Tier                     |
|------------------|-------------|-------------------------------|
| Backend hosting  | Render.com  | 750 hours/month               |
| Frontend hosting | Vercel      | Unlimited hobby deploys       |
| Database         | Neon.tech   | 0.5 GB storage                |
| Redis            | Upstash     | 10k commands/day              |
| LLM              | Google AI   | 15 requests/minute (Flash)    |

---

## License

MIT