import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import prismLearningHero from "../assets/prism-learning-hero.png";
import { PageTransition } from "../components/PageTransition";
import { PrismArrowButton } from "../components/PrismArrowButton";
import { PrismDiagnosticButton } from "../components/PrismDiagnosticButton";
import { ScreenTearTransition } from "../components/ScreenTearTransition";

export function StartPage() {
  const navigate = useNavigate();
  const iconRef = useRef<HTMLSpanElement>(null);

  const [isFadingText, setIsFadingText] = useState(false);
  const [tearOrigin, setTearOrigin] = useState<{ x: number; y: number } | null>(null);

  const handleAuthClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (tearOrigin || isFadingText) return;

    setIsFadingText(true);

    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      setTearOrigin({ x, y });
    } else {
      setTearOrigin({ x: window.innerWidth / 3, y: window.innerHeight / 2 });
    }
  };

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
              <PrismDiagnosticButton to="/diagnostic" text="Start diagnostic" />
              <PrismArrowButton
                iconRef={iconRef}
                text="Sign In / Sign Up"
                isFadingText={isFadingText}
                onClick={handleAuthClick}
              />
            </div>
            <p>Begin with a short check-in or log in as a Student or Teacher.</p>
          </div>
        </div>
        <figure className="hero-art">
          <img src={prismLearningHero} alt="Student working at a desk inside layers of translucent prism light" />
        </figure>
      </section>

      {tearOrigin && (
        <ScreenTearTransition
          originX={tearOrigin.x}
          originY={tearOrigin.y}
          onComplete={() => navigate("/auth")}
        />
      )}
    </PageTransition>
  );
}

export default StartPage;
