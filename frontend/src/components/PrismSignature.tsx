import { motion, useReducedMotion } from "motion/react";

/** A floating prism and orbital atoms representing a learner signal becoming a clear next step. */
export function PrismSignature() {
  const reduceMotion = useReducedMotion();
  const orbit = (duration: number, delay = 0) => reduceMotion ? undefined : { duration, delay, repeat: Infinity, ease: "linear" as const };

  return (
    <motion.div
      aria-hidden="true"
      className="prism-signature"
      data-motion="prism-signature"
      data-testid="prism-signature"
      initial={false}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 18, delay: reduceMotion ? 0 : 0.08 }}
    >
      <motion.div
        className="prism-signal"
        animate={reduceMotion ? undefined : { y: [0, -8, 0], rotate: [0, 1, -1, 0] }}
        transition={reduceMotion ? undefined : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.span className="prism-orbit prism-orbit-one" style={{ rotate: 24 }} animate={reduceMotion ? undefined : { rotate: [24, 384] }} transition={orbit(18)} />
        <motion.span className="prism-orbit prism-orbit-two" style={{ rotate: -38 }} animate={reduceMotion ? undefined : { rotate: [-38, -398] }} transition={orbit(14)} />
        <motion.span className="prism-orbit prism-orbit-three" style={{ rotate: 66 }} animate={reduceMotion ? undefined : { rotate: [66, 426] }} transition={orbit(22)} />

        <motion.span className="prism-orbit-path prism-atom-path-one" data-testid="prism-orbit-path" animate={reduceMotion ? undefined : { rotate: [0, 360] }} transition={orbit(7)}><span className="prism-atom" /></motion.span>
        <motion.span className="prism-orbit-path prism-atom-path-two" data-testid="prism-orbit-path" animate={reduceMotion ? undefined : { rotate: [0, -360] }} transition={orbit(9, 0.8)}><span className="prism-atom" /></motion.span>
        <motion.span className="prism-orbit-path prism-atom-path-three" data-testid="prism-orbit-path" animate={reduceMotion ? undefined : { rotate: [0, 360] }} transition={orbit(11, 1.5)}><span className="prism-atom" /></motion.span>

        <span className="prism-facet prism-facet-left" />
        <span className="prism-facet prism-facet-right" />
        <span className="prism-core" />
      </motion.div>
    </motion.div>
  );
}
