"""Seed demo student accounts and mastery profiles for PRISM.

Inserts users directly into PostgreSQL (bypassing the sidecar rate limiter)
using the same bcrypt hashing the FlowWatch auth module uses.

Run via run-dev.bat automatically, or manually:
    backend/.venv/Scripts/python.exe -m app.seed_learners
"""

from __future__ import annotations

import bcrypt

from app.database import connect, initialize_database

# Seed learner definitions
SEED_LEARNERS = [
    {
        "name": "Aanya Sharma",
        "email": "aanya@prism.demo",
        "password": "Prism_demo_1",
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
        "password": "Prism_demo_2",
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
        "password": "Prism_demo_3",
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
        "password": "Prism_demo_4",
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
        "password": "Prism_demo_5",
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
        "password": "Prism_demo_6",
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
        "password": "Prism_demo_7",
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
        "password": "Prism_demo_8",
        "band": "developing",
        "description": "Developing learner, inconsistent performance",
        "mastery": [
            ("eq.inverse_operations", 0.38, 5, 1),
            ("num.mul_div_fluency", 0.45, 4, 1),
            ("math.data_handling", 0.29, 3, 0),
        ],
    },
]


def seed_learner_accounts() -> None:
    """Insert seed student accounts directly into PostgreSQL and seed mastery profiles."""
    initialize_database()

    seed_emails = [l["email"] for l in SEED_LEARNERS]

    print("[Seed] Upserting demo student accounts and mastery profiles...")

    with connect() as conn:
        with conn.cursor() as cur:
            # Clear old mastery/session/summary data for these seed accounts (idempotent)
            cur.execute("DELETE FROM mastery_history WHERE learner_id = ANY(%s)", (seed_emails,))
            cur.execute("DELETE FROM teacher_summaries WHERE learner_id = ANY(%s)", (seed_emails,))
            cur.execute("DELETE FROM tutor_sessions WHERE learner_id = ANY(%s)", (seed_emails,))

            for learner in SEED_LEARNERS:
                email = learner["email"]

                # Hash password the same way FlowWatch does (bcrypt, cost factor 10)
                pw_hash = bcrypt.hashpw(learner["password"].encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("utf-8")

                # Upsert auth_users — insert or update role/username if already exists
                cur.execute(
                    """
                    INSERT INTO auth_users (username, email, password, role, is_verified)
                    VALUES (%s, %s, %s, 'student', true)
                    ON CONFLICT (email) DO UPDATE
                        SET username = EXCLUDED.username,
                            password = EXCLUDED.password,
                            role = 'student',
                            is_verified = true,
                            updated_at = now()
                    """,
                    (learner["name"], email, pw_hash),
                )
                print(f"  [UPSERTED] {email}")

                # Insert mastery history (two snapshots per concept to show growth)
                for concept_id, p_know, evidence_count, independent_correct in learner["mastery"]:
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
                print(f"  [PROFILE]  {email} — {learner['band']} ({len(learner['mastery'])} concepts)")

    print("[Seed] Done! 8 demo student accounts ready.")


if __name__ == "__main__":
    seed_learner_accounts()
