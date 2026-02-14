# 🧠 AI Product Intelligence System

> Multi-agent AI system for product-led growth teams — generates meeting briefs, ICP analysis, engagement insights, and messaging strategies from CRM data.

---

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────────────────┐
│   React UI   │────▶│  Node/Express│────▶│   Flask AI Microservice          │
│  (Vite + TS) │◀────│   Backend    │◀────│                                  │
│  :5173       │     │   :4000      │     │  ┌────────┐  ┌────────────────┐  │
└──────────────┘     └──────┬───────┘     │  │  ICP   │  │  Engagement    │  │
                            │             │  │Analyzer│  │  Analyzer      │  │
                     ┌──────▼───────┐     │  └───┬────┘  └───────┬────── │  │
                     │  PostgreSQL  │     │      │  parallel      │       │  │
                     │    :5432     │     │      ▼               ▼       │  │
                     └──────────────┘     │  ┌──────────────────────┐    │  │
                                          │  │ Messaging Strategist │    │  │
                                          │  └──────────┬───────────┘    │  │
                                          │             ▼                │  │
                                          │  ┌──────────────────────┐    │  │
                                          │  │    Critic Agent      │    │  │
                                          │  │  (score + improve)   │    │  │
                                          │  └──────────────────────┘    │  │
                                          │          :5001               │  │
                                          └──────────────────────────────┘  │
```

### Agent Execution DAG

```
Phase 1 (parallel)  │  Phase 2 (sequential)  │  Phase 3      │  Phase 4
────────────────────┼────────────────────────┼───────────────┼──────────
 ICP Analyzer ──────┤                        │               │
                    ├──▶ Messaging Strategist ──▶ Compose ──▶ Critic
 Engagement    ─────┤                        │    Brief      │  Agent
 Analyzer           │                        │               │
```

**Each agent has a distinct reasoning responsibility:**

| Agent | Role | Input | Output |
|-------|------|-------|--------|
| ICP Analyzer | Identify ideal customer profile | User data | Segments, signals, fit scores |
| Engagement Analyzer | Find drop-offs & patterns | User data | Conversion gaps, at-risk segments |
| Messaging Strategist | Craft positioning & hooks | ICP + Engagement results | Value props, email hooks, hypotheses |
| Critic Agent | Evaluate & score the brief | Composed brief | Strengths, weaknesses, confidence |

---

## Folder Structure

```
apm-iterate/
├── docker-compose.yml
├── .gitignore
│
├── backend/                      # Node.js + Express API
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── .env.example
│   ├── sql/
│   │   ├── 001_schema.sql        # Tables: users, briefs
│   │   └── 002_seed.sql          # 100 signed-up + 200 leads
│   └── src/
│       ├── index.ts              # Express entrypoint
│       ├── db/
│       │   ├── pool.ts           # pg Pool singleton
│       │   └── init.ts           # Schema + seed runner
│       ├── routes/
│       │   ├── users.ts          # GET /users, /stats, POST /connect
│       │   └── briefs.ts         # POST /generate-brief, /feedback
│       └── services/
│           ├── userService.ts    # User queries + stats
│           └── briefService.ts   # Calls Flask, stores briefs
│
├── ai-service/                   # Flask multi-agent microservice
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   ├── app.py                    # Flask entrypoint (POST /analyze)
│   ├── orchestrator.py           # Parallel agent execution + aggregation
│   ├── agents/
│   │   ├── icp_analyzer.py       # Agent 1: ICP
│   │   ├── engagement_analyzer.py# Agent 2: Engagement
│   │   ├── messaging_strategist.py# Agent 3: Messaging
│   │   └── critic.py             # Agent 4: Critic
│   └── utils/
│       └── llm.py                # OpenAI wrapper + data summarizer
│
└── frontend/                     # Vite + React (TypeScript)
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── Dockerfile
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── api/
        │   └── client.ts         # Typed API client
        └── components/
            ├── ConnectScreen.tsx  # CRM connection landing
            ├── Dashboard.tsx      # 3-column layout shell
            ├── LeftPanel.tsx      # ICP + segmentation
            ├── MainPanel.tsx      # Metrics + generate + feedback
            └── RightPanel.tsx     # Brief + critic + confidence
