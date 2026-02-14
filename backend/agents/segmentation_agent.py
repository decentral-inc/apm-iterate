"""
Agent 2 — SegmentationAgent
Analyzes engagement distribution, drop-offs, and conversion gaps.
"""

from .base import BaseAgent


class SegmentationAgent(BaseAgent):
    name = "segmentation_agent"
    system_prompt = (
        "You are a product analytics expert specializing in user engagement.\n"
        "Given user data, analyze engagement patterns between signed-up users and "
        "non-engaged leads.\n\n"
        "Return JSON with EXACTLY these keys:\n"
        "{\n"
        '  "engagement_summary": "2-3 sentence overview",\n'
        '  "conversion_rate": "<float percentage>",\n'
        '  "drop_off_points": [\n'
        '    { "stage": "...", "description": "...", "severity": "high|medium|low" }\n'
        "  ],\n"
        '  "engagement_patterns": [\n'
        '    { "pattern": "...", "segment": "...", "insight": "..." }\n'
        "  ],\n"
        '  "at_risk_segments": ["segments likely to churn or never convert"],\n'
        '  "recommended_actions": ["top 3 tactical recommendations"]\n'
        "}"
    )

    def build_user_prompt(self, **ctx) -> str:
        return (
            "Analyze engagement patterns in this dataset.\n"
            "Focus on the gap between signed-up users (100) and non-engaged leads (200).\n\n"
            f"USER DATA SUMMARY:\n{ctx.get('user_summary', 'N/A')}\n\n"
            f"AGGREGATE STATS:\n{ctx.get('stats', 'N/A')}\n\n"
            "Return structured JSON as specified."
        )
