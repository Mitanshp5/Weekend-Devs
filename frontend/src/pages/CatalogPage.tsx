import { useEffect, useState } from "react";

import { getSubjects, type Subject } from "../api/catalog";

export function CatalogPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    getSubjects(8)
      .then((catalog) => {
        setSubjects(catalog.subjects);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <section className="dashboard-page">
      <p className="eyebrow">Grade 8 · curriculum catalog</p>
      <h1>Your learning space</h1>
      <p className="page-copy">Choose a subject to begin with the units available in PRISM.</p>
      {status === "loading" && <p role="status">Loading curriculum…</p>}
      {status === "error" && <p role="alert">Curriculum could not be loaded. Try again shortly.</p>}
      {status === "ready" && <div className="placeholder-grid">{subjects.map((subject) => <article key={subject.slug}><h2>{subject.name}</h2><p>{subject.unit_count} units available</p></article>)}</div>}
    </section>
  );
}
