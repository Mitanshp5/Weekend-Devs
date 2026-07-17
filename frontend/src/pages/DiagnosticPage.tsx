import { Link } from "react-router-dom";

export function DiagnosticPage() {
  return (
    <main className="app-shell">
      <section className="hero diagnostic-step" aria-labelledby="diagnostic-title">
        <p className="eyebrow">PRISM · diagnostic</p>
        <p className="question-count">Question 1 of 5</p>
        <h1 id="diagnostic-title">Let&apos;s find your starting point.</h1>
        <p className="hero-copy">A verified subject-specific question will appear here once the team selects the first learning domain.</p>
        <div className="diagnostic-card">
          <div>
            <p className="card-label">Waiting for curriculum selection</p>
            <h2>Diagnostic question placeholder</h2>
            <p>No answer is recorded until a reviewed curriculum item is available.</p>
          </div>
          <Link to="/learn" className="primary-action">Continue</Link>
        </div>
      </section>
    </main>
  );
}
