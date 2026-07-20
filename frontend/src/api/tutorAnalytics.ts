/**
 * Tutor Analytics API client — typed fetch helpers for tutor, progress, and teacher endpoints.
 *
 * Following vercel-react-best-practices: no barrel file, direct imports,
 * early return on errors, and typed responses.
 */

const API_BASE = "/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MasteryState {
  concept_id: string;
  p_know: number;
  evidence_count: number;
  independent_correct_count: number;
  recent_error_tags: string[];
  uncertainty: string;
  hint_used: boolean;
  created_at: string;
  band: string;
  learner_message: string;
  teacher_message: string;
}

export interface ProgressResponse {
  learner_id: string;
  concepts: MasteryState[];
}

export interface TimelineEntry extends MasteryState {
  id: number;
}

export interface ConceptEvidenceResponse {
  learner_id: string;
  concept_id: string;
  timeline: TimelineEntry[];
}

export interface TutorResponse {
  response_mode: string;
  message: string;
  concept_ids: string[];
  citation_ids: string[];
  confidence: string;
  next_action: string;
  safety_flags: string[];
  is_fallback: boolean;
  is_correct?: boolean;
  p_know?: number;
}

export interface QuestionSummary {
  id: string;
  concept_id: string;
  prompt: string;
  difficulty: number;
  answer_type?: string;
  options?: string[];
}

export interface CohortResponse {
  grade: number;
  total_learners: number;
  band_distribution: Record<string, number>;
  top_clusters: ClusterData[];
  intervention_recommendations: StudentCardData[];
}

export interface StudentCardData {
  learner_id: string;
  grade?: number;
  band: string;
  current_path: string | null;
  current_target_concept: string | null;
  likely_blocker_concept: string | null;
  blocker_confidence: number | null;
  evidence_summary: string | null;
  recommended_action: string | null;
  pending_sync_count: number;
  updated_at?: string;
}

export interface ClusterData {
  error_tag: string;
  concept_id: string;
  affected_count: number;
  total_active: number;
  recent_incorrect_rate: number;
  repeat_error_rate: number;
  trend_growth: number;
  impact_score: number;
  suggested_intervention: string | null;
  updated_at?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Progress endpoints
// ---------------------------------------------------------------------------

export function fetchProgress(learnerId: string): Promise<ProgressResponse> {
  return fetchJSON(`/progress/${learnerId}`);
}

export function fetchConceptEvidence(
  learnerId: string,
  conceptId: string,
): Promise<ConceptEvidenceResponse> {
  return fetchJSON(`/progress/${learnerId}/concept/${conceptId}`);
}

// ---------------------------------------------------------------------------
// Tutor endpoints
// ---------------------------------------------------------------------------

export function fetchTutorFallback(
  questionId: string,
  attempt: number,
  errorTag?: string,
): Promise<TutorResponse> {
  const params = new URLSearchParams({ attempt: String(attempt) });
  if (errorTag) params.set("error_tag", errorTag);
  return fetchJSON(`/tutor/fallback/${questionId}?${params}`);
}

export function postTutorRespond(body: {
  learner_id: string;
  question_id: string;
  attempt_number: number;
  learner_answer?: string;
  error_tag?: string;
}): Promise<TutorResponse> {
  return fetchJSON("/tutor/respond", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function fetchQuestions(): Promise<{ questions: QuestionSummary[] }> {
  return fetchJSON("/tutor/questions");
}

// ---------------------------------------------------------------------------
// Teacher endpoints
// ---------------------------------------------------------------------------

export function fetchCohort(grade: number = 8): Promise<CohortResponse> {
  return fetchJSON(`/teacher/cohort?grade=${grade}`);
}

export function fetchStudentCard(learnerId: string): Promise<StudentCardData> {
  return fetchJSON(`/teacher/student/${learnerId}`);
}

export function fetchClusters(
  grade: number = 8,
): Promise<{ grade: number; clusters: ClusterData[] }> {
  return fetchJSON(`/teacher/clusters?grade=${grade}`);
}

// ---------------------------------------------------------------------------
// Learner endpoints
// ---------------------------------------------------------------------------

export interface DemoLearner {
  id: number;
  name: string;
  description: string;
}

export interface LearnerProgress {
  learner_id: number;
  learner_name: string | null;
  questions_attempted: number;
  questions_correct: number;
  hints_used: number;
  concepts_covered: number;
  avg_mastery: number;
  strong_topics: string[];
  weak_topics: string[];
}

export function fetchLearners(): Promise<{ learners: DemoLearner[] }> {
  return fetchJSON("/learners");
}

export function fetchLearnerProgress(learnerId: number): Promise<LearnerProgress> {
  return fetchJSON(`/learners/${learnerId}/progress`);
}

// ---------------------------------------------------------------------------
// Guidance endpoints
// ---------------------------------------------------------------------------

export interface GuidanceResponse {
  question_type: string;
  message: string;
  details: Record<string, unknown>;
}

export function postGuidance(body: {
  learner_id: string;
  question_type: string;
  subject?: string;
}): Promise<GuidanceResponse> {
  return fetchJSON("/tutor/guidance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
