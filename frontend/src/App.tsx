import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import "./App.css";
import { DashboardShell } from "./components/DashboardShell";
import { CatalogPage } from "./pages/CatalogPage";
import { DiagnosticPage } from "./pages/DiagnosticPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { StartPage } from "./pages/StartPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/diagnostic" element={<DiagnosticPage />} />
        <Route element={<DashboardShell />}>
          <Route path="/learn" element={<CatalogPage />} />
          <Route path="/lesson/:lessonId" element={<PlaceholderPage eyebrow="Lesson" title="Focused learning block" description="The active micro-lesson and embedded practice will live here." />} />
          <Route path="/tutor" element={<PlaceholderPage eyebrow="Doubt tutor" title="Ask for a hint, not just an answer" description="Grounded help, guided hints, and authored fallbacks will live here." />} />
          <Route path="/progress" element={<PlaceholderPage eyebrow="Mastery" title="See your evidence" description="Concept mastery, prerequisite gaps, and learning history will live here." />} />
          <Route path="/teacher" element={<PlaceholderPage eyebrow="Teacher dashboard" title="Intervention-ready insights" description="Learner clusters, misconceptions, and suggested interventions will live here." />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
