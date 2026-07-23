/**
 * RecommendationPanel — Evidence ledger + learner controls slide-in panel.
 *
 * Shows:
 *   - Current BKT P(know) with band label
 *   - PRISM's next-step recommendation with reason trace
 *   - Learner controls: Review (→ ProgressPage), Easier, Harder, Retry
 *
 * Design: slides in from the right on mobile/tablet; fixed aside on wide
 * screens when open. Uses CSS transform for smooth animation.
 */

import type { GuidanceResponse } from "../api/tutorAnalytics";

interface RecommendationPanelProps {
  open: boolean;
  onClose: () => void;
  learnerId: string;
  conceptId: string;
  pKnow: number;
  guidance: GuidanceResponse | null;
  onReview: () => void;
  onRetry: () => void;
  onEasier: () => void;
  onHarder: () => void;
}

const BAND_META: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  ready_for_extension: {
    label: "Ready for extension",
    color: "#1a5c3f",
    bg: "rgba(27,181,118,.07)",
    border: "rgba(27,181,118,.2)",
  },
  developing: {
    label: "Developing",
    color: "#6b5900",
    bg: "rgba(230,126,34,.07)",
    border: "rgba(230,126,34,.2)",
  },
  needs_prerequisite_support: {
    label: "Needs prerequisite support",
    color: "#880e4f",
    bg: "rgba(214,48,49,.07)",
    border: "rgba(214,48,49,.2)",
  },
  insufficient_evidence: {
    label: "Insufficient evidence",
    color: "#555",
    bg: "rgba(99,110,114,.07)",
    border: "rgba(99,110,114,.18)",
  },
};

function deriveBandKey(pKnow: number): string {
  if (pKnow >= 0.70) return "ready_for_extension";
  if (pKnow >= 0.40) return "developing";
  return "needs_prerequisite_support";
}

