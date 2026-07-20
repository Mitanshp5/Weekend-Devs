import { AnimatePresence, MotionConfig } from "motion/react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";

import "./App.css";
import { DashboardShell } from "./components/DashboardShell";
import { CatalogPage } from "./pages/CatalogPage";
import { DiagnosticPage } from "./pages/DiagnosticPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { ProgressPage } from "./pages/ProgressPage";
import { TeacherDashboardPage } from "./pages/TeacherDashboardPage";
import { TutorPage } from "./pages/TutorPage";
import { StartPage } from "./pages/StartPage";
import { SubjectPathPage } from "./pages/SubjectPathPage";

function AppRoutes() {
  const location = useLocation();
  const isDashboard = location.pathname !== "/" && location.pathname !== "/diagnostic";
  const rootKey = isDashboard ? "dashboard" : location.pathname;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={rootKey}>
        <Route path="/" element={<StartPage />} />
        <Route path="/diagnostic" element={<DiagnosticPage />} />
        <Route element={<DashboardShell />}>
          <Route path="/learn" element={<CatalogPage />} />
          <Route path="/learn/:subjectSlug" element={<SubjectPathPage />} />
          <Route path="/lesson/:lessonId" element={<PlaceholderPage eyebrow="Lesson" title="Focused learning block" description="The active micro-lesson and embedded practice will live here." />} />
          <Route path="/tutor" element={<TutorPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/teacher" element={<TeacherDashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </MotionConfig>
  );
}
