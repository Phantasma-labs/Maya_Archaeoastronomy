import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';

// Route-level code splitting (TECH_DEBT H3): LessonPage pulls in the whole
// three/drei/R3F stack via SceneCanvas. Lazy-loading the route keeps the
// landing page free of the 3D stack — the lesson chunk (and its GLB preload)
// only loads when the user navigates to /lesson/:id.
const LessonPage = lazy(() =>
  import('./pages/LessonPage').then((m) => ({ default: m.LessonPage }))
);

export const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/lesson/:lessonId" element={<LessonPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
