"""
Agent 2 — SegmentationAgent
Analyzes engagement distribution, drop-offs, and conversion gaps.
Produces structured, actionable recommended actions.
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
        '  "recommended_actions": [\n'
        '    {\n'
        '      "action": "short description of what to do",\n'
        '      "type": "send_email|schedule_zoom|schedule_meeting|crm_update|create_campaign|send_slack",\n'
        '      "target_segment": "who this targets",\n'
        '      "priority": "high|medium|low",\n'
        '      "details": "more context on implementation"\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        "IMPORTANT: recommended_actions must have 4-6 items. Use these types:\n"
        '- "send_email": outreach email campaigns\n'
        '- "schedule_zoom": video call / product demo\n'
        '- "schedule_meeting": in-person or calendar meeting\n'
        '- "crm_update": update CRM records or tags\n'
        '- "create_campaign": launch a marketing campaign\n'
        '- "send_slack": internal Slack notification\n'
        "Make them specific and implementable, not generic advice."
    )

    def build_user_prompt(self, **ctx) -> str:
        return (
            "Analyze engagement patterns in this dataset.\n"
            "Focus on the gap between signed-up users (100) and non-engaged leads (200).\n\n"
            f"USER DATA SUMMARY:\n{ctx.get('user_summary', 'N/A')}\n\n"
            f"AGGREGATE STATS:\n{ctx.get('stats', 'N/A')}\n\n"
            "Produce specific, implementable recommended actions with action types.\n"
            "Return structured JSON as specified."
        )
