"""
Multi-Agent Orchestrator
========================
Runs agents in parallel where possible, aggregates outputs,
then feeds into the Critic for final evaluation.

Execution DAG:
  ┌──────────────────┐
  │   ICP Analyzer    │──┐
  └──────────────────┘  │
  ┌──────────────────┐  ├──▶ Messaging Strategist ──▶ Compose Brief ──▶ Critic
  │ Engagement Anlzr │──┘
  └──────────────────┘

Phase 1 (parallel): ICP Analyzer + Engagement Analyzer
Phase 2 (sequential, needs Phase 1): Messaging Strategist
Phase 3: Aggregator composes the 1-pager
Phase 4: Critic reviews the composed brief
"""

import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from agents import icp_analyzer, engagement_analyzer, messaging_strategist, critic


def _run_agent(agent_module, **kwargs) -> tuple[str, dict, float]:
    """Run a single agent, returning (name, result, elapsed_seconds)."""
    name = agent_module.__name__.split(".")[-1]
    start = time.time()
    try:
        result = agent_module.run(**kwargs)
    except Exception as e:
        result = {"error": str(e)}
    elapsed = round(time.time() - start, 2)
    return name, result, elapsed


def compose_brief(
    icp: dict, engagement: dict, messaging: dict, feedback: str | None = None
) -> dict:
    """Aggregate agent outputs into a structured 1-page meeting brief."""
    return {
        "executive_summary": (
            f"{icp.get('icp_summary', '')} "
            f"{engagement.get('engagement_summary', '')} "
            f"{messaging.get('positioning_statement', '')}"
        ),
        "icp": {
            "primary_segment": icp.get("primary_segment"),
            "secondary_segments": icp.get("secondary_segments", []),
            "signals": icp.get("signals", []),
        },
        "engagement": {
            "conversion_rate": engagement.get("conversion_rate"),
            "drop_off_points": engagement.get("drop_off_points", []),
            "at_risk_segments": engagement.get("at_risk_segments", []),
        },
        "messaging": {
            "value_propositions": messaging.get("value_propositions", []),
            "email_hooks": messaging.get("email_hooks", []),
            "growth_hypotheses": messaging.get("growth_hypotheses", []),
        },
        "recommended_actions": engagement.get("recommended_actions", []),
    }


def orchestrate(
    users: list[dict],
    stats: dict | None = None,
    previous_brief: dict | None = None,
    feedback: str | None = None,
) -> dict:
    """
    Full orchestration pipeline.
    Returns { brief, confidence_score, agent_outputs, timing }.
    """
    agent_outputs: dict[str, dict] = {}
    timing: dict[str, float] = {}

    # ── Phase 1: Parallel — ICP + Engagement ──────────────────────────
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = {
            pool.submit(_run_agent, icp_analyzer, users=users, stats=stats): "icp",
            pool.submit(
                _run_agent, engagement_analyzer, users=users, stats=stats
            ): "engagement",
        }
        for fut in as_completed(futures):
            name, result, elapsed = fut.result()
            agent_outputs[name] = result
            timing[name] = elapsed

    # ── Phase 2: Messaging Strategist (needs Phase 1 outputs) ────────
    name, result, elapsed = _run_agent(
        messaging_strategist,
        users=users,
        stats=stats,
        icp_result=agent_outputs.get("icp_analyzer"),
        engagement_result=agent_outputs.get("engagement_analyzer"),
    )
    agent_outputs[name] = result
    timing[name] = elapsed

    # ── Phase 3: Compose the 1-pager ─────────────────────────────────
    brief = compose_brief(
        icp=agent_outputs.get("icp_analyzer", {}),
        engagement=agent_outputs.get("engagement_analyzer", {}),
        messaging=agent_outputs.get("messaging_strategist", {}),
        feedback=feedback,
    )

    # If user provided feedback on a previous brief, include it in context
    if previous_brief and feedback:
        brief["previous_feedback"] = feedback

    # ── Phase 4: Critic reviews the brief ─────────────────────────────
    name, critic_result, elapsed = _run_agent(
        critic, brief=brief, feedback=feedback
    )
    agent_outputs[name] = critic_result
    timing[name] = elapsed

    # Apply critic's revised executive summary if available
    if critic_result.get("revised_executive_summary"):
        brief["executive_summary"] = critic_result["revised_executive_summary"]

    confidence = critic_result.get("confidence_score", 0.5)

    return {
        "brief": brief,
        "confidence_score": confidence,
        "agent_outputs": agent_outputs,
        "timing": timing,
    }
