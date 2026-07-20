"""Seed demo student accounts and mastery profiles for PRISM.

Run via run-dev.bat automatically, or manually:
    backend/.venv/Scripts/python.exe -m app.seed_learners
"""

from __future__ import annotations

import urllib.request
import urllib.error
import json
import os

from app.database import connect, initialize_database

SIDECAR_URL = "http://localhost:9400"

# Seed learner definitions: (name, email, password, band, mastery profiles per concept)
SEED_LEARNERS = [
    {
        "name": "Aanya Sharma",
        "email": "aanya@prism.demo",
        "password": "prism_demo_1",
        "band": "developing",
        "description": "Grade-level learner, consistent performer",
        "mastery": [
            ("eq.inverse_operations", 0.61, 6, 2),
            ("num.signed_operations", 0.55, 4, 1),
            ("math.rational_numbers", 0.48, 3, 0),
        ],
    },
    {
        "name": "Ravi Kumar",
        "email": "ravi@prism.demo",
        "password": "prism_demo_2",
        "band": "foundational",
        "description": "Foundational learner, needs prerequisite support",
        "mastery": [
            ("eq.inverse_operations", 0.22, 4, 0),
            ("num.signed_operations", 0.18, 5, 0),
            ("sci.crop_production", 0.31, 3, 0),
        ],
    },
    {
        "name": "Priya Patel",
        "email": "priya@prism.demo",
        "password": "prism_demo_3",
        "band": "ready_for_extension",
        "description": "Advanced learner, quick mastery",
        "mastery": [
            ("eq.inverse_operations", 0.91, 8, 6),
            ("eq.multi_step", 0.87, 7, 5),
            ("math.quadrilaterals", 0.78, 6, 4),
            ("sci.microorganisms", 0.82, 5, 4),
        ],
    },
    {
        "name": "Arjun Singh",
        "email": "arjun@prism.demo",
        "password": "prism_demo_4",
        "band": "developing",
        "description": "Developing learner, improving steadily",
        "mastery": [
            ("eq.inverse_operations", 0.54, 5, 2),
            ("eq.word_translation", 0.42, 4, 1),
            ("math.linear_equations", 0.38, 3, 0),
        ],
    },
    {
        "name": "Meera Iyer",
        "email": "meera@prism.demo",
        "password": "prism_demo_5",
        "band": "developing",
        "description": "Grade-level learner, strong in Science",
        "mastery": [
            ("sci.crop_production", 0.76, 6, 4),
            ("sci.microorganisms", 0.71, 5, 3),
            ("eq.inverse_operations", 0.44, 3, 1),
        ],
    },
    {
        "name": "Kabir Das",
        "email": "kabir@prism.demo",
        "password": "prism_demo_6",
        "band": "needs_prerequisite_support",
        "description": "Foundational learner, struggles with word problems",
        "mastery": [
            ("eq.word_translation", 0.15, 6, 0),
            ("eq.multi_step", 0.20, 5, 0),
            ("num.signed_operations", 0.28, 4, 0),
        ],
    },
    {
        "name": "Nisha Reddy",
        "email": "nisha@prism.demo",
        "password": "prism_demo_7",
        "band": "ready_for_extension",
        "description": "Advanced learner, excels in English",
        "mastery": [
            ("eng.tsunami", 0.93, 7, 6),
            ("eng.christmas_present", 0.88, 6, 5),
            ("sci.conservation", 0.74, 5, 3),
        ],
    },
    {
        "name": "Vikram Joshi",
        "email": "vikram@prism.demo",
        "password": "prism_demo_8",
        "band": "developing",
        "description": "Developing learner, inconsistent performance",
        "mastery": [
            ("eq.inverse_operations", 0.38, 5, 1),
            ("num.mul_div_fluency", 0.45, 4, 1),
            ("math.data_handling", 0.29, 3, 0),
        ],
    },
]


def _sidecar_post(path: str, payload: dict) -> dict | None:
    """POST JSON to the FlowWatch sidecar, return parsed response or None."""
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{SIDECAR_URL}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        # 400 = user already exists — treat as success
        if e.code == 400 and ("already" in body.lower() or "exists" in body.lower() or "duplicate" in body.lower()):
            return {"already_exists": True}
        print(f"  [HTTP {e.code}] {path}: {body[:120]}")
        return None
    except Exception as exc:
        print(f"  [Error] {path}: {exc}")
        return None


def seed_learner_accounts() -> None:
    """Register seed student accounts via the sidecar and insert mastery profiles."""
    initialize_database()

    print("[Seed] Registering demo student accounts and inserting mastery profiles...")

    with connect() as conn:
        with conn.cursor() as cur:
            # Delete any existing seed mastery/session data for these emails so re-runs are idempotent
            seed_emails = [l["email"] for l in SEED_LEARNERS]
            cur.execute(
                "DELETE FROM mastery_history WHERE learner_id = ANY(%s)",
                (seed_emails,),
            )
            cur.execute(
                "DELETE FROM teacher_summaries WHERE learner_id = ANY(%s)",
                (seed_emails,),
            )
            cur.execute(
                "DELETE FROM tutor_sessions WHERE learner_id = ANY(%s)",
                (seed_emails,),
            )

    for learner in SEED_LEARNERS:
        email = learner["email"]

        # 1. Register via FlowWatch Auth (idempotent — 400 if already exists)
        reg_result = _sidecar_post("/auth/register", {
            "email": email,
            "password": learner["password"],
            "username": learner["name"],
        })
        if reg_result is None:
            print(f"  [SKIP] Could not register {email} — sidecar may be down.")
            continue
        if reg_result.get("already_exists"):
            print(f"  [EXISTS] {email}")
        else:
            print(f"  [REGISTERED] {email}")

        # 2. Assign student role
        _sidecar_post("/api/user/role", {"email": email, "role": "student"})

        # 3. Insert mastery history and teacher summary with connect()
        with connect() as conn:
            with conn.cursor() as cur:
                # Insert mastery history entries (multiple p_know snapshots per concept)
                for concept_id, p_know, evidence_count, independent_correct in learner["mastery"]:
                    # Insert two snapshots to simulate growth
                    initial_p = max(0.05, p_know - 0.15)
                    cur.execute(
                        """
                        INSERT INTO mastery_history
                            (learner_id, concept_id, p_know, evidence_count, independent_correct_count)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (email, concept_id, initial_p, max(1, evidence_count - 2), max(0, independent_correct - 1)),
                    )
                    cur.execute(
                        """
                        INSERT INTO mastery_history
                            (learner_id, concept_id, p_know, evidence_count, independent_correct_count)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (email, concept_id, p_know, evidence_count, independent_correct),
                    )

                # Insert teacher summary
                top_concept = learner["mastery"][0][0] if learner["mastery"] else "eq.inverse_operations"
                cur.execute(
                    """
                    INSERT INTO teacher_summaries
                        (learner_id, grade, band, current_path, current_target_concept,
                         likely_blocker_concept, blocker_confidence, evidence_summary,
                         recommended_action)
                    VALUES (%s, 8, %s, 'Grade-Level', %s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                    """,
                    (
                        email,
                        learner["band"],
                        top_concept,
                        top_concept,
                        0.78,
                        learner["description"],
                        "Review concept fundamentals and practice with guided hints.",
                    ),
                )

        print(f"  [PROFILE] {email} — {learner['band']} ({len(learner['mastery'])} concepts seeded)")

    print("[Seed] Done! 8 demo student accounts ready.")


if __name__ == "__main__":
    seed_learner_accounts()
