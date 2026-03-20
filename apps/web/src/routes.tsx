import { Routes, Route, Navigate } from 'react-router';
import { useAuthStore } from './stores/auth.store';
import { useOnboardingStatus } from './hooks/use-onboarding-status';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SessionsPage } from './pages/SessionsPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { LocalSessionsPage } from './pages/LocalSessionsPage';
import { ConflictsPage } from './pages/ConflictsPage';
import { TeamSettingsPage } from './pages/TeamSettingsPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const status = useOnboardingStatus();

  if (!token) return <Navigate to="/login" replace />;
  if (status !== 'ready') return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
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
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="sessions/:sessionId" element={<SessionDetailPage />} />
        <Route path="local-sessions" element={<LocalSessionsPage />} />
        <Route path="conflicts" element={<ConflictsPage />} />
        <Route path="settings/team" element={<TeamSettingsPage />} />
        <Route path="settings/project" element={<ProjectSettingsPage />} />
      </Route>
    </Routes>
  );
}
