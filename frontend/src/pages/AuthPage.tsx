import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { PageTransition } from "../components/PageTransition";
import { PrismParticleField } from "../components/PrismParticleField";

const SIDECAR_URL = "http://localhost:9400";

interface AuthPageProps {
  onLoginSuccess?: (user: any, role: "student" | "teacher") => void;
}

export function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === "signin" ? "/auth/login" : "/auth/register";
      const payload =
        mode === "signin"
          ? { email, password }
          : { email, password, username: username || email.split("@")[0] };

      const res = await fetch(`${SIDECAR_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || data.error || "Authentication failed.");
      }

      // Store auth tokens and user role in localStorage
      const user = data.user || { email, username: username || email.split("@")[0] };
      const token = data.tokens?.accessToken || "demo-jwt-token";

      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem("prism_token", token);
          window.localStorage.setItem("prism_user", JSON.stringify({ ...user, role }));
        }
      } catch (e) {
        // Ignore storage error
      }

      if (onLoginSuccess) {
        onLoginSuccess(user, role);
      }

      // Navigate to corresponding view based on role
      if (role === "teacher") {
        navigate("/teacher");
      } else {
        navigate("/learn");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOAuth = () => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("prism_pending_role", role);
      }
    } catch (e) {
      // Ignore
    }
    window.location.href = `${SIDECAR_URL}/auth/oauth/google`;
  };

  return (
    <PageTransition className="app-shell auth-page-wrapper">
      <PrismParticleField />

      <div className="auth-card-container">
        {/* Header Branding */}
        <div style={{ textAlign: "center" }}>
          <div className="auth-brand-badge">
            PRISM AUTHENTICATION
          </div>
          <h1 className="auth-header-title">
            {mode === "signin" ? "Welcome back to PRISM" : "Create your account"}
          </h1>
          <p className="auth-header-subtitle">
            Adaptive Socratic learning & intervention analytics
          </p>
        </div>

        {/* Auth Glassmorphism Card */}
        <div className="auth-glass-panel">
          {/* Mode Switch Tabs with Animated Pill */}
          <div className="auth-mode-tabs">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); }}
              className={`auth-mode-tab ${mode === "signin" ? "active" : ""}`}
            >
              {mode === "signin" && (
                <motion.span
                  layoutId="auth-tab-pill"
                  className="auth-tab-pill"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span className="auth-tab-text">Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); }}
              className={`auth-mode-tab ${mode === "signup" ? "active" : ""}`}
            >
              {mode === "signup" && (
                <motion.span
                  layoutId="auth-tab-pill"
                  className="auth-tab-pill"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span className="auth-tab-text">Sign Up</span>
            </button>
          </div>

          {/* Form Content Animated on Mode Change */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Role Selector */}
              <div className="auth-role-section">
                <label className="auth-role-label">
                  Select Your Role
                </label>
                <div className="auth-role-grid">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setRole("student")}
                    className={`auth-role-btn ${role === "student" ? "active" : ""}`}
                  >
                    <div className="auth-role-header">
                      <span className="auth-role-title">🎓 Student</span>
                      {role === "student" && <span className="auth-role-indicator" />}
                    </div>
                    <span className="auth-role-desc">Adaptive learning</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setRole("teacher")}
                    className={`auth-role-btn ${role === "teacher" ? "active" : ""}`}
                  >
                    <div className="auth-role-header">
                      <span className="auth-role-title">👩‍🏫 Teacher</span>
                      {role === "teacher" && <span className="auth-role-indicator" />}
                    </div>
                    <span className="auth-role-desc">Intervention portal</span>
                  </motion.button>
                </div>
              </div>

              {/* Alert Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="auth-alert-error"
                >
                  {error}
                </motion.div>
              )}

              {/* Form Inputs */}
              <form onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <div className="auth-field-group">
                    <label className="auth-field-label">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. alex_learner"
                      className="auth-input"
                    />
                  </div>
                )}

                <div className="auth-field-group">
                  <label className="auth-field-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="auth-input"
                  />
                </div>

                <div className="auth-field-group">
                  <label className="auth-field-label">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="auth-input"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="auth-submit-btn"
                >
                  {loading
                    ? "Processing..."
                    : mode === "signin"
                    ? `Sign In as ${role === "student" ? "Student" : "Teacher"}`
                    : `Create ${role === "student" ? "Student" : "Teacher"} Account`}
                </motion.button>
              </form>
            </motion.div>
          </AnimatePresence>

          {/* Divider */}
          <div className="auth-divider">
            <span className="auth-divider-text">
              OR
            </span>
          </div>

          {/* Google OAuth Button */}
          <motion.button
            type="button"
            onClick={handleGoogleOAuth}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="auth-google-btn"
          >
            <svg className="auth-google-icon" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
            Continue with Google
          </motion.button>
        </div>
      </div>
    </PageTransition>
  );
}
