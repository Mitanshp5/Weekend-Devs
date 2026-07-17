type PlaceholderPageProps = { eyebrow: string; title: string; description: string };

export function PlaceholderPage({ eyebrow, title, description }: PlaceholderPageProps) {
  return <section className="dashboard-page"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-copy">{description}</p><div className="placeholder-grid"><article>Data connection pending</article><article>Interaction states pending</article><article>Curriculum selection pending</article></div></section>;
}
