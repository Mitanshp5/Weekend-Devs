export type Subject = { slug: string; name: string; unit_count: number };
export type Unit = { slug: string; name: string; position: number; concept_count: number };
export type SubjectPath = { grade: number; subject: Pick<Subject, "slug" | "name">; units: Unit[] };

type CatalogResponse = { grade: number; subjects: Subject[] };

export async function getSubjects(grade: number): Promise<CatalogResponse> {
  const response = await fetch(`/api/catalog/subjects?grade=${grade}`);
  if (!response.ok) throw new Error("Unable to load curriculum catalog");
  return response.json() as Promise<CatalogResponse>;
}

export async function getSubjectPath(grade: number, subjectSlug: string): Promise<SubjectPath> {
  const response = await fetch(`/api/catalog/subjects/${subjectSlug}/units?grade=${grade}`);
  if (!response.ok) throw new Error("Unable to load subject learning path");
  return response.json() as Promise<SubjectPath>;
}
