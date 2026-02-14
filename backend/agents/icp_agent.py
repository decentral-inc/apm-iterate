"""
Agent 1 — ICPAgent
Determines the Ideal Customer Profile from the user dataset.
"""

from .base import BaseAgent


class ICPAgent(BaseAgent):
    name = "icp_agent"
    system_prompt = (
        "You are an expert B2B go-to-market analyst.\n"
        "Given a dataset summary of users (signed-up customers and non-engaged leads), "
        "determine the Ideal Customer Profile (ICP).\n\n"
        "Return JSON with EXACTLY these keys:\n"
        "{\n"
        '  "icp_summary": "1-2 sentence summary of the ICP",\n'
        '  "primary_segment": { "company_size": "...", "role": "...", "industry": "..." },\n'
        '  "secondary_segments": [ { "company_size": "...", "role": "...", "industry": "..." } ],\n'
        '  "signals": ["list of buying signals observed"],\n'
        '  "fit_score_distribution": { "high_fit": <int>, "medium_fit": <int>, "low_fit": <int> }\n'
        "}"
    )

    def build_user_prompt(self, **ctx) -> str:
        return (
            "Analyze the following user base and identify the Ideal Customer Profile.\n\n"
            f"USER DATA SUMMARY:\n{ctx.get('user_summary', 'N/A')}\n\n"
            f"AGGREGATE STATS:\n{ctx.get('stats', 'N/A')}\n\n"
            "Return structured JSON as specified."
        )
