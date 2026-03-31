import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router';
import { useAuthStore } from './stores/auth.store';
import { useOnboardingStatus } from './hooks/use-onboarding-status';
import { AppLayout } from './components/layout/AppLayout';
import { AppEntryRedirect } from './components/auth/AppEntryRedirect';
import { ConnectionError } from './components/auth/ConnectionError';

const OnboardingPage = lazy(() =>
  import('./pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ProjectPage = lazy(() =>
  import('./pages/ProjectPage').then((m) => ({ default: m.ProjectPage })),
);
const SessionDetailPage = lazy(() =>
  import('./pages/SessionDetailPage').then((m) => ({ default: m.SessionDetailPage })),
);
const ConflictsPage = lazy(() =>
  import('./pages/ConflictsPage').then((m) => ({ default: m.ConflictsPage })),
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const PrdAnalysisPage = lazy(() =>
  import('./pages/PrdAnalysisPage').then((m) => ({ default: m.PrdAnalysisPage })),
);
const PlansPage = lazy(() => import('./pages/PlansPage').then((m) => ({ default: m.PlansPage })));
const AiEvaluationPage = lazy(() =>
  import('./pages/AiEvaluationPage').then((m) => ({ default: m.AiEvaluationPage })),
);

function PageFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const status = useOnboardingStatus();

  if (!token) return <Navigate to="/onboarding" replace />;
  if (status === 'loading') return null;
  if (status === 'error') return <ConnectionError onRetry={() => window.location.reload()} />;
  if (status === 'needs-project') return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function SessionRedirect() {
  const { sessionId } = useParams<{ sessionId: string }>();
  return <Navigate to={`/project/sessions/${sessionId}`} replace />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<AppEntryRedirect />} />
        <Route path="/login" element={<Navigate to="/onboarding" replace />} />
        <Route path="/identify" element={<Navigate to="/onboarding" replace />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/project" element={<ProjectPage />} />
          <Route path="/project/sessions/:sessionId" element={<SessionDetailPage />} />
          <Route path="/sessions" element={<Navigate to="/project" replace />} />
          <Route path="/sessions/:sessionId" element={<SessionRedirect />} />
          <Route path="/local-sessions" element={<Navigate to="/project" replace />} />
          <Route path="/conflicts" element={<ConflictsPage />} />
          <Route path="/prd-analysis" element={<PrdAnalysisPage />} />
          <Route path="/ai-evaluation" element={<AiEvaluationPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/admin" element={<Navigate to="/settings?tab=integrations" replace />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/team" element={<Navigate to="/settings?tab=team" replace />} />
          <Route
            path="/settings/project"
            element={<Navigate to="/settings?tab=general" replace />}
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
