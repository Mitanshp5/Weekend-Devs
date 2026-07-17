import { Link } from "react-router-dom";

const signals = ["Find your current starting point", "Get an explainable learning path", "See exactly what to practise next"];

export function StartPage() {
  return <main className="app-shell"><section className="hero" aria-labelledby="page-title"><p className="eyebrow">PRISM · adaptive learning</p><h1 id="page-title">Ready to learn your way?</h1><p className="hero-copy">Start with a short diagnostic. PRISM builds an explainable learning path from your responses—not a one-size-fits-all lesson.</p><div className="diagnostic-card"><div><p className="card-label">Your first step</p><h2>5-question diagnostic</h2><p>About 3 minutes · Your responses stay visible and explainable.</p></div><Link className="primary-action" to="/diagnostic">Begin diagnostic</Link></div></section><section className="signals" aria-label="How PRISM personalizes learning">{signals.map((signal, index) => <article key={signal} className="signal-card"><span aria-hidden="true">0{index + 1}</span><p>{signal}</p></article>)}</section></main>;
}
