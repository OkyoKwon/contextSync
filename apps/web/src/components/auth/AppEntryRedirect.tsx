import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '@/stores/auth.store';
import { useOnboardingStatus } from '@/hooks/use-onboarding-status';
import { authApi } from '@/api/auth.api';
import { ConnectionError } from '@/components/auth/ConnectionError';

export function AppEntryRedirect() {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    async function refreshUser() {
      try {
        const response = await authApi.getMe();
        if (cancelled) return;
        setConnectionError(false);
        if (response.data) {
          setAuth(token!, response.data);
        }
      } catch (err) {
        if (cancelled) return;
        const isNetworkError =
          err instanceof TypeError || (err instanceof Error && !('statusCode' in err));
        if (isNetworkError) {
          setConnectionError(true);
        } else {
          logout();
        }
      }
    }
    refreshUser();
    return () => {
      cancelled = true;
    };
  }, [token, setAuth, logout]);

  if (connectionError) {
    return <ConnectionError onRetry={() => setConnectionError(false)} />;
  }

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
  if (status === 'error') {
    return <ConnectionError onRetry={() => window.location.reload()} />;
  }
  if (status === 'needs-project') {
    return <Navigate to="/onboarding" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}
