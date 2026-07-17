import { useState } from "react";

import "./App.css";

const diagnosticSignals = [
  "Find your current starting point",
  "Get a learning path built around your evidence",
  "See exactly what to practise next",
];

export default function App() {
  const [hasStartedDiagnostic, setHasStartedDiagnostic] = useState(false);

  if (hasStartedDiagnostic) {
    return (
      <main className="app-shell">
        <section className="hero diagnostic-step" aria-labelledby="diagnostic-title">
          <p className="eyebrow">PRISM · diagnostic</p>
          <p className="question-count">Question 1 of 5</p>
          <h1 id="diagnostic-title">Let&apos;s find your starting point.</h1>
          <p className="hero-copy">
            Your first subject-specific question will appear here once the learning domain is chosen.
            PRISM will keep the evidence behind every recommendation visible.
          </p>
          <div className="diagnostic-card">
            <div>
              <p className="card-label">Waiting for curriculum selection</p>
              <h2>Diagnostic question placeholder</h2>
              <p>No answer is recorded until a verified curriculum item is available.</p>
            </div>
            <button type="button" disabled>
              Continue
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">PRISM · adaptive learning</p>
        <h1 id="page-title">Ready to learn your way?</h1>
        <p className="hero-copy">
          Start with a short diagnostic. PRISM uses your responses to build an explainable
          learning path—not a one-size-fits-all lesson.
        </p>
        <div className="diagnostic-card">
          <div>
            <p className="card-label">Your first step</p>
            <h2>5-question diagnostic</h2>
            <p>About 3 minutes · Your responses stay visible and explainable.</p>
          </div>
          <button type="button" onClick={() => setHasStartedDiagnostic(true)}>
            Begin diagnostic
          </button>
        </div>
      </section>

      <section className="signals" aria-label="How PRISM personalizes learning">
        {diagnosticSignals.map((signal, index) => (
          <article key={signal} className="signal-card">
            <span aria-hidden="true">0{index + 1}</span>
            <p>{signal}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
