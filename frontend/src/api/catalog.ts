export type Subject = { slug: string; name: string; unit_count: number };

type CatalogResponse = { grade: number; subjects: Subject[] };

export async function getSubjects(grade: number): Promise<CatalogResponse> {
  const response = await fetch(`/api/catalog/subjects?grade=${grade}`);
  if (!response.ok) throw new Error("Unable to load curriculum catalog");
  return response.json() as Promise<CatalogResponse>;
}
