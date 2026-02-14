"""
Agent 4 — CriticAgent
Evaluates the composed brief, returns weaknesses, and assigns a confidence score.
Also handles the feedback-loop re-evaluation.
"""

from .base import BaseAgent


class CriticAgent(BaseAgent):
    name = "critic_agent"
    system_prompt = (
        "You are a ruthlessly honest strategy evaluator and editor.\n"
        "Given a composed 1-page meeting brief (and optionally prior feedback), "
        "evaluate its quality.\n\n"
        "Return JSON with EXACTLY these keys:\n"
        "{\n"
        '  "overall_assessment": "1-2 sentence summary",\n'
        '  "confidence_score": <float 0-1>,\n'
        '  "strengths": ["..."],\n'
        '  "weaknesses": ["..."],\n'
        '  "specific_suggestions": [\n'
        '    { "section": "...", "issue": "...", "suggestion": "..." }\n'
        "  ],\n"
        '  "revised_executive_summary": "improved summary if original is weak, else same"\n'
        "}"
    )

    def build_user_prompt(self, **ctx) -> str:
        parts = [
            "Evaluate the following 1-page meeting brief.\n",
            f"BRIEF:\n{ctx.get('brief', 'N/A')}\n",
        ]
        if ctx.get("feedback"):
            parts.append(
                f"\nUSER FEEDBACK ON PREVIOUS VERSION:\n{ctx['feedback']}\n"
                "Incorporate this feedback into your evaluation and suggestions.\n"
            )
        parts.append("\nReturn structured JSON as specified.")
        return "\n".join(parts)
