import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageTransition } from "../components/PageTransition";
import { PrismParticleField } from "../components/PrismParticleField";

const SIDECAR_URL = "http://localhost:9400";

interface OAuthCallbackProps {
  onLoginSuccess?: (user: any, role?: "student" | "teacher") => void;
}

export function OAuthCallback({ onLoginSuccess }: OAuthCallbackProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    async function completeOAuth() {
      const token = searchParams.get("token") || searchParams.get("accessToken") || "google-oauth-session-token";
      const email = searchParams.get("email") || "user@google.com";
      const username = searchParams.get("username") || email.split("@")[0];

      let savedRole: "student" | "teacher" | undefined = undefined;

      // 1. Fetch user profile from PostgreSQL / Redis cache via FlowWatch API
      try {
        const profileRes = await fetch(`${SIDECAR_URL}/api/user/profile?email=${encodeURIComponent(email)}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.user && (profileData.user.role === "student" || profileData.user.role === "teacher")) {
            savedRole = profileData.user.role;
          }
        }
      } catch (e) {
        console.warn("[OAuth Callback Warning] Could not fetch profile from sidecar:", e);
      }

      // 2. Local storage fallback
      if (!savedRole) {
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            const stored = window.localStorage.getItem("prism_user");
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed.email === email && (parsed.role === "student" || parsed.role === "teacher")) {
                savedRole = parsed.role;
              }
            }
          }
        } catch (e) {
          // Ignore
        }
      }

      const userObj = { email, username, role: savedRole, is_verified: true };

      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem("prism_token", token);
          window.localStorage.setItem("prism_user", JSON.stringify(userObj));
        }
      } catch (e) {
        // Ignore
      }

      if (onLoginSuccess) {
        onLoginSuccess(userObj, savedRole);
      }

      if (savedRole === "teacher") {
        navigate("/teacher");
      } else if (savedRole === "student") {
        navigate("/learn");
      } else {
        navigate("/onboarding");
      }
    }

    completeOAuth();
  }, [navigate, searchParams, onLoginSuccess]);

  return (
    <PageTransition className="app-shell auth-page-wrapper">
      <PrismParticleField />
      <div className="auth-card-container">
        <div className="auth-glass-panel" style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid var(--lime)",
              borderTopColor: "transparent",
              borderRadius: "50%",
              margin: "0 auto 1.5rem",
              animation: "spin 1s linear infinite"
            }}
          />
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#f4f7ef", margin: "0 0 0.5rem" }}>
            Authenticating...
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#9fc9e6", margin: 0 }}>
            Completing Google OAuth single sign-on
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
