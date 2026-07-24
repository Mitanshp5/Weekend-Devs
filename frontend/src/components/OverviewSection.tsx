import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export function OverviewSection({
  children,
  eyebrow,
  id,
  title,
  visual,
  tone = "default",
}: {
  children: ReactNode;
  eyebrow: string;
  id: string;
  title: string;
  visual?: ReactNode;
  tone?: "default" | "statement" | "panel";
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section className={`overview-section overview-section--${tone}`} id={id} aria-labelledby={`${id}-title`}>
      <motion.div className="overview-section__content" initial={reduceMotion ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.22 }} transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.16, 1, 0.3, 1] }}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={`${id}-title`}>{title}</h2>
        <div className="overview-section__body">{children}</div>
      </motion.div>
      {visual ? <div className="overview-section__visual">{visual}</div> : null}
    </section>
  );
}
