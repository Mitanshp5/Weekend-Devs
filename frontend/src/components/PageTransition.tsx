import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  const offset = reduceMotion ? 0 : 15;

  return (
    <motion.div
      className={className}
      data-motion="page-transition"
      initial={{ opacity: 0, y: offset }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -offset }}
      transition={{ duration: reduceMotion ? 0.01 : 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
