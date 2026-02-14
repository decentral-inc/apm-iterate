"""
Mock data generator — 100 signed-up users + 200 not-engaged leads.
"""

import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from .models import User

COMPANIES = [
    ("Acme Corp", "SaaS"), ("Globex Inc", "FinTech"), ("Initech", "HealthTech"),
    ("Umbrella LLC", "E-commerce"), ("Stark AI", "AI/ML"), ("WayneTech", "DevTools"),
    ("OsCorp", "EdTech"), ("LexCorp", "SaaS"), ("Daily Dev", "DevTools"),
    ("Capsule AI", "AI/ML"),
]
DOMAINS = ["acme.com", "globex.io", "initech.co", "umbrella.dev", "stark.ai",
           "waynetech.com", "oscorp.io", "lexcorp.co", "daily.dev", "capsule.ai"]
SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"]
ROLES = ["Founder", "PM", "Marketing", "Engineering", "Sales", "CS", "Design"]
SOURCES = ["salesforce", "hubspot"]


def _random_dt(days_back: int = 90) -> datetime:
    return datetime.now(timezone.utc) - timedelta(seconds=random.randint(0, days_back * 86400))


async def seed_mock_data(db: AsyncSession) -> dict:
    """Insert 300 users. Idempotent — skips if users already exist."""
    count = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
    if count >= 300:
        return {"inserted": 0, "message": "Data already seeded"}

    users: list[User] = []

    # 100 signed-up users
    for i in range(1, 101):
        comp_name, industry = COMPANIES[i % len(COMPANIES)]
        users.append(User(
            email=f"user{i}@{DOMAINS[i % len(DOMAINS)]}",
            name=f"User {i}",
            company=comp_name,
            company_size=SIZES[i % len(SIZES)],
            role=ROLES[i % len(ROLES)],
            industry=industry,
            source=SOURCES[i % len(SOURCES)],
            status="signed_up",
            signed_up_at=_random_dt(90),
            last_active=_random_dt(7),
        ))

    # 200 not-engaged leads
    for i in range(1, 201):
        comp_name, industry = COMPANIES[i % len(COMPANIES)]
        users.append(User(
            email=f"lead{i}@{DOMAINS[i % len(DOMAINS)]}",
            name=f"Lead {i}",
            company=comp_name,
            company_size=SIZES[i % len(SIZES)],
            role=ROLES[i % len(ROLES)],
            industry=industry,
            source=SOURCES[i % len(SOURCES)],
            status="not_engaged",
            signed_up_at=None,
            last_active=None,
        ))

    db.add_all(users)
    await db.commit()
    return {"inserted": len(users), "message": "Seeded 300 mock CRM users"}
