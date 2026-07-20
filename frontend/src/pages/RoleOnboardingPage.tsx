import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { PageTransition } from "../components/PageTransition";
import { PrismParticleField } from "../components/PrismParticleField";

const SIDECAR_URL = "http://localhost:9400";

export function RoleOnboardingPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher">("student");
  const [userName, setUserName] = useState<string>("Learner");
  const [userEmail, setUserEmail] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = window.localStorage.getItem("prism_user");
        if (stored) {
          const user = JSON.parse(stored);
          if (user.email) {
            setUserEmail(user.email);
            setUserName(user.username || user.email.split("@")[0]);
          }
          if (user.role && (user.role === "student" || user.role === "teacher")) {
            setSelectedRole(user.role);
          }
        }
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  const handleContinue = async () => {
    setSubmitting(true);

    // 1. Persist role selection in PostgreSQL database & Redis via FlowWatch API
    if (userEmail) {
      try {
        await fetch(`${SIDECAR_URL}/api/user/role`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail, role: selectedRole }),
        });
      } catch (err) {
        console.warn("[Onboarding Warning] Could not persist role to database API:", err);
      }
    }

    // 2. Update local storage session state
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = window.localStorage.getItem("prism_user");
        const existingUser = stored ? JSON.parse(stored) : {};
        const updatedUser = { ...existingUser, role: selectedRole };
        window.localStorage.setItem("prism_user", JSON.stringify(updatedUser));
      }
    } catch (e) {
      // Ignore
    }

    setSubmitting(false);

    // 3. Route to corresponding dashboard
    if (selectedRole === "teacher") {
      navigate("/teacher");
    } else {
      navigate("/learn");
    }
  };

  return (
    <PageTransition className="app-shell auth-page-wrapper">
      <PrismParticleField />

      <div className="auth-card-container" style={{ maxWidth: "620px" }}>
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <div className="auth-brand-badge">
            WELCOME TO PRISM
          </div>
          <h1 className="auth-header-title">
            Select Your Role
          </h1>
          <p className="auth-header-subtitle">
            Hello, <strong style={{ color: "#dff28a" }}>{userName}</strong>! Tell us how you'll be using PRISM so we can set up your personalized workspace.
          </p>
        </div>

        {/* Role Onboarding Glass Card */}
        <div className="auth-glass-panel" style={{ padding: "2.25rem 2.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.75rem" }}>
            {/* Student Choice Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedRole("student")}
              className={`role-onboarding-card ${selectedRole === "student" ? "active" : ""}`}
            >
              <div className="role-card-icon">🎓</div>
              <div className="role-card-header">
                <h3 className="role-card-title">I am a Student</h3>
                {selectedRole === "student" && <span className="role-card-badge">Selected</span>}
              </div>
              <p className="role-card-desc">
                Personalized learning paths, diagnostic check-ins, and 24/7 Socratic AI tutoring.
              </p>
              <ul className="role-card-bullets">
                <li>✦ Adaptive micro-lessons</li>
                <li>✦ Real-time concept gap repair</li>
                <li>✦ Mastery badges & tracking</li>
              </ul>
            </motion.div>

            {/* Teacher Choice Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedRole("teacher")}
              className={`role-onboarding-card ${selectedRole === "teacher" ? "active" : ""}`}
            >
              <div className="role-card-icon">👩‍🏫</div>
              <div className="role-card-header">
                <h3 className="role-card-title">I am a Teacher</h3>
                {selectedRole === "teacher" && <span className="role-card-badge">Selected</span>}
              </div>
              <p className="role-card-desc">
                Classroom intervention command center, learner analytics, and concept heatmaps.
              </p>
              <ul className="role-card-bullets">
                <li>✦ Real-time intervention alerts</li>
                <li>✦ Cohort misconception analytics</li>
                <li>✦ Guided student support</li>
              </ul>
            </motion.div>
          </div>

          {/* Action Button */}
          <motion.button
            type="button"
            disabled={submitting}
            onClick={handleContinue}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="auth-submit-btn"
            style={{ fontSize: "1rem", padding: "0.95rem 1.5rem" }}
          >
            {submitting ? "Saving workspace..." : `Continue as ${selectedRole === "teacher" ? "Teacher" : "Student"} →`}
          </motion.button>
        </div>
      </div>
    </PageTransition>
  );
}
