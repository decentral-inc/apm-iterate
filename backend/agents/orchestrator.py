"""
Multi-Agent Orchestrator
========================
Coordinates 4 agents via asyncio.gather() for parallel execution where possible.
Supports both batch and streaming (SSE) execution.

Execution DAG:
  ┌───────────────┐
  │   ICP Agent   │──┐
  └───────────────┘  │
                     ├──▶ Messaging Agent ──▶ Compose Brief ──▶ Critic Agent
  ┌───────────────┐  │
  │ Segmentation  │──┘
  │    Agent      │
  └───────────────┘

Phase 1 (parallel):  ICP + Segmentation
Phase 2 (needs P1):  Messaging Agent
Phase 3:             Compose 1-pager
Phase 4:             Critic Agent evaluates
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, AsyncGenerator

from .icp_agent import ICPAgent
from .segmentation_agent import SegmentationAgent
from .messaging_agent import MessagingAgent
from .critic_agent import CriticAgent

logger = logging.getLogger(__name__)

AGENT_DESCRIPTIONS = {
    "icp_agent": {
        "label": "ICP Agent",
        "description": "Analyzing ideal customer profile from user data...",
        "thinking": [
            "Examining signed-up vs non-engaged user distributions",
            "Identifying high-fit company sizes and roles",
            "Scoring industry segments by conversion potential",
            "Synthesizing primary and secondary ICP segments",
        ],
    },
    "segmentation_agent": {
        "label": "Segmentation Agent",
        "description": "Analyzing engagement patterns and conversion gaps...",
        "thinking": [
            "Computing conversion rates across segments",
            "Identifying drop-off stages in the user journey",
            "Flagging at-risk segments with low engagement",
            "Generating actionable recommendations with priorities",
        ],
    },
    "messaging_agent": {
        "label": "Messaging Agent",
        "description": "Crafting targeted messaging and competitive analysis...",
        "thinking": [
            "Reviewing ICP and segmentation insights",
            "Developing value propositions per segment",
            "Analyzing competitive landscape and positioning gaps",
            "Formulating growth hypotheses with impact estimates",
        ],
    },
    "critic_agent": {
        "label": "Critic Agent",
        "description": "Evaluating brief quality and assigning confidence score...",
        "thinking": [
            "Reviewing executive summary for clarity",
            "Checking ICP alignment with data evidence",
            "Validating recommended actions are implementable",
            "Scoring overall brief confidence and suggesting improvements",
        ],
    },
}


def _summarize_users(users: list[dict]) -> str:
    """Build a compact statistical summary string for agent context."""
    if not users:
        return "No user data available."

    signed = [u for u in users if u.get("status") == "signed_up"]
    not_eng = [u for u in users if u.get("status") == "not_engaged"]

    def dist(lst: list[dict], key: str) -> dict[str, int]:
        d: dict[str, int] = {}
        for u in lst:
            v = u.get(key, "unknown")
            d[v] = d.get(v, 0) + 1
        return d

    return json.dumps({
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
    }, indent=2)


def _compose_brief(
    icp: dict,
    segmentation: dict,
    messaging: dict,
    feedback: str | None = None,
) -> dict:
    """Aggregate agent outputs into the structured 1-page meeting brief."""
    # Merge email hooks from messaging into recommended actions from segmentation
    seg_actions = segmentation.get("recommended_actions", [])
    email_hooks = messaging.get("email_hooks", [])

    # Convert email hooks into actionable recommended actions
    for hook in email_hooks:
        seg_actions.append({
            "action": f"Send email: {hook.get('subject_line', 'Outreach email')}",
            "type": "send_email",
            "target_segment": hook.get("target_segment", "All"),
            "priority": "medium",
            "details": hook.get("preview_text", ""),
        })

    brief: dict[str, Any] = {
        "executive_summary": (
            f"{icp.get('icp_summary', '')} "
            f"{segmentation.get('engagement_summary', '')} "
            f"{messaging.get('positioning_statement', '')}"
        ),
        "icp": {
            "primary_segment": icp.get("primary_segment"),
            "secondary_segments": icp.get("secondary_segments", []),
            "signals": icp.get("signals", []),
        },
        "segmentation": {
            "conversion_rate": segmentation.get("conversion_rate"),
            "drop_off_points": segmentation.get("drop_off_points", []),
            "at_risk_segments": segmentation.get("at_risk_segments", []),
            "engagement_patterns": segmentation.get("engagement_patterns", []),
        },
        "messaging": {
            "value_propositions": messaging.get("value_propositions", []),
            "competitive_analysis": messaging.get("competitive_analysis", {}),
            "growth_hypotheses": messaging.get("growth_hypotheses", []),
        },
        "recommended_actions": seg_actions,
    }
    if feedback:
        brief["previous_feedback"] = feedback
    return brief


async def orchestrate(
    users: list[dict],
    stats: dict | None = None,
    previous_brief: dict | None = None,
    feedback: str | None = None,
) -> dict:
    """
    Full orchestration pipeline (batch mode).
    Returns: { brief, confidence_score, agent_outputs, timing }
    """
    user_summary = _summarize_users(users)
    agent_outputs: dict[str, Any] = {}
    timing: dict[str, float] = {}

    # ── Phase 1: Parallel — ICP + Segmentation ───────────────────────
    icp_agent = ICPAgent()
    seg_agent = SegmentationAgent()

    phase1 = await asyncio.gather(
        icp_agent.run(user_summary=user_summary, stats=stats),
        seg_agent.run(user_summary=user_summary, stats=stats),
    )

    icp_out, seg_out = phase1
    agent_outputs[icp_out["agent"]] = icp_out["result"]
    agent_outputs[seg_out["agent"]] = seg_out["result"]
    timing[icp_out["agent"]] = icp_out["elapsed_s"]
    timing[seg_out["agent"]] = seg_out["elapsed_s"]

    # ── Phase 2: Messaging Agent (depends on Phase 1) ────────────────
    msg_agent = MessagingAgent()
    msg_out = await msg_agent.run(
        user_summary=user_summary,
        stats=stats,
        icp_result=json.dumps(icp_out["result"]),
        segmentation_result=json.dumps(seg_out["result"]),
    )
    agent_outputs[msg_out["agent"]] = msg_out["result"]
    timing[msg_out["agent"]] = msg_out["elapsed_s"]

    # ── Phase 3: Compose the 1-pager ─────────────────────────────────
    brief = _compose_brief(
        icp=icp_out["result"],
        segmentation=seg_out["result"],
        messaging=msg_out["result"],
        feedback=feedback,
    )

    # ── Phase 4: Critic evaluates the brief ──────────────────────────
    critic = CriticAgent()
    critic_out = await critic.run(brief=json.dumps(brief), feedback=feedback or "")
    agent_outputs[critic_out["agent"]] = critic_out["result"]
    timing[critic_out["agent"]] = critic_out["elapsed_s"]

    # Apply critic's revised summary if available
    if critic_out["result"].get("revised_executive_summary"):
        brief["executive_summary"] = critic_out["result"]["revised_executive_summary"]

    confidence = critic_out["result"].get("confidence_score", 0.5)

    return {
        "brief": brief,
        "confidence_score": confidence,
        "agent_outputs": agent_outputs,
        "timing": timing,
    }


async def orchestrate_stream(
    users: list[dict],
    stats: dict | None = None,
    previous_brief: dict | None = None,
    feedback: str | None = None,
) -> AsyncGenerator[dict, None]:
    """
    Streaming orchestration pipeline — yields SSE-compatible events
    as each agent starts, thinks, and completes.
    """
    user_summary = _summarize_users(users)
    agent_outputs: dict[str, Any] = {}
    timing: dict[str, float] = {}

    # ── Phase 1: ICP + Segmentation in parallel ──────────────────────
    yield {
        "event": "phase_start",
        "phase": 1,
        "label": "Parallel Analysis",
        "agents": ["icp_agent", "segmentation_agent"],
    }

    for agent_name in ["icp_agent", "segmentation_agent"]:
        desc = AGENT_DESCRIPTIONS[agent_name]
        yield {
            "event": "agent_start",
            "agent": agent_name,
            "label": desc["label"],
            "message": desc["description"],
            "thinking": desc["thinking"],
        }

    icp_agent = ICPAgent()
    seg_agent = SegmentationAgent()

    phase1 = await asyncio.gather(
        icp_agent.run(user_summary=user_summary, stats=stats),
        seg_agent.run(user_summary=user_summary, stats=stats),
    )
    icp_out, seg_out = phase1

    agent_outputs[icp_out["agent"]] = icp_out["result"]
    agent_outputs[seg_out["agent"]] = seg_out["result"]
    timing[icp_out["agent"]] = icp_out["elapsed_s"]
    timing[seg_out["agent"]] = seg_out["elapsed_s"]

    yield {
        "event": "agent_complete",
        "agent": "icp_agent",
        "label": "ICP Agent",
        "summary": icp_out["result"].get("icp_summary", "Analysis complete"),
        "elapsed_s": icp_out["elapsed_s"],
    }
    yield {
        "event": "agent_complete",
        "agent": "segmentation_agent",
        "label": "Segmentation Agent",
        "summary": seg_out["result"].get("engagement_summary", "Analysis complete"),
        "elapsed_s": seg_out["elapsed_s"],
    }

    # ── Phase 2: Messaging Agent ─────────────────────────────────────
    yield {
        "event": "phase_start",
        "phase": 2,
        "label": "Messaging Strategy",
        "agents": ["messaging_agent"],
    }

    desc = AGENT_DESCRIPTIONS["messaging_agent"]
    yield {
        "event": "agent_start",
        "agent": "messaging_agent",
        "label": desc["label"],
        "message": desc["description"],
        "thinking": desc["thinking"],
    }

    msg_agent = MessagingAgent()
    msg_out = await msg_agent.run(
        user_summary=user_summary,
        stats=stats,
        icp_result=json.dumps(icp_out["result"]),
        segmentation_result=json.dumps(seg_out["result"]),
    )
    agent_outputs[msg_out["agent"]] = msg_out["result"]
    timing[msg_out["agent"]] = msg_out["elapsed_s"]

    yield {
        "event": "agent_complete",
        "agent": "messaging_agent",
        "label": "Messaging Agent",
        "summary": msg_out["result"].get("positioning_statement", "Strategy complete"),
        "elapsed_s": msg_out["elapsed_s"],
    }

    # ── Phase 3: Compose brief ───────────────────────────────────────
    yield {
        "event": "phase_start",
        "phase": 3,
        "label": "Composing Brief",
        "agents": [],
    }

    brief = _compose_brief(
        icp=icp_out["result"],
        segmentation=seg_out["result"],
        messaging=msg_out["result"],
        feedback=feedback,
    )

    yield {"event": "compose_complete", "message": "1-page brief composed"}

    # ── Phase 4: Critic Agent ────────────────────────────────────────
    yield {
        "event": "phase_start",
        "phase": 4,
        "label": "Quality Review",
        "agents": ["critic_agent"],
    }

    desc = AGENT_DESCRIPTIONS["critic_agent"]
    yield {
        "event": "agent_start",
        "agent": "critic_agent",
        "label": desc["label"],
        "message": desc["description"],
        "thinking": desc["thinking"],
    }

    critic = CriticAgent()
    critic_out = await critic.run(brief=json.dumps(brief), feedback=feedback or "")
    agent_outputs[critic_out["agent"]] = critic_out["result"]
    timing[critic_out["agent"]] = critic_out["elapsed_s"]

    if critic_out["result"].get("revised_executive_summary"):
        brief["executive_summary"] = critic_out["result"]["revised_executive_summary"]

    confidence = critic_out["result"].get("confidence_score", 0.5)

    yield {
        "event": "agent_complete",
        "agent": "critic_agent",
        "label": "Critic Agent",
        "summary": critic_out["result"].get("overall_assessment", "Review complete"),
        "elapsed_s": critic_out["elapsed_s"],
    }

    # ── Final result ─────────────────────────────────────────────────
    yield {
        "event": "complete",
        "brief": brief,
        "confidence_score": confidence,
        "agent_outputs": agent_outputs,
        "timing": timing,
    }
