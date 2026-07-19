/**
 * MasteryBadge — reusable mastery band indicator.
 *
 * Shows calibrated wording per audience (learner vs. teacher)
 * and a visual indicator matching the PRISM color system.
 */
import { type CSSProperties } from "react";

interface MasteryBadgeProps {
  pKnow: number;
  band: string;
  message: string;
  size?: "sm" | "md";
}

const BAND_STYLES: Record<string, CSSProperties> = {
  ready_for_extension: {
    background: "linear-gradient(135deg, #d0f5e4, #b2e9d1)",
    color: "#1a5c3f",
    borderColor: "rgba(26, 92, 63, 0.2)",
  },
  developing: {
    background: "linear-gradient(135deg, #fef3cd, #fde68a)",
    color: "#6b5900",
    borderColor: "rgba(107, 89, 0, 0.2)",
  },
  needs_prerequisite_support: {
    background: "linear-gradient(135deg, #fce4ec, #f8bbd0)",
    color: "#880e4f",
    borderColor: "rgba(136, 14, 79, 0.2)",
  },
  foundational: {
    background: "linear-gradient(135deg, #fce4ec, #f8bbd0)",
    color: "#880e4f",
    borderColor: "rgba(136, 14, 79, 0.2)",
  },
  insufficient_evidence: {
    background: "linear-gradient(135deg, #f0f0f0, #e0e0e0)",
    color: "#555",
    borderColor: "rgba(85, 85, 85, 0.2)",
  },
};

export function MasteryBadge({ pKnow, band, message, size = "md" }: MasteryBadgeProps) {
  const style = BAND_STYLES[band] ?? BAND_STYLES.insufficient_evidence;
  const fontSize = size === "sm" ? ".72rem" : ".82rem";

  return (
    <span
      className="mastery-badge"
      title={`P(know) = ${(pKnow * 100).toFixed(0)}%`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: ".4rem",
        padding: size === "sm" ? ".25rem .55rem" : ".35rem .7rem",
        borderRadius: ".5rem",
        border: `1px solid ${style.borderColor}`,
        fontSize,
        fontWeight: 600,
        lineHeight: 1.3,
        ...style,
      }}
    >
      <span
        style={{
          width: size === "sm" ? ".5rem" : ".6rem",
          height: size === "sm" ? ".5rem" : ".6rem",
          borderRadius: "50%",
          background: style.color,
          opacity: 0.6,
          flexShrink: 0,
        }}
      />
      {message}
    </span>
  );
}