export function RecommendationPanel({
  open,
  onClose,
  learnerId: _learnerId,
  conceptId: _conceptId,
  pKnow,
  guidance,
  onReview,
  onRetry,
  onEasier,
  onHarder,
}: RecommendationPanelProps) {
  const bandKey = deriveBandKey(pKnow);
  const bandMeta = BAND_META[bandKey] ?? BAND_META.insufficient_evidence;
  const pct = Math.round(pKnow * 100);

  // Extract clean reason lines from guidance message (split by newlines / bold markers)
  const reasonLines = guidance?.message
    ? guidance.message
        .split("\n")
        .map((l) => l.replace(/\*\*/g, "").trim())
        .filter(Boolean)
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(16,40,30,.35)",
          backdropFilter: "blur(2px)",
          zIndex: 200,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .25s ease",
        }}
      />

      {/* Panel */}
      <aside
        id="recommendation-panel"
        role="complementary"
        aria-label="Evidence and recommendation panel"
        aria-hidden={!open}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(92vw, 380px)",
          background: "#fff",
          zIndex: 201,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .28s cubic-bezier(0.16,1,0.3,1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          boxShadow: "-8px 0 40px rgba(16,40,30,.18)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.2rem 1.4rem .9rem",
            borderBottom: "1px solid #f0f2f5",
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 1,
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 .15rem",
                fontFamily: '"SFMono-Regular", Consolas, monospace',
                fontSize: ".65rem",
                fontWeight: 700,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "#6c927e",
              }}
            >
              PRISM · evidence ledger
            </p>
            <h2
              style={{
                margin: 0,
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                fontSize: "1rem",
                fontWeight: 700,
                color: "#142b21",
              }}
            >
              Evidence &amp; Next Step
            </h2>
          </div>
          <button
            id="panel-close"
            onClick={onClose}
            aria-label="Close panel"
            style={{
              background: "#f0f2f5",
              border: "none",
              borderRadius: ".5rem",
              width: "2rem",
              height: "2rem",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              fontSize: ".9rem",
              color: "#636e72",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.2rem 1.4rem", flex: 1 }}>
          {/* Mastery state */}
          <section style={{ marginBottom: "1.4rem" }}>
            <p
              style={{
                margin: "0 0 .5rem",
                fontFamily: '"SFMono-Regular", Consolas, monospace',
                fontSize: ".68rem",
                fontWeight: 700,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "#636e72",
              }}
            >
              Current mastery
            </p>
            <div
              style={{
                background: bandMeta.bg,
                border: `1.5px solid ${bandMeta.border}`,
                borderRadius: ".75rem",
                padding: ".9rem 1.1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".6rem",
                  marginBottom: ".3rem",
                }}
              >
                <span
                  style={{
                    width: ".55rem",
                    height: ".55rem",
                    borderRadius: "50%",
                    background: bandMeta.color,
                    flexShrink: 0,
                  }}
                />
                <strong
                  style={{
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    fontSize: ".88rem",
                    fontWeight: 700,
                    color: bandMeta.color,
                  }}
                >
                  {bandMeta.label}
                </strong>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: '"SFMono-Regular", Consolas, monospace',
                    fontSize: ".82rem",
                    fontWeight: 700,
                    color: bandMeta.color,
                    fontFeatureSettings: '"tnum"',
                  }}
                >
                  {pct}%
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: '"SFMono-Regular", Consolas, monospace',
                  fontSize: ".7rem",
                  color: "#636e72",
                  fontFeatureSettings: '"tnum"',
                }}
              >
                P(know) = {pKnow.toFixed(3)} · BKT estimate
              </p>
            </div>
          </section>

          {/* Recommendation / reason trace */}
          <section style={{ marginBottom: "1.4rem" }}>
            <p
              style={{
                margin: "0 0 .5rem",
                fontFamily: '"SFMono-Regular", Consolas, monospace',
                fontSize: ".68rem",
                fontWeight: 700,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "#636e72",
              }}
            >
              PRISM recommendation
            </p>
            {reasonLines ? (
              <div
                style={{
                  background: "rgba(85,50,133,.04)",
                  border: "1px solid rgba(85,50,133,.12)",
                  borderRadius: ".75rem",
                  padding: ".9rem 1.1rem",
                }}
              >
                {reasonLines.map((line, i) => (
                  <p
                    key={i}
                    style={{
                      margin: i === 0 ? 0 : ".5rem 0 0",
                      fontFamily: '"Inter", "Segoe UI", sans-serif',
                      fontSize: ".85rem",
                      color: "#2d3436",
                      lineHeight: 1.6,
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <div
                style={{
                  background: "#f8f9fa",
                  border: "1px solid #e9ecef",
                  borderRadius: ".75rem",
                  padding: ".9rem 1.1rem",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    fontSize: ".85rem",
                    color: "#636e72",
                    lineHeight: 1.55,
                  }}
                >
                  Complete an attempt to receive a PRISM recommendation.
                </p>
              </div>
            )}
          </section>

          {/* Learner controls */}
          <section>
            <p
              style={{
                margin: "0 0 .6rem",
                fontFamily: '"SFMono-Regular", Consolas, monospace',
                fontSize: ".68rem",
                fontWeight: 700,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "#636e72",
              }}
            >
              Learner controls
            </p>
            <div style={{ display: "grid", gap: ".5rem" }}>
              <button
                id="panel-review"
                onClick={onReview}
                style={controlStyle("#f8f9fa", "#2d3436", "#e9ecef")}
              >
                <span style={{ fontSize: "1.1rem" }}>📊</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".88rem" }}>
                    Review evidence
                  </div>
                  <div style={{ fontSize: ".75rem", color: "#636e72", marginTop: ".1rem" }}>
                    See your full progress timeline
                  </div>
                </div>
              </button>

              <button
                id="panel-easier"
                onClick={onEasier}
                style={controlStyle("rgba(27,181,118,.06)", "#1a5c3f", "rgba(27,181,118,.18)")}
              >
                <span style={{ fontSize: "1.1rem" }}>🔽</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".88rem" }}>
                    Try easier questions
                  </div>
                  <div style={{ fontSize: ".75rem", color: "#636e72", marginTop: ".1rem" }}>
                    Lower difficulty on this concept
                  </div>
                </div>
              </button>

              <button
                id="panel-harder"
                onClick={onHarder}
                style={controlStyle("rgba(214,48,49,.05)", "#880e4f", "rgba(214,48,49,.18)")}
              >
                <span style={{ fontSize: "1.1rem" }}>🔼</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".88rem" }}>
                    Try harder questions
                  </div>
                  <div style={{ fontSize: ".75rem", color: "#636e72", marginTop: ".1rem" }}>
                    Higher difficulty on this concept
                  </div>
                </div>
              </button>

              <button
                id="panel-retry"
                onClick={onRetry}
                style={controlStyle("rgba(85,50,133,.05)", "#553285", "rgba(85,50,133,.18)")}
              >
                <span style={{ fontSize: "1.1rem" }}>🔄</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".88rem" }}>
                    Retry this lesson
                  </div>
                  <div style={{ fontSize: ".75rem", color: "#636e72", marginTop: ".1rem" }}>
                    Restart from the first question
                  </div>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Footer evidence note */}
        <div
          style={{
            padding: ".9rem 1.4rem",
            borderTop: "1px solid #f0f2f5",
            fontFamily: '"SFMono-Regular", Consolas, monospace',
            fontSize: ".65rem",
            color: "#b2bec3",
            lineHeight: 1.5,
          }}
        >
          BKT parameters: P(L₀)=0.35, P(T)=0.12, P(S)=0.08, P(G)=0.20 ·
          documented assumptions, not empirically calibrated
        </div>
      </aside>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared button style helper
// ---------------------------------------------------------------------------
function controlStyle(
  bg: string,
  color: string,
  border: string,
): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: ".75rem",
    padding: ".75rem 1rem",
    background: bg,
    border: `1.5px solid ${border}`,
    borderRadius: ".7rem",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    color,
    width: "100%",
    transition: "opacity .15s",
  };
}
