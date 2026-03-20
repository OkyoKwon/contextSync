import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuthStore } from '../stores/auth.store';
import { Spinner } from '../components/ui/Spinner';

function parseCallback(searchParams: URLSearchParams) {
  const token = searchParams.get('token');
  const userStr = searchParams.get('user');

  if (!token || !userStr) {
    return { error: 'Authentication failed - missing token' } as const;
  }

  try {
    const user = JSON.parse(userStr);
    return { token, user } as const;
  } catch {
    return { error: 'Authentication failed - invalid data' } as const;
  }
}

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const result = useMemo(() => parseCallback(searchParams), [searchParams]);

  useEffect(() => {
    if ('error' in result) return;

    setAuth(result.token, result.user);

    // Remove sensitive data from URL immediately
    window.history.replaceState({}, '', '/auth/callback');

    const { currentProjectId } = useAuthStore.getState();
    const destination = currentProjectId ? '/dashboard' : '/onboarding';
    navigate(destination, { replace: true });
  }, [result, setAuth, navigate]);

  if ('error' in result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{result.error}</p>
          <a href="/login" className="mt-2 text-sm text-blue-600 underline">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
