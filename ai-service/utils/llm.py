"""
Shared utilities for AI agents.
"""

import os
import json
from openai import OpenAI

_client: OpenAI | None = None


def get_openai_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.4) -> dict:
    """
    Single LLM call that returns parsed JSON.
    Falls back to raw text wrapped in a dict on parse failure.
    """
    client = get_openai_client()
    response = client.chat.completions.create(
        model=MODEL,
        temperature=temperature,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    raw = response.choices[0].message.content or "{}"
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"raw": raw}


def summarize_users(users: list[dict]) -> str:
    """Build a compact statistical summary string for agent context."""
    if not users:
        return "No user data available."

    signed = [u for u in users if u.get("status") == "signed_up"]
    not_eng = [u for u in users if u.get("status") == "not_engaged"]

    def dist(lst: list[dict], key: str) -> dict:
        d: dict[str, int] = {}
        for u in lst:
            v = u.get(key, "unknown")
            d[v] = d.get(v, 0) + 1
        return d

    return json.dumps(
        {
            "total_users": len(users),
            "signed_up": len(signed),
            "not_engaged": len(not_eng),
            "signed_up_by_role": dist(signed, "role"),
            "signed_up_by_company_size": dist(signed, "company_size"),
            "signed_up_by_industry": dist(signed, "industry"),
            "not_engaged_by_role": dist(not_eng, "role"),
            "not_engaged_by_company_size": dist(not_eng, "company_size"),
            "not_engaged_by_industry": dist(not_eng, "industry"),
            "sources": dist(users, "source"),
        },
        indent=2,
    )
