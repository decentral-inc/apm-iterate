"""
GET  /interviews          — list all interviews with metadata + insights
GET  /interviews/:id      — full interview with transcript
GET  /engagement-data     — mock time-series engagement data
"""

from fastapi import APIRouter, HTTPException

from services.interview_service import get_all_interviews, get_interview

router = APIRouter()


@router.get("/interviews")
async def list_interviews():
    """Return all interview metadata with key insights."""
    interviews = get_all_interviews()
    return {"interviews": interviews, "count": len(interviews)}


@router.get("/interviews/{interview_id}")
async def interview_detail(interview_id: int):
    """Return full interview including transcript."""
    interview = get_interview(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail=f"Interview {interview_id} not found")
    return interview


@router.get("/engagement-data")
async def engagement_data():
    """Return mock time-series engagement data for visualizations."""
    import random
    random.seed(42)

    # Weekly engagement data for last 12 weeks
    weeks = []
    base_dau = 1800
    base_wau = 5200
    base_signups = 45
    base_churn = 12

    for i in range(12):
        week_num = i + 1
        noise = random.uniform(0.85, 1.15)
        growth = 1 + (i * 0.02)
        weeks.append({
            "week": f"W{week_num}",
            "week_label": f"Nov {5 + i * 7}" if i < 4 else (f"Dec {(i - 4) * 7 + 3}" if i < 8 else f"Jan {(i - 8) * 7 + 1}"),
            "dau": int(base_dau * noise * growth),
            "wau": int(base_wau * noise * growth),
            "signups": int(base_signups * noise * growth),
            "churn": int(base_churn * random.uniform(0.7, 1.3)),
            "nps": round(random.uniform(32, 48), 1),
        })

    # Funnel data
    funnel = [
        {"stage": "Landed on Site", "count": 15000, "rate": 100},
        {"stage": "Signed Up", "count": 3200, "rate": 21.3},
        {"stage": "Completed Onboarding", "count": 1800, "rate": 56.3},
        {"stage": "First Value Moment", "count": 950, "rate": 52.8},
        {"stage": "Activated (Day 7)", "count": 620, "rate": 65.3},
        {"stage": "Retained (Day 30)", "count": 380, "rate": 61.3},
        {"stage": "Paid Conversion", "count": 145, "rate": 38.2},
    ]

    # Feature adoption by segment
    feature_adoption = [
        {"feature": "Dashboard", "enterprise": 92, "mid_market": 78, "smb": 45, "free": 22},
        {"feature": "Reports", "enterprise": 85, "mid_market": 62, "smb": 30, "free": 8},
        {"feature": "Automations", "enterprise": 78, "mid_market": 45, "smb": 15, "free": 2},
        {"feature": "Integrations", "enterprise": 72, "mid_market": 55, "smb": 25, "free": 5},
        {"feature": "API", "enterprise": 68, "mid_market": 38, "smb": 10, "free": 1},
        {"feature": "Collaboration", "enterprise": 65, "mid_market": 42, "smb": 18, "free": 3},
    ]

    # User segments
    segments = [
        {"name": "Enterprise", "users": 45, "revenue": 54000, "dau_mau": 42, "health": 88},
        {"name": "Mid-Market", "users": 120, "revenue": 36000, "dau_mau": 35, "health": 72},
        {"name": "SMB", "users": 280, "revenue": 22400, "dau_mau": 18, "health": 55},
        {"name": "Free Tier", "users": 1500, "revenue": 0, "dau_mau": 8, "health": 30},
    ]

    return {
        "weekly_trends": weeks,
        "funnel": funnel,
        "feature_adoption": feature_adoption,
        "segments": segments,
    }
