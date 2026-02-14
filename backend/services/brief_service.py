"""
Brief service — handles orchestration calls and DB persistence.
"""

from __future__ import annotations

import json
import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.models import User, Brief
from agents.orchestrator import orchestrate, orchestrate_stream
from services.interview_service import get_interview_context_for_agents

logger = logging.getLogger(__name__)


async def _load_users(db: AsyncSession) -> list[dict]:
    """Load all users as plain dicts for agent context."""
    result = await db.execute(select(User))
    rows = result.scalars().all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "company": u.company,
            "company_size": u.company_size,
            "role": u.role,
            "industry": u.industry,
            "source": u.source,
            "status": u.status,
        }
        for u in rows
    ]


async def _load_stats(db: AsyncSession) -> dict:
    """Compute aggregate stats from the DB."""
    from sqlalchemy import func

    total = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
    signed = (
        await db.execute(
            select(func.count()).select_from(User).where(User.status == "signed_up")
        )
    ).scalar() or 0
    not_engaged = (
        await db.execute(
            select(func.count()).select_from(User).where(User.status == "not_engaged")
        )
    ).scalar() or 0

    def _group_query(col):
        return select(col, func.count()).select_from(User).group_by(col)

    by_source = dict((await db.execute(_group_query(User.source))).all())
    by_size = dict((await db.execute(_group_query(User.company_size))).all())
    by_role = dict((await db.execute(_group_query(User.role))).all())
    by_industry = dict((await db.execute(_group_query(User.industry))).all())

    return {
        "total": total,
        "signed_up": signed,
        "not_engaged": not_engaged,
        "by_source": by_source,
        "by_company_size": by_size,
        "by_role": by_role,
        "by_industry": by_industry,
    }


async def generate_brief(db: AsyncSession) -> Brief:
    """Run the full multi-agent pipeline and persist the brief."""
    users = await _load_users(db)
    stats = await _load_stats(db)
    interview_context = get_interview_context_for_agents()

    result = await orchestrate(users=users, stats=stats, interview_context=interview_context)

    brief = Brief(
        content=result["brief"],
        summary=result["brief"].get("executive_summary", ""),
        confidence_score=result["confidence_score"],
        agent_outputs=result["agent_outputs"],
    )
    db.add(brief)
    await db.commit()
    await db.refresh(brief)
    return brief


async def generate_brief_stream(db: AsyncSession) -> AsyncGenerator[str, None]:
    """
    Stream SSE events during brief generation.
    Yields newline-delimited JSON events for each agent phase.
    Persists the final brief to DB.
    """
    users = await _load_users(db)
    stats = await _load_stats(db)
    interview_context = get_interview_context_for_agents()

    final_result = None

    async for event in orchestrate_stream(users=users, stats=stats, interview_context=interview_context):
        event_type = event.get("event", "info")

        if event_type == "complete":
            # Persist the brief
            final_result = event
            brief = Brief(
                content=event["brief"],
                summary=event["brief"].get("executive_summary", ""),
                confidence_score=event["confidence_score"],
                agent_outputs=event["agent_outputs"],
            )
            db.add(brief)
            await db.commit()
            await db.refresh(brief)

            # Send complete event with brief ID
            event["brief_id"] = brief.id
            event["created_at"] = brief.created_at.isoformat() if brief.created_at else None

        yield f"event: {event_type}\ndata: {json.dumps(event, default=str)}\n\n"


async def regenerate_brief_with_feedback(
    db: AsyncSession, brief_id: str, feedback: str
) -> Brief:
    """Re-run agents with user feedback and link to parent brief."""
    parent = (
        await db.execute(select(Brief).where(Brief.id == brief_id))
    ).scalar_one_or_none()
    if not parent:
        raise ValueError(f"Brief {brief_id} not found")

    users = await _load_users(db)
    stats = await _load_stats(db)

    result = await orchestrate(
        users=users,
        stats=stats,
        previous_brief=parent.content,
        feedback=feedback,
    )

    new_brief = Brief(
        content=result["brief"],
        summary=result["brief"].get("executive_summary", ""),
        confidence_score=result["confidence_score"],
        agent_outputs=result["agent_outputs"],
        feedback=feedback,
        parent_brief_id=brief_id,
    )
    db.add(new_brief)
    await db.commit()
    await db.refresh(new_brief)
    return new_brief


async def get_latest_brief(db: AsyncSession) -> Brief | None:
    result = await db.execute(select(Brief).order_by(Brief.created_at.desc()).limit(1))
    return result.scalar_one_or_none()


async def get_metrics(db: AsyncSession) -> dict:
    return await _load_stats(db)


async def get_users(db: AsyncSession) -> list[dict]:
    """Return all users for the user list component."""
    return await _load_users(db)
