import { Link } from "react-router-dom";

import prismLearningHero from "../assets/prism-learning-hero.png";
import { PageTransition } from "../components/PageTransition";

export function StartPage() {
  return (
    <PageTransition className="app-shell">
      <section className="start-hero" aria-labelledby="page-title">
        <div className="start-copy">
          <p className="eyebrow">PRISM / adaptive learning</p>
          <h1 id="page-title">Make the next step clear.</h1>
          <p className="hero-copy">
            PRISM turns a learner response into visible evidence, a focused concept gap, and an explainable next action.
          </p>
          <div className="hero-action">
            <Link className="primary-action" to="/diagnostic">Start diagnostic</Link>
            <p>Begin with a short check-in. You can see the reasoning behind every recommendation.</p>
          </div>
        </div>
        <figure className="hero-art">
          <img src={prismLearningHero} alt="Student working at a desk inside layers of translucent prism light" />
        </figure>
      </section>
    </PageTransition>
  );
}
