import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '@/stores/auth.store';
import { useOnboardingStatus } from '@/hooks/use-onboarding-status';
import { authApi } from '@/api/auth.api';
import { useT } from '@/i18n/use-translation';

type EntryState = 'checking' | 'logging-in' | 'authenticated' | 'failed';

export function AppEntryRedirect() {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [state, setState] = useState<EntryState>(token ? 'authenticated' : 'checking');
  const t = useT();

  useEffect(() => {
    let cancelled = false;

    if (token) {
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
    }

    async function attemptAutoLogin() {
      setState('logging-in');
      try {
        const response = await authApi.autoLogin();
        if (cancelled) return;
        if (response.data) {
          setAuth(response.data.token, response.data.user);
          setState('authenticated');
        } else {
          setState('failed');
        }
      } catch {
        if (!cancelled) setState('failed');
      }
    }

    attemptAutoLogin();
    return () => {
      cancelled = true;
    };
  }, [token, setAuth]);

  if (state === 'failed') {
    return <Navigate to="/login" replace />;
  }

  if (state === 'authenticated') {
    return <AuthenticatedRedirect />;
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span className="text-sm text-text-tertiary">{t('app.loading')}</span>
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
