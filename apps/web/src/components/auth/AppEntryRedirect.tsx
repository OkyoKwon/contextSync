import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '@/stores/auth.store';
import { useOnboardingStatus } from '@/hooks/use-onboarding-status';
import { authApi } from '@/api/auth.api';

type EntryState = 'authenticated' | 'needs-identify';

export function AppEntryRedirect() {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [state] = useState<EntryState>(token ? 'authenticated' : 'needs-identify');

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
        // silently ignore — cached user is still usable
      }
    }
    refreshUser();
    return () => {
      cancelled = true;
    };
  }, [token, setAuth]);

  if (state === 'needs-identify') {
    return <Navigate to="/identify" replace />;
  }

  if (state === 'authenticated') {
    return <AuthenticatedRedirect />;
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    </div>
  );
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
