"""
POST /mock-crm  — seed the database with mock CRM data.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db, seed_mock_data
from services.brief_service import get_metrics

router = APIRouter()


@router.post("/mock-crm")
async def mock_connect_crm(db: AsyncSession = Depends(get_db)):
    """Simulate connecting a CRM — populates 300 mock users."""
    seed_result = await seed_mock_data(db)
    stats = await get_metrics(db)
    return {"message": "CRM connected (mock)", **seed_result, "stats": stats}
