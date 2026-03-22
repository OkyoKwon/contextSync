import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '@/stores/auth.store';
import { useOnboardingStatus } from '@/hooks/use-onboarding-status';
import { authApi } from '@/api/auth.api';
import { useT } from '@/i18n/use-translation';

type EntryState = 'checking' | 'logging-in' | 'authenticated' | 'error';

export function AppEntryRedirect() {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [state, setState] = useState<EntryState>(token ? 'authenticated' : 'checking');
  const t = useT();

  const attemptAutoLogin = useCallback(async () => {
    setState('logging-in');
    try {
      const response = await authApi.autoLogin();
      if (response.data) {
        setAuth(response.data.token, response.data.user);
        setState('authenticated');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }, [setAuth]);

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

    async function doAutoLogin() {
      setState('logging-in');
      try {
        const response = await authApi.autoLogin();
        if (cancelled) return;
        if (response.data) {
          setAuth(response.data.token, response.data.user);
          setState('authenticated');
        } else {
          setState('error');
        }
      } catch {
        if (!cancelled) setState('error');
      }
    }

    doAutoLogin();
    return () => {
      cancelled = true;
    };
  }, [token, setAuth]);

  if (state === 'error') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-red-500/10 p-3">
            <svg
              className="h-6 w-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <p className="text-sm text-text-secondary">{t('app.connectionError')}</p>
          <button
            type="button"
            onClick={attemptAutoLogin}
            className="rounded-md bg-btn-primary-bg px-4 py-2 text-sm font-medium text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
          >
            {t('app.retry')}
          </button>
        </div>
      </div>
    );
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
