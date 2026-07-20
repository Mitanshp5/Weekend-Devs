import { useEffect, useState } from "react";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function completeOAuth() {
      const token = searchParams.get("token") || searchParams.get("accessToken");

      if (!token) {
        console.warn("[OAuth Error] No access token provided in callback URL.");
        setErrorMessage("Authentication failed: Missing server token.");
        setTimeout(() => navigate("/auth?error=token_missing", { replace: true }), 1500);
        return;
      }

      // Perform server-side validation of the token with the sidecar API
      try {
        const verifyRes = await fetch(`${SIDECAR_URL}/api/auth/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token }),
        });

        if (!verifyRes.ok) {
          throw new Error("Server rejected token validation");
        }

        const verifyData = await verifyRes.json();
        if (!verifyData.valid || !verifyData.user) {
          throw new Error("Invalid token signature or user payload");
        }

        const verifiedUser = verifyData.user;
        const savedRole =
          verifiedUser.role === "student" || verifiedUser.role === "teacher"
            ? verifiedUser.role
            : undefined;

        // Persist valid session
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem("prism_token", token);
          window.localStorage.setItem("prism_user", JSON.stringify(verifiedUser));
        }

        if (onLoginSuccess) {
          onLoginSuccess(verifiedUser, savedRole);
        }

        if (savedRole === "teacher") {
          navigate("/teacher", { replace: true });
        } else if (savedRole === "student") {
          navigate("/learn", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      } catch (err: any) {
        console.error("[OAuth Security Alert] Server-side token validation failed:", err);
        setErrorMessage("Authentication error: Untrusted or expired token.");
        setTimeout(() => navigate("/auth?error=invalid_token", { replace: true }), 1500);
      }
    }

    completeOAuth();
  }, [navigate, searchParams, onLoginSuccess]);

  return (
    <PageTransition className="app-shell auth-page-wrapper">
      <PrismParticleField />
      <div className="auth-card-container">
        <div className="auth-glass-panel" style={{ textAlign: "center", padding: "3rem 2rem" }}>
          {!errorMessage ? (
            <>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  border: "4px solid var(--lime)",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  margin: "0 auto 1.5rem",
                  animation: "spin 1s linear infinite",
                }}
              />
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#f4f7ef", margin: "0 0 0.5rem" }}>
                Verifying Credentials...
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#9fc9e6", margin: 0 }}>
                Performing server-side token validation
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.8rem" }}>⚠️</div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ff6b6b", margin: "0 0 0.5rem" }}>
                Authentication Failed
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#f4f7ef", margin: 0 }}>
                {errorMessage}
              </p>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
