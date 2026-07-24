import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";

import { getSubjectPath, type SubjectPath } from "../api/catalog";
import { PageTransition } from "../components/PageTransition";

export function SubjectPathPage() {
  const { subjectSlug = "" } = useParams();
  const navigate = useNavigate();
  const [path, setPath] = useState<SubjectPath | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!subjectSlug) return;
    getSubjectPath(8, subjectSlug)
      .then((nextPath) => { setPath(nextPath); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, [subjectSlug]);

  return (
    <PageTransition className="dashboard-page">
      {status === "loading" && <p role="status">Building your learning map…</p>}
      {status === "error" && <p role="alert">This learning map is not available right now.</p>}
      {status === "ready" && path && (
        <>
          <Link className="back-link" to="/learn">← Curriculum atlas</Link>
          <div className="path-hero">
            <div>
              <p className="eyebrow">Grade {path.grade} · adaptive path</p>
              <h1>{path.subject.name} learning path</h1>
              <p className="page-copy">A transparent sequence of concepts. PRISM will use learner evidence to decide where to enter and what support to offer next.</p>
            </div>
          </div>
          <ol className="unit-journey" aria-label={`${path.subject.name} units`}>
            {path.units.map((unit, index) => (
              <motion.li
                key={unit.slug}
                onClick={() => navigate(`/lesson/${unit.slug}`)}
                style={{ cursor: "pointer" }}
                initial={reduceMotion ? false : { opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={reduceMotion ? { duration: 0.01 } : { type: "spring", stiffness: 260, damping: 25, delay: index * 0.045 }}
              >
                <span className="unit-position">{String(unit.position).padStart(2, "0")}</span>
                <div>
                  <h2>{unit.name}</h2>
                  <p>{unit.concept_count} mapped concepts</p>
                </div>
                <Link className="unit-open" to={`/lesson/${unit.slug}`} onClick={(e) => e.stopPropagation()}>
                  Open <span aria-hidden="true">↗</span>
                </Link>
              </motion.li>
            ))}
          </ol>
        </>
      )}
    </PageTransition>
  );
}