```

---

## Quick Start (Local)

### Prerequisites
- Node.js 20+
- Python 3.12+
- PostgreSQL 16+
- OpenAI API key

### 1. Database

```bash
createdb apm_intel
psql apm_intel < backend/sql/001_schema.sql
psql apm_intel < backend/sql/002_seed.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # edit DATABASE_URL, AI_SERVICE_URL
npm install
npm run dev                   # → http://localhost:4000
```

### 3. AI Service

```bash
cd ai-service
cp .env.example .env          # add OPENAI_API_KEY
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py                 # → http://localhost:5001
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev                   # → http://localhost:5173
```

### Docker (all-in-one)

```bash
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
# Add your OPENAI_API_KEY to ai-service/.env
docker-compose up --build
```

---

## API Endpoints

### `POST /api/connect/:source`
Mock CRM connection. Seeds the database.

```bash
curl -X POST http://localhost:4000/api/connect/salesforce
```

**Response:**
```json
{
  "message": "Connected to salesforce (mock)",
  "stats": {
    "total": 300,
    "signed_up": 100,
    "not_engaged": 200,
    "by_source": { "salesforce": 117, "hubspot": 183 },
    "by_company_size": { "1-10": 60, "11-50": 60, "51-200": 60, "201-500": 60, "500+": 60 },
    "by_role": { "Founder": 42, "PM": 43, "Marketing": 43, "Engineering": 43, "Sales": 43, "CS": 43, "Design": 43 },
    "by_industry": { "SaaS": 42, "FinTech": 43, "HealthTech": 43, "E-commerce": 43, "DevTools": 43, "EdTech": 43, "AI/ML": 43 }
  }
}
```

### `GET /api/users?status=signed_up`

```json
{
  "users": [
    {
      "id": "a1b2c3d4-...",
      "email": "user1@acme.com",
      "name": "User 1",
      "company": "Acme Corp",
      "company_size": "11-50",
      "role": "PM",
      "industry": "FinTech",
      "source": "hubspot",
      "status": "signed_up",
      "signed_up_at": "2026-01-15T...",
      "last_active": "2026-02-12T..."
    }
  ],
  "count": 100
}
```

### `GET /api/stats`

Returns the aggregate stats object shown above.

### `POST /api/generate-brief`

Triggers full multi-agent pipeline and returns the brief.

**Response:**
```json
{
  "id": "uuid",
  "content": {
    "executive_summary": "Your ICP is mid-market SaaS PMs...",
    "icp": {
      "primary_segment": { "company_size": "51-200", "role": "PM", "industry": "SaaS" },
      "secondary_segments": [],
      "signals": ["High engagement from DevTools vertical"]
    },
    "engagement": {
      "conversion_rate": "33.3%",
      "drop_off_points": [
        { "stage": "Form → Activation", "description": "...", "severity": "high" }
      ],
      "at_risk_segments": ["1-10 company size", "Design role"]
    },
    "messaging": {
      "value_propositions": [
        { "segment": "PM at mid-market SaaS", "headline": "...", "body": "...", "cta": "..." }
      ],
      "email_hooks": [
        { "subject_line": "...", "preview_text": "...", "target_segment": "..." }
      ],
      "growth_hypotheses": [
        { "hypothesis": "...", "expected_impact": "high", "effort": "medium" }
      ]
    },
    "recommended_actions": ["...", "...", "..."]
  },
  "confidence_score": 0.78,
  "agent_outputs": {
    "icp_analyzer": {},
    "engagement_analyzer": {},
    "messaging_strategist": {},
    "critic": {
      "overall_score": 0.78,
      "strengths": ["..."],
      "weaknesses": ["..."],
      "specific_suggestions": [{ "section": "...", "issue": "...", "suggestion": "..." }],
      "confidence_score": 0.78
    }
  },
  "feedback": null,
  "parent_brief_id": null,
  "created_at": "2026-02-14T..."
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

## Flask AI Service — `/analyze` Payload

**Request:**
```json
{
  "users": [],
  "stats": {},
  "previous_brief": {},
  "feedback": "optional feedback string"
}
```

**Response:**
```json
{
  "brief": {
    "executive_summary": "...",
    "icp": {},
    "engagement": {},
    "messaging": {},
    "recommended_actions": []
  },
  "confidence_score": 0.78,
  "agent_outputs": {
    "icp_analyzer": {},
    "engagement_analyzer": {},
    "messaging_strategist": {},
    "critic": {}
  },
  "timing": {
    "icp_analyzer": 2.34,
    "engagement_analyzer": 2.51,
    "messaging_strategist": 3.12,
    "critic": 2.87
  }
}
```

---

## Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | backend | Postgres connection string |
| `AI_SERVICE_URL` | backend | Flask service URL |
| `PORT` | backend | Express port (default: 4000) |
| `OPENAI_API_KEY` | ai-service | OpenAI API key |
| `OPENAI_MODEL` | ai-service | Model name (default: gpt-4o-mini) |
| `AI_SERVICE_PORT` | ai-service | Flask port (default: 5001) |

---

## Design Decisions

- **Multi-agent over single prompt**: Each agent has a focused system prompt and structured JSON output. Phase 1 runs ICP + Engagement in parallel via `ThreadPoolExecutor`. The Messaging Strategist depends on Phase 1 outputs, and the Critic agent evaluates the aggregated brief — a genuine 4-stage pipeline, not a single LLM call.
- **Feedback loop**: Users can iterate on briefs. The Critic agent receives prior output + user feedback and regenerates improved content. Brief lineage is tracked via `parent_brief_id`.
- **Mock CRM**: `POST /connect/:source` seeds the DB with deterministic fake users so the demo works without any external integrations.
- **Separation of concerns**: Flask handles AI orchestration only; Node handles web API, persistence, and data prep. Frontend knows nothing about agents.

---

## License

MIT
