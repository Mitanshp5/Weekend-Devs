import { PageTransition } from "../components/PageTransition";

type PlaceholderPageProps = { eyebrow: string; title: string; description: string };

const capabilityFrames = [
  ["Evidence", "What PRISM can verify from learner attempts."],
  ["Decision", "Why a particular next step was selected."],
  ["Control", "Where a learner or teacher can review and redirect."],
] as const;

export function PlaceholderPage({ eyebrow, title, description }: PlaceholderPageProps) {
  return (
    <PageTransition className="dashboard-page">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="page-copy">{description}</p>
      <section className="workspace-grid" aria-label="PRISM workspace principles">
        {capabilityFrames.map(([label, detail], index) => (
          <article key={label}>
            <span>0{index + 1}</span>
            <h2>{label}</h2>
            <p>{detail}</p>
          </article>
        ))}
      </section>
    </PageTransition>
  );
}
