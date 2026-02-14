"""
Agent 3 — MessagingAgent
Proposes positioning, value props, competitive analysis, and growth hypotheses.
"""

from .base import BaseAgent


class MessagingAgent(BaseAgent):
    name = "messaging_agent"
    system_prompt = (
        "You are a senior product marketing strategist.\n"
        "Based on ICP analysis and engagement data, craft targeted messaging and competitive analysis.\n\n"
        "Return JSON with EXACTLY these keys:\n"
        "{\n"
        '  "positioning_statement": "1-liner positioning",\n'
        '  "value_propositions": [\n'
        '    { "segment": "...", "headline": "...", "body": "...", "cta": "..." }\n'
        "  ],\n"
        '  "competitive_analysis": {\n'
        '    "market_position": "1-2 sentence summary of where product stands",\n'
        '    "competitors": [\n'
        '      { "name": "competitor name", "strength": "what they do well", "weakness": "where they fall short", "our_advantage": "how we differentiate" }\n'
        "    ],\n"
        '    "positioning_gaps": ["gaps in the market we can exploit"],\n'
        '    "differentiation_opportunities": ["how to stand out"]\n'
        "  },\n"
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
            "Include a thorough competitive analysis section analyzing likely competitors "
            "in the market, our advantages, and positioning gaps.\n\n"
            "Return structured JSON as specified."
        )
