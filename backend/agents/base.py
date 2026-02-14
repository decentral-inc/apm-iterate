"""
BaseAgent — abstract class every agent inherits from.

Guarantees:
  - Uniform interface (.run())
  - Structured JSON output
  - Timing metadata
  - Isolated system prompts
"""

from __future__ import annotations

import json
import logging
import os
import time
from abc import ABC, abstractmethod
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


class BaseAgent(ABC):
    """
    Every agent must implement:
      - name        (str)  — identifier
      - system_prompt (str) — its reasoning persona
      - build_user_prompt(**ctx) → str
    """

    name: str = "base"
    system_prompt: str = "You are a helpful assistant."

    @abstractmethod
    def build_user_prompt(self, **context) -> str:
        ...

    async def run(self, **context) -> dict:
        """Execute the agent: call LLM, parse JSON, attach timing."""
        start = time.time()
        user_prompt = self.build_user_prompt(**context)
        try:
            client = _get_client()
            resp = await client.chat.completions.create(
                model=MODEL,
                temperature=0.4,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            raw = resp.choices[0].message.content or "{}"
            result = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("[%s] Failed to parse JSON response: %s", self.name, raw[:200])
            result = {"raw": raw}  # type: ignore[possibly-undefined]
        except Exception as e:
            logger.error("[%s] Agent call failed: %s", self.name, e)
            result = {"error": str(e)}

        elapsed = round(time.time() - start, 2)
        return {"agent": self.name, "result": result, "elapsed_s": elapsed}
