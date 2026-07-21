import { useRef, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

import { OverviewNav } from "../components/OverviewNav";
import { OverviewSection } from "../components/OverviewSection";
import { PrismArrowButton } from "../components/PrismArrowButton";
import { PrismDiagnosticButton } from "../components/PrismDiagnosticButton";
import { PrismLearningOrbit } from "../components/PrismLearningOrbit";
import { ScreenTearTransition } from "../components/ScreenTearTransition";
import { architecturePrinciples, diagnosticDetails, evaluatorCapabilities, impactAudiences, journeyPhases, prototypeDisclosure, requiredOutcomes } from "../content/prismOverview";
import { useOverviewMotion } from "../hooks/useOverviewMotion";

const sectionCards = [
  ["Independent", "A signal the learner can use without a prompt."],
  ["Hinted", "A signal that responds to a smaller next step."],
  ["Uncertain", "A signal to map before advancing the route."],
] as const;

export function StartPage() {
  const navigate = useNavigate();
  const iconRef = useRef<HTMLSpanElement>(null);
  const [isFadingText, setIsFadingText] = useState(false);
  const [tearOrigin, setTearOrigin] = useState<{ x: number; y: number } | null>(null);
  const { orbitState, reducedMotion } = useOverviewMotion();

  const handleAuthClick = () => {
    if (tearOrigin || isFadingText) return;
    setIsFadingText(true);
    const rect = iconRef.current?.getBoundingClientRect();
    setTearOrigin(rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 });
  };

  return (
    <div className="overview-shell" id="overview-top">
      <a className="skip-link" href="#overview-main">Skip to overview</a>
      <OverviewNav onAuthClick={handleAuthClick} />
      <main id="overview-main">
        <section className="overview-hero" aria-labelledby="page-title" data-orbit-state="ambient">
          <div className="overview-hero__wordmark" aria-hidden="true">PRISM</div>
          <motion.div className="overview-hero__copy" initial={reducedMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.7, delay: 0.3 }}>
            <p className="eyebrow">Adaptive learning / TetraTHON 2026</p>
            <h1 id="page-title">Every learner needs a different next step.</h1>
            <p>PRISM diagnoses where a learner is, adapts a ten-minute path, resolves the concept beneath the doubt, and gives educators evidence they can act on.</p>
            <div className="overview-hero__actions">
              <PrismDiagnosticButton to="/diagnostic" text="Start the 5-question diagnostic" className="overview-primary-cta" />
              <a className="overview-text-link" href="#how-it-works">Explore the system <span aria-hidden="true">↓</span></a>
            </div>
          </motion.div>
          <div className="overview-hero__orbit"><PrismLearningOrbit state={orbitState} reducedMotion={reducedMotion} /></div>
        </section>

        <OverviewSection id="challenge" eyebrow="The challenge" title="One grade. Many starting points." tone="statement">
          <p>Mixed-ability classrooms receive one-size-fits-all digital learning while unresolved STEM doubts compound. A generic chat reply can answer a sentence without finding the concept beneath it — and a useful system still has to work when the network does not.</p>
          <p className="overview-emphasis">Same syllabus. Different next step.</p>
        </OverviewSection>

        <OverviewSection id="how-it-works" eyebrow="Observe → Map → Guide → Verify" title="Five signals are enough to choose a better beginning." visual={<div className="signal-rail">{sectionCards.map(([label, body], index) => <article key={label}><span>0{index + 1}</span><h3>{label}</h3><p>{body}</p></article>)}</div>}>
          <p>A {diagnosticDetails.questionCount}-question probe classifies a revisable starting point: {diagnosticDetails.pathLabels.join(", ")}. Each route begins with a {diagnosticDetails.lessonDuration} micro-lesson, then offers {diagnosticDetails.practiceCount} embedded practice problems with instant feedback.</p>
          <p>Classification is a current evidence view, not permanent tracking.</p>
        </OverviewSection>

        <OverviewSection id="tutor" eyebrow="Doubt resolution" title="Answer the concept beneath the question." tone="panel" visual={<ol className="explanation-ladder"><li>Question or handwritten photo</li><li>Validate transcription</li><li>Map the concept gap</li><li>Choose hint, Socratic prompt, worked step, or direct explanation</li></ol>}>
          <p>PRISM is designed for text intake and optional handwritten-photo direction. It maps a question into a subject taxonomy, surfaces a root-gap hypothesis with uncertainty, and lets learners control how help unfolds.</p>
          <p>Curriculum citations and a concise reasoning trace make that support legible without pretending an answer is certain.</p>
        </OverviewSection>

        <OverviewSection id="mastery" eyebrow="Learning evidence" title="A resolved doubt should change what happens next." visual={<div className="concept-map" aria-label="Concept graph anatomy"><span className="concept-map__node concept-map__node--resolved">Resolved concept</span><span className="concept-map__node">Related weak area</span><span className="concept-map__node">Next check</span></div>}>
          <p>A living concept graph links resolved concepts to related weak areas. Session history, evidence recency, independent correctness, and uncertainty are designed to inform mastery progression — not reduce a learner to one opaque score.</p>
        </OverviewSection>

        <OverviewSection id="evaluators" eyebrow="For evaluators" title="Turn classroom variation into an intervention plan." tone="panel" visual={<div className="evaluator-instrument"><div><span>Learner</span><strong>Starting point</strong></div><div><span>Blocker</span><strong>Common error pattern</strong></div><div><span>Evidence</span><strong>Completion + recency</strong></div><div><span>Action</span><strong>Recommended intervention</strong></div></div>}>
          <p>{evaluatorCapabilities.join(" ")}</p>
          <p>This is interface anatomy for product direction, not a fabricated live classroom dashboard.</p>
        </OverviewSection>

        <OverviewSection id="architecture" eyebrow="Constrained classrooms" title="Useful before the network is perfect." visual={<div className="architecture-flow"><span>Device</span><i>→</i><span>Local queue</span><i>→</i><span>API</span><i>→</i><span>PostgreSQL</span><i>→</i><span>Optional cited augmentation</span></div>}>
          <ul className="overview-list">{architecturePrinciples.map((principle) => <li key={principle}>{principle}</li>)}</ul>
          <p className="prototype-disclosure">{prototypeDisclosure}</p>
        </OverviewSection>

        <OverviewSection id="impact" eyebrow="One classroom system" title="A clear next step for every role." tone="statement">
          <div className="impact-lanes">{impactAudiences.map(({ audience, value }) => <article key={audience}><h3>{audience}</h3><p>{value}</p></article>)}</div>
          <p>PRISM is designed to work with grade-subject curricula, using deterministic diagnostic and authored content before optional augmentation. It can be progressively deployed in schools, tutoring centers, NGOs, and public programs.</p>
        </OverviewSection>

        <section className="overview-closing" aria-labelledby="closing-title">
          <PrismLearningOrbit state="ambient" reducedMotion={reducedMotion} />
          <div><p className="eyebrow">Make the next step clear</p><h2 id="closing-title">Start with evidence, not a label.</h2><p>{requiredOutcomes[0]}</p><div className="overview-closing__actions"><PrismDiagnosticButton to="/diagnostic" text="Start diagnostic" /><PrismArrowButton iconRef={iconRef} text="Sign In / Sign Up" isFadingText={isFadingText} onClick={handleAuthClick} /></div></div>
        </section>
      </main>
      <footer className="overview-footer">PRISM / Personalized Remediation and Intelligent Scaffolding for Mastery</footer>
      {tearOrigin && <ScreenTearTransition originX={tearOrigin.x} originY={tearOrigin.y} onComplete={() => navigate("/auth")} />}
    </div>
  );
}

export default StartPage;
