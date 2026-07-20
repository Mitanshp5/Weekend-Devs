import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageTransition } from "../components/PageTransition";
import { PrismParticleField } from "../components/PrismParticleField";

interface OAuthCallbackProps {
  onLoginSuccess?: (user: any, role: "student" | "teacher") => void;
}

export function OAuthCallback({ onLoginSuccess }: OAuthCallbackProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token") || searchParams.get("accessToken") || "google-oauth-session-token";
    const email = searchParams.get("email") || "user@google.com";
    const username = searchParams.get("username") || email.split("@")[0];

    let pendingRole: "student" | "teacher" = "student";
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        pendingRole = (window.localStorage.getItem("prism_pending_role") as "student" | "teacher") || "student";
      }
    } catch (e) {
      // Ignore
    }

    const userObj = { email, username, role: pendingRole, is_verified: true };

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("prism_token", token);
        window.localStorage.setItem("prism_user", JSON.stringify(userObj));
        window.localStorage.removeItem("prism_pending_role");
      }
    } catch (e) {
      // Ignore
    }

    if (onLoginSuccess) {
      onLoginSuccess(userObj, pendingRole);
    }

    if (pendingRole === "teacher") {
      navigate("/teacher");
    } else {
      navigate("/learn");
    }
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
