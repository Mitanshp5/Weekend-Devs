import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";

import { PageTransition } from "../components/PageTransition";

const signals = ["Find your current starting point", "Get an explainable learning path", "See exactly what to practise next"];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function StartPage() {
  const reduceMotion = useReducedMotion();
  const interaction = reduceMotion ? {} : { whileHover: { y: -3, scale: 1.01 }, whileTap: { scale: 0.98 } };

  return (
    <PageTransition className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">PRISM · adaptive learning</p>
        <h1 id="page-title">Ready to learn your way?</h1>
        <p className="hero-copy">Start with a short diagnostic. PRISM builds an explainable learning path from your responses—not a one-size-fits-all lesson.</p>
        <motion.div className="diagnostic-card" {...interaction} transition={{ type: "spring", stiffness: 380, damping: 25 }}>
          <div>
            <p className="card-label">Your first step</p>
            <h2>5-question diagnostic</h2>
            <p>About 3 minutes · Your responses stay visible and explainable.</p>
          </div>
          <Link className="primary-action" to="/diagnostic">Begin diagnostic</Link>
        </motion.div>
      </section>
      <motion.section className="signals" aria-label="How PRISM personalizes learning" variants={containerVariants} initial="hidden" animate="show">
        {signals.map((signal, index) => (
          <motion.article key={signal} className="signal-card" variants={itemVariants} {...interaction} transition={{ type: "spring", stiffness: 380, damping: 25 }}>
            <span aria-hidden="true">0{index + 1}</span>
            <p>{signal}</p>
          </motion.article>
        ))}
      </motion.section>
    </PageTransition>
  );
}
