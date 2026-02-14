"""
Agent 1 — ICP Analyzer
Determines Ideal Customer Profile from the user dataset.
"""

from utils.llm import call_llm, summarize_users

SYSTEM = """You are an expert B2B go-to-market analyst.
Given a dataset summary of users (signed-up customers and non-engaged leads),
determine the Ideal Customer Profile (ICP).

Return JSON with EXACTLY these keys:
{
  "icp_summary": "1-2 sentence summary of the ICP",
  "primary_segment": {
    "company_size": "...",
    "role": "...",
    "industry": "..."
  },
  "secondary_segments": [ ... same shape ],
  "signals": ["list of buying signals observed"],
  "fit_score_distribution": {
    "high_fit": <int count>,
    "medium_fit": <int count>,
    "low_fit": <int count>
  }
}
"""


def run(users: list[dict], stats: dict | None = None, **_kw) -> dict:
    user_context = summarize_users(users)
    prompt = f"""Analyze the following user base and identify the Ideal Customer Profile.

USER DATA SUMMARY:
{user_context}

AGGREGATE STATS:
{stats if stats else 'N/A'}

Return structured JSON as specified."""
    return call_llm(SYSTEM, prompt)
