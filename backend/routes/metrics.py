"""
GET /metrics  — aggregate user stats.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from services.brief_service import get_metrics

router = APIRouter()


@router.get("/metrics")
async def metrics(db: AsyncSession = Depends(get_db)):
    return await get_metrics(db)
