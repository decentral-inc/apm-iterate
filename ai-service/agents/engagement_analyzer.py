"""
Agent 2 — Engagement Analyzer
Detects engagement drop-offs, patterns, and conversion gaps.
"""

from utils.llm import call_llm, summarize_users

SYSTEM = """You are a product analytics expert specializing in user engagement.
Given user data, analyze engagement patterns between signed-up users and non-engaged leads.

Return JSON with EXACTLY these keys:
{
  "engagement_summary": "2-3 sentence overview",
  "conversion_rate": "<float percentage>",
  "drop_off_points": [
    { "stage": "...", "description": "...", "severity": "high|medium|low" }
  ],
  "engagement_patterns": [
    { "pattern": "...", "segment": "...", "insight": "..." }
  ],
  "at_risk_segments": ["segments likely to churn or never convert"],
  "recommended_actions": ["top 3 tactical recommendations"]
}
"""


def run(users: list[dict], stats: dict | None = None, **_kw) -> dict:
    user_context = summarize_users(users)
    prompt = f"""Analyze engagement patterns in this dataset.
Focus on the gap between signed-up users (100) and non-engaged leads (200).

USER DATA SUMMARY:
{user_context}

AGGREGATE STATS:
{stats if stats else 'N/A'}

Return structured JSON as specified."""
    return call_llm(SYSTEM, prompt)
