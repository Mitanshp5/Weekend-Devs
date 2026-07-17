import { Link } from "react-router-dom";

import { PageTransition } from "../components/PageTransition";

export function DiagnosticPage() {
  return (
    <PageTransition className="app-shell">
      <section className="hero diagnostic-step" aria-labelledby="diagnostic-title">
        <p className="eyebrow">PRISM · evidence intake</p>
        <div className="diagnostic-frame">
          <div>
            <p className="card-label">Before a learning recommendation</p>
            <h1 id="diagnostic-title">Start with evidence, not a label.</h1>
            <p className="hero-copy">PRISM will only recommend a path after it has a reviewed diagnostic item and a learner response to interpret.</p>
            <Link to="/learn" className="primary-action">Explore curriculum atlas</Link>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
