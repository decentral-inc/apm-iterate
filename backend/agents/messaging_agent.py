"""
Agent 3 — MessagingAgent
Proposes positioning, value props, and content hooks.
"""

from .base import BaseAgent


class MessagingAgent(BaseAgent):
    name = "messaging_agent"
    system_prompt = (
        "You are a senior product marketing strategist.\n"
        "Based on ICP analysis and engagement data, craft targeted messaging.\n\n"
        "Return JSON with EXACTLY these keys:\n"
        "{\n"
        '  "positioning_statement": "1-liner positioning",\n'
        '  "value_propositions": [\n'
        '    { "segment": "...", "headline": "...", "body": "...", "cta": "..." }\n'
        "  ],\n"
        '  "email_hooks": [\n'
        '    { "subject_line": "...", "preview_text": "...", "target_segment": "..." }\n'
        "  ],\n"
        '  "growth_hypotheses": [\n'
        '    { "hypothesis": "...", "expected_impact": "high|medium|low", "effort": "high|medium|low" }\n'
        "  ],\n"
        '  "messaging_do_nots": ["things to avoid in messaging"]\n'
        "}"
    )

    def build_user_prompt(self, **ctx) -> str:
        return (
            "Create a messaging strategy based on user data and prior agent analysis.\n\n"
            f"USER DATA SUMMARY:\n{ctx.get('user_summary', 'N/A')}\n\n"
            f"ICP ANALYSIS:\n{ctx.get('icp_result', 'Not available yet')}\n\n"
            f"SEGMENTATION ANALYSIS:\n{ctx.get('segmentation_result', 'Not available yet')}\n\n"
            "Return structured JSON as specified."
        )
