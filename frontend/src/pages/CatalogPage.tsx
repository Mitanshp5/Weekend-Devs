import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

import { getSubjects, type Subject } from "../api/catalog";
import { PageTransition } from "../components/PageTransition";

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } };

export function CatalogPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    getSubjects(8).then((catalog) => { setSubjects(catalog.subjects); setStatus("ready"); }).catch(() => setStatus("error"));
  }, []);

  return (
    <PageTransition className="dashboard-page">
      <p className="eyebrow">Grade 8 · curriculum catalog</p>
      <h1>Your learning space</h1>
      <p className="page-copy">Choose a subject to begin with the units available in PRISM.</p>
      {status === "loading" && <p role="status">Loading curriculum…</p>}
      {status === "error" && <p role="alert">Curriculum could not be loaded. Try again shortly.</p>}
      {status === "ready" && (
        <motion.div className="placeholder-grid" variants={containerVariants} initial="hidden" animate="show">
          {subjects.map((subject) => (
            <motion.div
              key={subject.slug}
              variants={itemVariants}
              whileHover={reduceMotion ? undefined : { y: -6, scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              transition={{ type: "spring", stiffness: 380, damping: 25 }}
            >
              <Link className="subject-link" to={`/lesson/${subject.slug}`}>
                <article><h2>{subject.name}</h2><p>{subject.unit_count} units available</p></article>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </PageTransition>
  );
}
