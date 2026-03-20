import { Routes, Route, Navigate, useParams } from 'react-router';
import { useAuthStore } from './stores/auth.store';
import { useOnboardingStatus } from './hooks/use-onboarding-status';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectPage } from './pages/ProjectPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { ConflictsPage } from './pages/ConflictsPage';
import { SettingsPage } from './pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const status = useOnboardingStatus();

  if (!token) return <Navigate to="/login" replace />;
  if (status === 'loading') return null;
  if (status === 'needs-project') return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function SessionRedirect() {
  const { sessionId } = useParams<{ sessionId: string }>();
  return <Navigate to={`/project/sessions/${sessionId}`} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="project" element={<ProjectPage />} />
        <Route path="project/sessions/:sessionId" element={<SessionDetailPage />} />
        <Route path="sessions" element={<Navigate to="/project" replace />} />
        <Route path="sessions/:sessionId" element={<SessionRedirect />} />
        <Route path="local-sessions" element={<Navigate to="/project" replace />} />
        <Route path="conflicts" element={<ConflictsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/team" element={<Navigate to="/settings" replace />} />
        <Route path="settings/project" element={<Navigate to="/settings" replace />} />
      </Route>
    </Routes>
  );
}
