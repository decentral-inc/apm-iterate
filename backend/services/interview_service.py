"""
Interview service — loads transcripts from assets/, extracts insights,
and provides them as context for the agent pipeline.
"""

from __future__ import annotations

import os
import re
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"

# ── Interview metadata (matches transcript files) ──
INTERVIEWS = [
    {
        "id": 1,
        "title": "Lucia AI Founder interviews a potential client",
        "participant": "Todd Boonyayoi",
        "role": "Product Manager (Line)",
        "company_type": "FinTech",
        "date": "2026-01-15",
        "duration": "6 min",
        "video_id": "lvf_GOBXV6Q",
        "focus": "Finding a customer",
    },
    {
        "id": 2,
        "title": "SaaS Analytics Dashboard Setup",
        "participant": "Jordan Lee",
        "role": "Marketing Manager",
        "company_type": "FinTech (Mid-size)",
        "date": "2026-01-18",
        "duration": "20 min",
        "video_id": "ZUiTlkn0kQk",
        "focus": "First-run experience setting up analytics dashboard",
    },
    {
        "id": 3,
        "title": "Enterprise CRM Migration",
        "participant": "Maria Santos",
        "role": "VP of Sales",
        "company_type": "HealthTech (Enterprise)",
        "date": "2026-01-22",
        "duration": "30 min",
        "video_id": "yUwsAHRM7bE",
        "focus": "Migration from HubSpot — data fidelity & timeline",
    },
    {
        "id": 4,
        "title": "Mobile App Experience",
        "participant": "Sam Patel",
        "role": "Senior Product Manager",
        "company_type": "EdTech (200 employees)",
        "date": "2026-01-25",
        "duration": "20 min",
        "video_id": "QRZ_l7cVzzU",
        "focus": "Mobile usability for on-the-go product insights",
    },
    {
        "id": 5,
        "title": "API Integration & Dev Experience",
        "participant": "Dev Krishnan",
        "role": "Senior Software Engineer",
        "company_type": "DevTools Startup",
        "date": "2026-01-28",
        "duration": "25 min",
        "video_id": "6lVQz9Ak3Lk",
        "focus": "API setup, webhooks, SDK, and rate limits",
    },
    {
        "id": 6,
        "title": "Customer Health Scoring",
        "participant": "Priya Sharma",
        "role": "CS Team Lead",
        "company_type": "E-commerce SaaS",
        "date": "2026-02-01",
        "duration": "20 min",
        "video_id": "Iy1rumvo9xc",
        "focus": "Customer health monitoring and churn prevention",
    },
    {
        "id": 7,
        "title": "Engagement Data & Cohort Analysis",
        "participant": "Chris Morgan",
        "role": "Growth Lead",
        "company_type": "SaaS (80 employees)",
        "date": "2026-02-04",
        "duration": "22 min",
        "video_id": "36sNPyBAik4",
        "focus": "Analytics, cohort analysis, and segmentation insights",
    },
    {
        "id": 8,
        "title": "Team Collaboration & Sharing",
        "participant": "Taylor Kim",
        "role": "Design Lead",
        "company_type": "AI/ML Startup",
        "date": "2026-02-07",
        "duration": "18 min",
        "video_id": "MW-TgcOE0lk",
        "focus": "Sharing insights with cross-functional teams",
    },
    {
        "id": 9,
        "title": "Billing & Plan Upgrade",
        "participant": "Pat O'Brien",
        "role": "Founder/CEO",
        "company_type": "B2B SaaS Startup (5 people)",
        "date": "2026-02-10",
        "duration": "18 min",
        "video_id": "Ovj4hFxko7c",
        "focus": "Free-to-paid upgrade experience and pricing clarity",
    },
    {
        "id": 10,
        "title": "Workflow Automation Setup",
        "participant": "Jamie Reyes",
        "role": "Sales Operations Manager",
        "company_type": "Mid-Market SaaS (100 employees)",
        "date": "2026-02-12",
        "duration": "22 min",
        "video_id": "oJbfyz4caiQ",
        "focus": "Automated workflows and notification setup",
    },
]


def _load_transcript(transcript_id: int) -> str | None:
    """Load a transcript file from assets/."""
    path = ASSETS_DIR / f"transcript{transcript_id}.txt"
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8")


