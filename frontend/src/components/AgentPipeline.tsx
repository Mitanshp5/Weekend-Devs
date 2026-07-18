import { motion, useReducedMotion } from "motion/react";

type AgentPipelineProps = { compact?: boolean };

const stages = [
  { label: "Observe", detail: "Capture learning evidence" },
  { label: "Map", detail: "Locate the concept gap" },
  { label: "Guide", detail: "Choose the next support" },
  { label: "Verify", detail: "Check for understanding" },
] as const;

/**
 * Visible workflow state, not hidden model reasoning. Each stage describes a
 * learner-facing decision that PRISM can later ground in attempt evidence.
 */
export function AgentPipeline({ compact = false }: AgentPipelineProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className={`agentic-pipeline${compact ? " agentic-pipeline-compact" : ""}`} data-motion="agentic-pipeline" data-testid="agentic-pipeline" aria-label="PRISM adaptive learning loop">
      {!compact && <p className="pipeline-kicker">PRISM learning loop</p>}
      <ol>
        {stages.map((stage, index) => (
          <motion.li
            key={stage.label}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0.01 } : { type: "spring", stiffness: 250, damping: 24, delay: index * 0.08 }}
          >
            <span className="pipeline-index">0{index + 1}</span>
            <span className="pipeline-stage">{stage.label}</span>
            {!compact && <span className="pipeline-detail">{stage.detail}</span>}
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
