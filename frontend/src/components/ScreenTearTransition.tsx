import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";

interface ScreenTearTransitionProps {
  originX: number;
  originY: number;
  onComplete: () => void;
}

/**
 * A deliberately short route transition. The previous screen is never cloned:
 * cloning a long overview created duplicate DOM, image paint work, and a jagged
 * mid-frame tear before the auth route could mount.
 */
export function ScreenTearTransition({ onComplete }: ScreenTearTransitionProps) {
  const reduceMotion = useReducedMotion();

  return createPortal(
    <div className="route-transition-portal" aria-hidden="true">
      <motion.div
        className="route-transition-curtain"
        data-testid="route-transition-curtain"
        initial={reduceMotion ? { opacity: 1 } : { x: "-104%", opacity: 1 }}
        animate={reduceMotion ? { opacity: 1 } : { x: "0%", opacity: 1 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.32, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={onComplete}
      >
        <span className="route-transition-curtain__signal" />
      </motion.div>
    </div>,
    document.body,
  );
}

export default ScreenTearTransition;
