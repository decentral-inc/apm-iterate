"""
Agent 4 — Critic Agent
Evaluates the composed 1-pager, scores confidence, and proposes improvements.
"""

import json
from utils.llm import call_llm

SYSTEM = """You are a ruthless but constructive product strategy critic.
Evaluate a generated 1-page meeting brief and provide improvement suggestions.

Return JSON with EXACTLY these keys:
{
  "overall_score": <float 0-1>,
  "strengths": ["what's good"],
  "weaknesses": ["what needs improvement"],
  "specific_suggestions": [
    { "section": "...", "issue": "...", "suggestion": "..." }
  ],
  "missing_elements": ["anything that should be added"],
  "revised_executive_summary": "your improved version of the executive summary",
  "confidence_score": <float 0-1, your confidence in the brief's quality>
}
"""


def run(brief: dict, feedback: str | None = None, **_kw) -> dict:
    prompt = f"""Critically evaluate this 1-page meeting brief:

BRIEF:
{json.dumps(brief, indent=2)}

{"USER FEEDBACK TO INCORPORATE: " + feedback if feedback else "No previous user feedback."}

Be specific and actionable. Return structured JSON as specified."""
    return call_llm(SYSTEM, prompt, temperature=0.3)
