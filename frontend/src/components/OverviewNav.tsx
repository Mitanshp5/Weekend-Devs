import { Link } from "react-router-dom";

const anchors = [
  ["Challenge", "#challenge"],
  ["How it works", "#how-it-works"],
  ["Tutor", "#tutor"],
  ["For evaluators", "#evaluators"],
  ["Architecture", "#architecture"],
] as const;

export function OverviewNav({ onAuthClick }: { onAuthClick: () => void }) {
  return (
    <header className="overview-nav">
      <a className="overview-nav__brand" href="#overview-top" aria-label="PRISM overview">PRISM</a>
      <nav aria-label="Project overview" className="overview-nav__links">
        {anchors.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
      </nav>
      <div className="overview-nav__actions">
        <button type="button" className="overview-nav__sign-in" onClick={onAuthClick}>Sign in</button>
        <Link className="overview-nav__diagnostic" to="/diagnostic">Start diagnostic</Link>
      </div>
    </header>
  );
}
