import { Link } from "react-router-dom";

import { PageTransition } from "../components/PageTransition";
import { PrismSignature } from "../components/PrismSignature";

export function StartPage() {
  return (
    <PageTransition className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <div className="hero-heading">
          <div>
            <p className="eyebrow">PRISM · adaptive learning</p>
            <h1 id="page-title">Learning, made legible.</h1>
          </div>
          <PrismSignature />
        </div>
        <p className="hero-copy">PRISM does more than mark answers. It captures evidence, maps the smallest concept gap, and makes the next learning step visible.</p>
        <div className="hero-action">
          <p>Start with a short check-in. PRISM will explain its recommendation before you choose what comes next.</p>
          <Link className="primary-action" to="/diagnostic">Start diagnostic</Link>
        </div>
      </section>
    </PageTransition>
  );
}
