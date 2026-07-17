import { motion, useReducedMotion } from "motion/react";

const particles = [
  ["8%", "16%", 16, -8, 8], ["18%", "68%", -12, 10, 11], ["29%", "25%", 10, 14, 9], ["40%", "82%", -8, -10, 13], ["57%", "13%", 14, 8, 12],
  ["68%", "72%", -14, -7, 10], ["79%", "28%", 9, -14, 14], ["91%", "61%", -9, 9, 8], ["84%", "9%", 8, 12, 11], ["5%", "45%", 8, -9, 15],
] as const;

/** Ambient, low-density particle field inspired by computational particle systems. */
export function PrismParticleField() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className="prism-particle-field" data-testid="prism-particle-field">
      {particles.map(([left, top, driftX, driftY, duration], index) => (
        <motion.span
          key={`${left}-${top}`}
          className={`prism-particle prism-particle-${index % 3}`}
          data-testid="prism-particle"
          style={{ left, top }}
          animate={reduceMotion ? { opacity: 0.35 } : { x: [0, driftX, 0], y: [0, driftY, 0], opacity: [0.12, 0.72, 0.12] }}
          transition={reduceMotion ? { duration: 0.01 } : { duration, delay: index * 0.35, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
