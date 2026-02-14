"""
APM System — FastAPI entrypoint.
Single-service backend: API + multi-agent orchestration + SQLite.
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()  # noqa: E402 — must run before other imports reference env vars

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import init_db
from routes import crm_router, metrics_router, briefs_router, interviews_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables if they don't exist."""
    await init_db()
    yield


app = FastAPI(
    title="APM",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health():
    return {"status": "ok"}


# Mount routes
app.include_router(crm_router, prefix="/api", tags=["CRM"])
app.include_router(metrics_router, prefix="/api", tags=["Metrics"])
app.include_router(briefs_router, prefix="/api", tags=["Briefs"])
app.include_router(interviews_router, prefix="/api", tags=["Interviews"])


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
