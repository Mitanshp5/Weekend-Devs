import { useRef, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

import { OverviewNav } from "../components/OverviewNav";
import { OverviewSection } from "../components/OverviewSection";
import { PrismArrowButton } from "../components/PrismArrowButton";
import { PrismDiagnosticButton } from "../components/PrismDiagnosticButton";
import { PrismLearningOrbit } from "../components/PrismLearningOrbit";
import { ScreenTearTransition } from "../components/ScreenTearTransition";
import { useOverviewMotion } from "../hooks/useOverviewMotion";

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
        {/* Slide 1 */}
        <section className="overview-hero" aria-labelledby="page-title" data-orbit-state="ambient">
          <div className="overview-hero__wordmark" aria-hidden="true">PRISM</div>
          <motion.div className="overview-hero__copy" initial={reducedMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.7, delay: 0.3 }}>
            <p className="eyebrow">Personalized Remediation and Intelligent Scaffolding for Mastery</p>
            <h1 id="page-title">Every learner needs a different next step.</h1>
            <p>From “I am stuck” to a clear next step. Adaptive microlearning + evidence-grounded doubt resolution for mixed-ability Grade 8 classrooms.</p>
            <div className="overview-hero__actions">
              <PrismDiagnosticButton to="/diagnostic" text="Start the 5-question diagnostic" className="overview-primary-cta" />
              <a className="overview-text-link" href="#challenge">Explore the system <span aria-hidden="true">↓</span></a>
            </div>
          </motion.div>
          <div className="overview-hero__orbit"><PrismLearningOrbit state={orbitState} reducedMotion={reducedMotion} /></div>
        </section>

        {/* Slide 2 */}
        <OverviewSection id="challenge" eyebrow="The Problem" title="One grade. Many starting points." tone="statement">
          <p>In one Grade 8 classroom:</p>
          <ul className="overview-list">
            <li>Learners enter the same lesson with <strong>different prerequisite gaps</strong>.</li>
            <li>A single digital path is either too slow, too hard, or too shallow for many of them.</li>
            <li>STEM doubts compound when a learner receives an answer without repairing the underlying concept.</li>
            <li>Teachers cannot inspect every learner’s misconception pattern in real time.</li>
            <li>Always-online products fail at the point of need when bandwidth is weak or intermittent.</li>
          </ul>
          <p className="overview-emphasis">The real problem is not content scarcity. It is deciding the next learning action from limited evidence.</p>
        </OverviewSection>

        {/* Slide 3 */}
        <OverviewSection id="limitations" eyebrow="Current Limitations" title="Why a generic chatbot or one-size-fits-all LMS is not enough" visual={
          <div className="evaluator-instrument">
            <div><span>Same lesson for every learner</span><strong>Diagnostic + differentiated entry path</strong></div>
            <div><span>Generic “ask AI” chat</span><strong>Taxonomy-linked root-gap hypothesis</strong></div>
            <div><span>Correct / incorrect score only</span><strong>Misconception tags + evidence ledger</strong></div>
            <div><span>Dashboard with completion only</span><strong>Ranked intervention recommendation</strong></div>
            <div><span>Cloud-only delivery</span><strong>Cached text-first learning + queued sync</strong></div>
          </div>
        }>
          <p><strong>Design principle:</strong> Technology should <strong>augment teacher judgment</strong>, not silently replace it.</p>
        </OverviewSection>

        {/* Slide 4 */}
        <OverviewSection id="how-it-works" eyebrow="The Loop" title="PRISM: Observe → Map → Guide → Verify" visual={
          <div className="signal-rail">
            <article><span>01</span><h3>OBSERVE</h3><p>5-question probe, answer, time, confidence, doubt</p></article>
            <article><span>02</span><h3>MAP</h3><p>Concept + error evidence model + uncertainty</p></article>
            <article><span>03</span><h3>GUIDE</h3><p>Micro-lesson / tutor scaffold + practice</p></article>
            <article><span>04</span><h3>VERIFY</h3><p>Transfer check, updated mastery + teacher signal</p></article>
          </div>
        }>
          <p>Every recommendation answers four questions: What should this learner do next? What evidence led to that recommendation? How certain is PRISM? What should the teacher do if the learner remains stuck?</p>
        </OverviewSection>

        {/* Slide 5 */}
        <OverviewSection
          id="experiences"
          eyebrow="Two Experiences"
          title="One integrated prototype. Two connected experiences."
          tone="panel"
          visual={
            <div className="impact-lanes" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', margin: 0 }}>
              <article>
                <h3>Learner experience</h3>
                <ul className="overview-list" style={{ marginTop: '1rem' }}>
                  <li>5-question diagnostic</li>
                  <li>Foundational / Grade-Level / Advanced path</li>
                  <li>10-minute personalized micro-lesson</li>
                  <li>3 embedded practice questions + feedback</li>
                  <li>Text doubt + optional handwritten-photo intake</li>
                  <li>Socratic or direct explanation</li>
                  <li>Concept graph + session history</li>
                </ul>
              </article>
              <article>
                <h3>Evaluator experience</h3>
                <ul className="overview-list" style={{ marginTop: '1rem' }}>
                  <li>Level distribution and completion status</li>
                  <li>Common error-pattern clusters</li>
                  <li>Learner-level evidence and likely blocker</li>
                  <li>Recommended short intervention</li>
                  <li>Offline/pending-sync visibility</li>
                  <li>Cohort trends, not public learner ranking</li>
                  <li>Evidence-led follow-up</li>
                </ul>
              </article>
            </div>
          }
        >
          <p style={{ marginTop: '1.5rem' }}><strong>PRISM does not create a second system for teachers.</strong> Learner interactions produce the teacher’s intervention signal.</p>
        </OverviewSection>

        {/* Slide 6 */}
        <OverviewSection id="diagnostic" eyebrow="Diagnostic" title="Five signals to choose a better beginning" visual={
          <div className="evaluator-instrument" style={{ gridTemplateColumns: '1fr' }}>
            <div><span>Q1: Number sense</span><strong>Detects integer-operation readiness</strong></div>
            <div><span>Q2: Equality meaning</span><strong>Checks “equation as balance,” not memorized steps</strong></div>
            <div><span>Q3: One-step inverse operation</span><strong>Tests inverse-operation selection</strong></div>
            <div><span>Q4: Multi-step structure</span><strong>Reveals whether learner stops before isolating x</strong></div>
            <div><span>Q5: Transfer / check</span><strong>Tests substitution and explanation</strong></div>
          </div>
        }>
          <p><strong>Foundational:</strong> begin with equality and inverse operations.</p>
          <p><strong>Grade-Level:</strong> begin with targeted repair and grade-level application.</p>
          <p><strong>Advanced:</strong> begin with variation, modeling, or extension.</p>
        </OverviewSection>

        {/* Slide 7 */}
        <OverviewSection id="paths" eyebrow="Microlearning Paths" title="Same curriculum goal. Different next step." tone="statement">
          <p>Non-negotiable learning design: <strong>Worked example → self-explanation prompt → independent attempt → immediate feedback → next-step choice</strong></p>
          <div className="impact-lanes" style={{ marginTop: '2rem' }}>
            <article><h3>Foundational</h3><p>Equality-as-balance visual → inverse operation worked example → guided self-explanation</p></article>
            <article><h3>Grade-Level</h3><p>Multi-step equation worked example → identify a common stopping error → guided repair</p></article>
            <article><h3>Advanced</h3><p>Compare two valid solution paths → model a word problem → justify/check efficiency</p></article>
          </div>
        </OverviewSection>

        {/* Slide 8 & 9 */}
        <OverviewSection id="tutor" eyebrow="Doubt resolution" title="Do not only answer the doubt. Repair its root cause." tone="panel" visual={
          <ol className="explanation-ladder">
            <li>Text / photo intake</li>
            <li>Learner confirms extracted question</li>
            <li>Curriculum-scoped concept retrieval</li>
            <li>Root-gap hypothesis + confidence</li>
            <li>Socratic or direct scaffold + cited lesson source</li>
            <li>Transfer check and graph update</li>
          </ol>
        }>
          <p><strong>The tutor escalates help only when the learner needs it:</strong> Socratic hint → Explain error → Worked step → Direct explanation → Check thinking.</p>
          <p>OCR text is never silently treated as truth. The learner sees and confirms/corrects the extracted question before PRISM reasons over it.</p>
        </OverviewSection>

        {/* Slide 10 */}
        <OverviewSection id="mastery" eyebrow="Learning evidence" title="A resolved doubt should change what happens next." visual={
          <div className="concept-map" aria-label="Concept graph anatomy">
            <span className="concept-map__node concept-map__node--resolved">Resolved concept</span>
            <span className="concept-map__node concept-map__node--related">Related weak area</span>
            <span className="concept-map__node concept-map__node--next">Next check</span>
          </div>
        }>
          <p>What a concept node shows:</p>
          <ul className="overview-list">
            <li><strong>Mastery state:</strong> needs prerequisite support / developing / likely ready for transfer</li>
            <li><strong>Evidence:</strong> independent correct responses, hint-assisted responses, recent misconception tags</li>
            <li><strong>Recency:</strong> when evidence was last observed</li>
            <li><strong>Uncertainty:</strong> low / medium / high</li>
            <li><strong>Action:</strong> revisit, practice, transfer check, or teacher support</li>
          </ul>
        </OverviewSection>

        {/* Slide 11 */}
        <OverviewSection id="evaluators" eyebrow="For evaluators" title="The teacher view answers: “Who needs what, based on what evidence, now?”" visual={
          <div className="evaluator-instrument">
            <div><span>Learner</span><strong>Starting point</strong></div>
            <div><span>Blocker</span><strong>Common error pattern</strong></div>
            <div><span>Evidence</span><strong>Completion + recency</strong></div>
            <div><span>Action</span><strong>Recommended intervention</strong></div>
          </div>
        }>
          <p>Learners by current Foundational / Grade-Level / Advanced starting route. Active, completed, and offline-pending learning sessions. Top misconception clusters by affected learners, repeat rate, recency, downstream risk, and trend. One ranked intervention recommendation—not a wall of charts.</p>
        </OverviewSection>

        {/* Slide 12 */}
        <OverviewSection id="architecture" eyebrow="Architecture" title="Useful before the network is perfect." visual={
          <div className="architecture-flow">
            <span>Device</span><i>→</i><span>Local queue</span><i>→</i><span>API</span><i>→</i><span>PostgreSQL</span><i>→</i><span>Optional cited augmentation</span>
          </div>
        }>
          <ul className="overview-list">
            <li>PWA + cached content: useful during poor connectivity</li>
            <li>Text-first micro-lessons: low data cost and quick first paint</li>
            <li>Local outbox: learner work is not discarded when the network fails</li>
            <li>Idempotent events: a retried sync cannot duplicate an attempt</li>
            <li>PostgreSQL as source of truth: durable, auditable learner and curriculum evidence</li>
          </ul>
        </OverviewSection>

        {/* Slide 13 & 14 */}
        <OverviewSection id="trust" eyebrow="Trust & Market Fit" title="Trust is a feature—not a footer" tone="statement">
          <p>Overconfident diagnosis is mitigated by a confidence state, an “insufficient evidence” path, and revisable placement. Hallucinated tutor explanations are prevented via curriculum-scoped retrieval, citation IDs, schema validation, and deterministic fallback.</p>
          <p><strong>A classroom intervention layer—not a replacement LMS.</strong> Initial deployment wedge: One grade + one subject + one high-leverage concept family (Grade 8 Mathematics → linear equations → prerequisite repair + doubt resolution).</p>
        </OverviewSection>

        {/* Slide 15 */}
        <section className="overview-closing" aria-labelledby="closing-title">
          <PrismLearningOrbit state="ambient" reducedMotion={reducedMotion} />
          <div>
            <p className="eyebrow">Make the next step clear</p>
            <h2 id="closing-title">PRISM turns evidence into action.</h2>
            <p>PRISM makes the next learning step clear—for the learner who is stuck and the teacher responsible for the whole room.</p>
            <div className="overview-closing__actions">
              <PrismDiagnosticButton to="/diagnostic" text="Start diagnostic" />
              <PrismArrowButton iconRef={iconRef} text="Sign In / Sign Up" isFadingText={isFadingText} onClick={handleAuthClick} />
            </div>
          </div>
        </section>
      </main>
      <footer className="overview-footer">PRISM / Personalized Remediation and Intelligent Scaffolding for Mastery</footer>
      {tearOrigin && <ScreenTearTransition originX={tearOrigin.x} originY={tearOrigin.y} onComplete={() => navigate("/auth")} />}
    </div>
  );
}

export default StartPage;
