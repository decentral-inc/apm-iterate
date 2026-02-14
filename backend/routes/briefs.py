"""
POST /generate-brief         — run multi-agent pipeline (batch).
POST /generate-brief-stream  — run pipeline with SSE streaming.
POST /feedback               — regenerate with user feedback.
GET  /brief                  — latest brief.
GET  /users                  — list all users.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from services.brief_service import (
    generate_brief,
    generate_brief_stream,
    regenerate_brief_with_feedback,
    get_latest_brief,
    get_users,
)

router = APIRouter()


class FeedbackRequest(BaseModel):
    brief_id: str
    feedback: str


def _brief_to_dict(b) -> dict:
    return {
        "id": b.id,
        "content": b.content,
        "summary": b.summary,
        "confidence_score": b.confidence_score,
        "agent_outputs": b.agent_outputs,
        "feedback": b.feedback,
        "parent_brief_id": b.parent_brief_id,
        "created_at": b.created_at.isoformat() if b.created_at else None,
    }


@router.post("/generate-brief")
async def generate(db: AsyncSession = Depends(get_db)):
    brief = await generate_brief(db)
    return _brief_to_dict(brief)


@router.post("/generate-brief-stream")
async def generate_stream(db: AsyncSession = Depends(get_db)):
    """SSE endpoint — streams agent progress events then final brief."""
    return StreamingResponse(
        generate_brief_stream(db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/feedback")
async def feedback(body: FeedbackRequest, db: AsyncSession = Depends(get_db)):
    try:
        brief = await regenerate_brief_with_feedback(db, body.brief_id, body.feedback)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return _brief_to_dict(brief)


@router.get("/brief")
async def latest_brief(db: AsyncSession = Depends(get_db)):
    brief = await get_latest_brief(db)
    if not brief:
        raise HTTPException(status_code=404, detail="No brief generated yet")
    return _brief_to_dict(brief)


@router.get("/users")
async def users_list(db: AsyncSession = Depends(get_db)):
    """Return all users for the user list component."""
    users = await get_users(db)
    return {"users": users, "count": len(users)}
