import { motion, useReducedMotion } from "motion/react";

/** A visual metaphor for PRISM turning learner signals into a clear path. */
export function PrismSignature() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className="prism-signature"
      data-motion="prism-signature"
      data-testid="prism-signature"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.82, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 18, delay: reduceMotion ? 0 : 0.15 }}
    >
      <motion.div
        className="prism-signal"
        animate={reduceMotion ? undefined : { rotate: [0, 1.5, -1, 0], y: [0, -3, 0] }}
        transition={reduceMotion ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="prism-orbit prism-orbit-one" />
        <span className="prism-orbit prism-orbit-two" />
        <span className="prism-facet prism-facet-left" />
        <span className="prism-facet prism-facet-right" />
        <span className="prism-core" />
      </motion.div>
    </motion.div>
  );
}
