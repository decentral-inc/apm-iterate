# 🧠 AI Product Intelligence System

> Multi-agent AI system for product-led growth teams. Single-service Python backend (FastAPI + SQLite) with a React frontend. No Docker required.

---

## Architecture

```
┌──────────────┐         ┌───────────────────────────────────────────┐
│   React UI   │────────▶│         FastAPI (single service)          │
│  (Vite + TS) │◀────────│                                           │
│  :5173       │         │  Routes ──▶ Services ──▶ Agent Orchestrator│
└──────────────┘         │                            │               │
                         │            ┌───────────────┼───────────┐   │
                         │            │  asyncio.gather()         │   │
                         │            │                           │   │
                         │  ┌─────────────┐   ┌──────────────┐   │   │
                         │  │  ICP Agent   │   │ Segmentation │   │   │
                         │  │             │   │    Agent      │   │   │
                         │  └──────┬──────┘   └──────┬───────┘   │   │
                         │         │  Phase 1         │           │   │
                         │         └────────┬─────────┘           │   │
                         │                  ▼                     │   │
                         │         ┌────────────────┐             │   │
                         │         │ Messaging Agent │ Phase 2    │   │
                         │         └────────┬───────┘             │   │
                         │                  ▼                     │   │
                         │         ┌────────────────┐             │   │
                         │         │  Critic Agent   │ Phase 3    │   │
                         │         │  (score + fix)  │            │   │
                         │         └────────────────┘             │   │
                         │                                        │   │
                         │  ┌──────────┐                          │   │
                         │  │  SQLite   │  (SQLAlchemy async ORM) │   │
                         │  └──────────┘                          │   │
                         │         :8000                          │   │
                         └───────────────────────────────────────────┘
```

### Agent Execution DAG

```
Phase 1 (parallel)   │  Phase 2            │  Phase 3         │  Phase 4
─────────────────────┼─────────────────────┼──────────────────┼──────────
  ICP Agent ─────────┤                     │                  │
                     ├──▶ Messaging Agent  ──▶ Compose Brief ──▶ Critic
  Segmentation  ─────┤                     │                  │  Agent
  Agent              │                     │                  │
```

**Each agent is a separate Python class with a distinct responsibility:**

| Agent | Class | Responsibility | Output |
|-------|-------|---------------|--------|
| ICP Agent | `ICPAgent` | Infer ideal customer profile | Segments, signals, fit scores |
| Segmentation Agent | `SegmentationAgent` | Analyze engagement distribution | Conversion gaps, patterns, at-risk |
| Messaging Agent | `MessagingAgent` | Propose positioning & hooks | Value props, email hooks, hypotheses |
| Critic Agent | `CriticAgent` | Evaluate brief, assign confidence | Strengths, weaknesses, score |

---

## Folder Structure

```
apm-iterate/
├── .gitignore
├── README.md
│
├── backend/                         # FastAPI single service
│   ├── main.py                      # Entrypoint — uvicorn
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py              # Async SQLite engine + session
│   │   ├── models.py                # User & Brief ORM models
│   │   └── seed.py                  # Mock data generator (300 users)
│   │
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base.py                  # BaseAgent abstract class
│   │   ├── icp_agent.py             # Agent 1: ICP
│   │   ├── segmentation_agent.py    # Agent 2: Segmentation
│   │   ├── messaging_agent.py       # Agent 3: Messaging
│   │   ├── critic_agent.py          # Agent 4: Critic
│   │   └── orchestrator.py          # asyncio.gather() pipeline
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   └── brief_service.py         # Business logic layer
│   │
│   └── routes/
│       ├── __init__.py
│       ├── crm.py                   # POST /mock-crm
│       ├── metrics.py               # GET /metrics
│       └── briefs.py                # POST /generate-brief, /feedback
│
└── frontend/                        # Vite + React (TypeScript)
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── vite-env.d.ts
        ├── api/
        │   └── client.ts            # Typed API client
        └── components/
            ├── ConnectScreen.tsx     # Mock CRM connect landing
            ├── Dashboard.tsx         # 3-column layout shell
            ├── LeftPanel.tsx         # ICP + segmentation insights
            ├── MainPanel.tsx         # Metrics + generate + feedback
            └── RightPanel.tsx        # Brief + critic + confidence
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ (for frontend)
- OpenAI API key

### 1. Backend

```bash
cd backend
cp .env.example .env            # add your OPENAI_API_KEY
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python main.py                  # → http://localhost:8000
```

SQLite database is created automatically on first startup. No manual DB setup needed.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                     # → http://localhost:5173
```

The Vite dev server proxies `/api` requests to `localhost:8000`.

---

## API Endpoints

### `POST /api/mock-crm`
Seeds the database with 100 signed-up users + 200 non-engaged leads.

```bash
curl -X POST http://localhost:8000/api/mock-crm
```

