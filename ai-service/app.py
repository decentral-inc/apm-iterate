"""
AI Product Intelligence — Flask Microservice
=============================================
POST /analyze  →  Multi-agent orchestration pipeline
GET  /health   →  Health check
"""

import os
from dotenv import load_dotenv

load_dotenv()

from flask import Flask, request, jsonify
from orchestrator import orchestrate

app = Flask(__name__)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "ai-agents"})


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Expects JSON body:
    {
      "users": [...],
      "stats": {...},
      "previous_brief": {...},   // optional – for feedback loop
      "feedback": "..."          // optional
    }
    """
    data = request.get_json(force=True)
    users = data.get("users", [])
    stats = data.get("stats")
    previous_brief = data.get("previous_brief")
    feedback = data.get("feedback")

    if not users:
        return jsonify({"error": "users array is required"}), 400

    result = orchestrate(
        users=users,
        stats=stats,
        previous_brief=previous_brief,
        feedback=feedback,
    )
    return jsonify(result)


if __name__ == "__main__":
    port = int(os.getenv("AI_SERVICE_PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
