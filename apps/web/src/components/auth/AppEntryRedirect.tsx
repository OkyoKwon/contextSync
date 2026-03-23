import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '@/stores/auth.store';
import { useOnboardingStatus } from '@/hooks/use-onboarding-status';
import { authApi } from '@/api/auth.api';

export function AppEntryRedirect() {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    async function refreshUser() {
      try {
        const response = await authApi.getMe();
        if (cancelled) return;
        if (response.data) {
          setAuth(token!, response.data);
        }
      } catch {
        if (!cancelled) {
          logout();
        }
      }
    }
    refreshUser();
    return () => {
      cancelled = true;
    };
  }, [token, setAuth, logout]);

  if (!token) {
    return <Navigate to="/onboarding" replace />;
  }

  return <AuthenticatedRedirect />;
}

function AuthenticatedRedirect() {
  const status = useOnboardingStatus();

  if (status === 'loading') {
    return null;
  }
  if (status === 'needs-project') {
    return <Navigate to="/onboarding" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}
