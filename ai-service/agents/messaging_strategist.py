"""
Agent 3 — Messaging Strategist
Proposes messaging angles, value props, and content hooks.
"""

from utils.llm import call_llm, summarize_users

SYSTEM = """You are a senior product marketing strategist.
Based on ICP analysis and engagement data, craft targeted messaging.

Return JSON with EXACTLY these keys:
{
  "positioning_statement": "1-liner positioning",
  "value_propositions": [
    { "segment": "...", "headline": "...", "body": "...", "cta": "..." }
  ],
  "email_hooks": [
    { "subject_line": "...", "preview_text": "...", "target_segment": "..." }
  ],
  "growth_hypotheses": [
    { "hypothesis": "...", "expected_impact": "high|medium|low", "effort": "high|medium|low" }
  ],
  "messaging_do_nots": ["things to avoid in messaging"]
}
"""


def run(
    users: list[dict],
    stats: dict | None = None,
    icp_result: dict | None = None,
    engagement_result: dict | None = None,
    **_kw,
) -> dict:
    user_context = summarize_users(users)
    prompt = f"""Create a messaging strategy based on user data analysis.

USER DATA SUMMARY:
{user_context}

ICP ANALYSIS:
{icp_result if icp_result else 'Not available yet'}

ENGAGEMENT ANALYSIS:
{engagement_result if engagement_result else 'Not available yet'}

Return structured JSON as specified."""
    return call_llm(SYSTEM, prompt, temperature=0.6)
