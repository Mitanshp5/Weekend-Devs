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
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <Link className="primary-action" to="/diagnostic">Start diagnostic</Link>
              <Link
                to="/auth"
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "#f4f7ef",
                  background: "rgba(23, 58, 44, 0.8)",
                  border: "1px solid rgba(145, 221, 196, 0.3)",
                  textDecoration: "none",
                  transition: "all 0.2s"
                }}
              >
                Sign In / Sign Up
              </Link>
            </div>
            <p>Begin with a short check-in or log in as a Student or Teacher.</p>
          </div>
        </div>
        <figure className="hero-art">
          <img src={prismLearningHero} alt="Student working at a desk inside layers of translucent prism light" />
        </figure>
      </section>
    </PageTransition>
  );
}