def _extract_key_insights(text: str) -> list[dict]:
    """Pull out Friction Points and Bottom Line Impact from transcript text."""
    insights: list[dict] = []

    # Extract friction points
    for m in re.finditer(
        r"Friction Point \d+ \(([^)]+)\):\s*(.+?)(?:Action:\s*(.+))?$",
        text,
        re.MULTILINE,
    ):
        insights.append({
            "type": "friction",
            "area": m.group(1).strip(),
            "description": m.group(2).strip().rstrip("."),
            "action": m.group(3).strip().rstrip(".") if m.group(3) else None,
        })

    # Extract bottom line impact
    blm = re.search(r"Bottom Line Impact:\s*(.+?)$", text, re.MULTILINE)
    if blm:
        insights.append({
            "type": "bottom_line",
            "area": "Revenue Impact",
            "description": blm.group(1).strip(),
            "action": None,
        })

    return insights


def _extract_pm_questions(text: str) -> list[dict]:
    """Extract PM questions and user answers that reveal bottom-line impact."""
    questions: list[dict] = []
    # Pattern: PM asks a question, user responds — look for PM lines followed by participant lines
    lines = text.split("\n")
    for i, line in enumerate(lines):
        if "] PM:" in line and "?" in line:
            q_text = re.sub(r"^\[[\d:]+\]\s*PM:\s*", "", line).strip()
            # Find the next participant response
            answer = ""
            for j in range(i + 1, min(i + 4, len(lines))):
                if lines[j].strip() and "] PM:" not in lines[j]:
                    answer = re.sub(r"^\[[\d:]+\]\s*\w+:\s*", "", lines[j]).strip()
                    break
            if q_text and answer:
                questions.append({"question": q_text, "answer": answer})

    return questions


def get_all_interviews() -> list[dict]:
    """Return all interview metadata with key insights."""
    result = []
    for meta in INTERVIEWS:
        transcript = _load_transcript(meta["id"])
        insights = _extract_key_insights(transcript) if transcript else []
        pm_questions = _extract_pm_questions(transcript) if transcript else []
        result.append({
            **meta,
            "has_transcript": transcript is not None,
            "key_insights": insights,
            "pm_questions": pm_questions[:5],  # Top 5 PM questions
            "transcript_preview": (transcript[:300] + "...") if transcript else None,
        })
    return result


def get_interview(interview_id: int) -> dict | None:
    """Return full interview details including complete transcript."""
    meta = next((m for m in INTERVIEWS if m["id"] == interview_id), None)
    if not meta:
        return None
    transcript = _load_transcript(interview_id)
    insights = _extract_key_insights(transcript) if transcript else []
    pm_questions = _extract_pm_questions(transcript) if transcript else []
    return {
        **meta,
        "has_transcript": transcript is not None,
        "transcript": transcript,
        "key_insights": insights,
        "pm_questions": pm_questions,
    }


def get_interview_context_for_agents(active_ids: list[int] | None = None) -> str:
    """
    Build a combined context string from selected interview transcripts
    for injection into agent prompts.
    """
    if active_ids is None:
        active_ids = [m["id"] for m in INTERVIEWS]

    sections: list[str] = []
    all_friction: list[str] = []
    all_impact: list[str] = []

    for iid in active_ids:
        meta = next((m for m in INTERVIEWS if m["id"] == iid), None)
        if not meta:
            continue
        transcript = _load_transcript(iid)
        if not transcript:
            continue

        insights = _extract_key_insights(transcript)
        friction_points = [i for i in insights if i["type"] == "friction"]
        impact_points = [i for i in insights if i["type"] == "bottom_line"]

        section = f"Interview {iid}: {meta['title']} — {meta['participant']} ({meta['role']})\n"
        for fp in friction_points:
            desc = f"  - [{fp['area']}] {fp['description']}"
            if fp["action"]:
                desc += f" → Action: {fp['action']}"
            section += desc + "\n"
            all_friction.append(f"{fp['area']}: {fp['description']}")
        for ip in impact_points:
            section += f"  - [Revenue] {ip['description']}\n"
            all_impact.append(ip["description"])

        sections.append(section)

    if not sections:
        return "No interview data available."

    summary = "USER INTERVIEW INSIGHTS\n"
    summary += "=" * 40 + "\n"
    summary += f"Total Interviews Analyzed: {len(sections)}\n\n"
    summary += "\n".join(sections)
    summary += "\n\nAGGREGATE FRICTION THEMES:\n"
    summary += "\n".join(f"  • {f}" for f in all_friction)
    summary += "\n\nREVENUE IMPACT SIGNALS:\n"
    summary += "\n".join(f"  • {i}" for i in all_impact)

    return summary
