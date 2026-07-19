"""Test-only persisted analytics fixtures; never imported by application code."""

from app.database import connect, initialize_database


def seed_tutor_analytics_data() -> None:
    initialize_database()
    learners = [(f"test-learner-{index}", band) for index, band in enumerate(("foundational", "developing", "developing", "ready_for_extension", "needs_prerequisite_support"), 1)]
    with connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute("TRUNCATE TABLE teacher_summaries, mastery_history, misconception_clusters, tutor_sessions")
            for learner_id, band in learners:
                cursor.execute("INSERT INTO teacher_summaries (learner_id, grade, band, current_path, current_target_concept, likely_blocker_concept, blocker_confidence, evidence_summary, recommended_action) VALUES (%s, 8, %s, 'Grade-Level', 'eq.inverse_operations', 'eq.inverse_operations', .78, 'Test evidence', 'Test intervention')", (learner_id, band))
            cursor.execute("INSERT INTO mastery_history (learner_id, concept_id, p_know, evidence_count, independent_correct_count) VALUES ('test-learner-1', 'eq.inverse_operations', .48, 3, 1)")
            cursor.execute("INSERT INTO mastery_history (learner_id, concept_id, p_know, evidence_count, independent_correct_count) VALUES ('test-learner-4', 'eq.inverse_operations', .88, 8, 5)")
            for score in (.31, .45):
                cursor.execute("INSERT INTO mastery_history (learner_id, concept_id, p_know, evidence_count, independent_correct_count) VALUES ('test-learner-2', 'eq.inverse_operations', %s, 4, 1)", (score,))
            for index in range(3):
                cursor.execute("INSERT INTO misconception_clusters (grade, error_tag, concept_id, affected_count, total_active, impact_score, suggested_intervention) VALUES (8, %s, 'eq.inverse_operations', 3, 5, %s, 'Test intervention')", (f"test-error-{index}", .9 - index / 10))
