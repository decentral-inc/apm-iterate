"""
Agent 3 — MessagingAgent
Proposes positioning, value props, competitive analysis, and growth hypotheses.
"""

from .base import BaseAgent


class MessagingAgent(BaseAgent):
    name = "messaging_agent"
    system_prompt = (
        "You are a senior product marketing strategist.\n"
        "Based on ICP analysis, engagement data, and user interview insights, craft targeted messaging and competitive analysis.\n\n"
        "IMPORTANT: For competitive analysis, use REAL company names as competitors. Examples:\n"
        "- Mixpanel, Amplitude, Heap (analytics)\n"
        "- HubSpot, Salesforce, Pipedrive (CRM)\n"
        "- Intercom, Zendesk, Drift (customer engagement)\n"
        "- Gainsight, ChurnZero, Totango (customer success)\n"
        "- Segment, mParticle, RudderStack (data infrastructure)\n"
        "Choose competitors that are relevant to the product context.\n\n"
        "Also generate product_recommendations — specific, implementable product changes\n"
        "derived from user interview friction points that would impact the bottom line.\n\n"
        "Return JSON with EXACTLY these keys:\n"
        "{\n"
        '  "positioning_statement": "1-liner positioning",\n'
        '  "value_propositions": [\n'
        '    { "segment": "...", "headline": "...", "body": "...", "cta": "..." }\n'
        "  ],\n"
        '  "competitive_analysis": {\n'
        '    "market_position": "1-2 sentence summary of where product stands",\n'
        '    "competitors": [\n'
        '      { "name": "REAL competitor name like Mixpanel or HubSpot", "strength": "...", "weakness": "...", "our_advantage": "..." }\n'
        "    ],\n"
        '    "positioning_gaps": ["gaps we can exploit"],\n'
        '    "differentiation_opportunities": ["how to stand out"]\n'
        "  },\n"
        '  "product_recommendations": [\n'
        '    {\n'
        '      "title": "short feature/change title",\n'
        '      "description": "what to build or change",\n'
        '      "source": "which interview or data point inspired this",\n'
        '      "impact": "high|medium|low",\n'
        '      "effort": "high|medium|low",\n'
        '      "category": "ux|feature|integration|pricing|performance",\n'
        '      "action_type": "create_jira|write_prd|run_ab_test|design_sprint|ship_fix"\n'
        '    }\n'
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
        parts = [
            "Create a messaging strategy based on user data, prior agent analysis, and user interview insights.\n\n",
            f"USER DATA SUMMARY:\n{ctx.get('user_summary', 'N/A')}\n\n",
            f"ICP ANALYSIS:\n{ctx.get('icp_result', 'Not available yet')}\n\n",
            f"SEGMENTATION ANALYSIS:\n{ctx.get('segmentation_result', 'Not available yet')}\n\n",
        ]
        if ctx.get('interview_context'):
            parts.append(f"USER INTERVIEW DATA:\n{ctx['interview_context']}\n\n")
        parts.append(
            "Include a thorough competitive analysis with REAL competitor names (e.g., Mixpanel, HubSpot, Gainsight).\n"
            "Also generate specific product_recommendations based on interview friction points.\n"
            "Each product recommendation should be a concrete, implementable change.\n\n"
            "Return structured JSON as specified."
        )
        return "".join(parts)