**Response:**
```json
{
  "message": "CRM connected (mock)",
  "inserted": 300,
  "stats": {
    "total": 300,
    "signed_up": 100,
    "not_engaged": 200,
    "by_source": { "salesforce": 150, "hubspot": 150 },
    "by_company_size": { "1-10": 60, "11-50": 60, "51-200": 60, "201-500": 60, "500+": 60 },
    "by_role": { "Founder": 42, "PM": 43, "Marketing": 43, "Engineering": 43, "Sales": 43, "CS": 43, "Design": 43 },
    "by_industry": { "SaaS": 60, "FinTech": 60, "HealthTech": 60, "E-commerce": 30, "AI/ML": 60, "DevTools": 30, "EdTech": 0 }
  }
}
```

### `GET /api/metrics`
Returns the aggregate stats object.

### `POST /api/generate-brief`
Triggers the full 4-agent pipeline.

**Response:**
```json
{
  "id": "uuid",
  "content": {
    "executive_summary": "Your ICP is mid-market SaaS PMs…",
    "icp": {
      "primary_segment": { "company_size": "51-200", "role": "PM", "industry": "SaaS" },
      "secondary_segments": [],
      "signals": ["High engagement from DevTools vertical"]
    },
    "segmentation": {
      "conversion_rate": "33.3%",
      "drop_off_points": [
        { "stage": "Form → Activation", "description": "…", "severity": "high" }
      ],
      "at_risk_segments": ["1-10 company size", "Design role"]
    },
    "messaging": {
      "value_propositions": [
        { "segment": "PM at mid-market SaaS", "headline": "…", "body": "…", "cta": "…" }
      ],
      "email_hooks": [
        { "subject_line": "…", "preview_text": "…", "target_segment": "…" }
      ],
      "growth_hypotheses": [
        { "hypothesis": "…", "expected_impact": "high", "effort": "medium" }
      ]
    },
    "recommended_actions": ["…", "…", "…"]
  },
  "confidence_score": 0.78,
  "agent_outputs": {
    "icp_agent": { "…" },
    "segmentation_agent": { "…" },
    "messaging_agent": { "…" },
    "critic_agent": {
      "confidence_score": 0.78,
      "strengths": ["…"],
      "weaknesses": ["…"],
      "specific_suggestions": [{ "section": "…", "issue": "…", "suggestion": "…" }]
    }
  },
  "feedback": null,
  "parent_brief_id": null,
  "created_at": "2026-02-14T…"
}
```

### `POST /api/feedback`

**Request:**
```json
{
  "brief_id": "uuid-of-previous-brief",
  "feedback": "Focus more on the enterprise segment; add competitive positioning."
}
```

**Response:** Same shape as `generate-brief`, with `parent_brief_id` set and feedback incorporated.

---

## Multi-Agent Orchestration

The orchestrator in `backend/agents/orchestrator.py` runs a 4-phase pipeline:

```python
# Phase 1 — parallel via asyncio.gather()
icp_result, seg_result = await asyncio.gather(
    ICPAgent().run(user_summary=..., stats=...),
    SegmentationAgent().run(user_summary=..., stats=...),
)

# Phase 2 — Messaging (needs Phase 1 outputs)
msg_result = await MessagingAgent().run(
    icp_result=..., segmentation_result=...,
)

# Phase 3 — Compose 1-pager from all outputs
brief = compose_brief(icp, segmentation, messaging)

# Phase 4 — Critic reviews final brief
critic_result = await CriticAgent().run(brief=..., feedback=...)
```

Each agent:
- Is a **separate class** inheriting from `BaseAgent`
- Has its own **system prompt** and **structured JSON output schema**
- Operates via **async OpenAI calls**
- Returns timing metadata for observability

The `CriticAgent` is also invoked during the feedback loop: user feedback is passed in, and the system regenerates an improved brief with lineage tracked via `parent_brief_id`.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_MODEL` | Model name (default: `gpt-4o-mini`) |
| `DATABASE_URL` | SQLAlchemy URL (default: `sqlite+aiosqlite:///./apm_intel.db`) |

---

## Design Decisions

- **Single service**: FastAPI handles everything — API, agent orchestration, DB. No Docker, no microservices. Ship fast.
- **True multi-agent**: 4 distinct agent classes, not a single LLM call. Phase 1 runs ICP + Segmentation in parallel via `asyncio.gather()`. Messaging depends on Phase 1. Critic evaluates the final composed brief.
- **Feedback loop**: Users iterate on briefs. Critic processes feedback + previous output. Lineage tracked via `parent_brief_id`.
- **Async all the way**: `aiosqlite` for DB, `AsyncOpenAI` for LLM calls, FastAPI async routes. No blocking.
- **Zero setup DB**: SQLite auto-creates on startup. `POST /mock-crm` seeds data. No Postgres/Docker needed.

---

## License

MIT
