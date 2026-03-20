import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuthStore } from '../stores/auth.store';
import { Spinner } from '../components/ui/Spinner';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (!token || !userStr) {
      setError('Authentication failed - missing token');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setAuth(token, user);

      // Remove sensitive data from URL immediately
      window.history.replaceState({}, '', '/auth/callback');

      const { currentProjectId } = useAuthStore.getState();
      const destination = currentProjectId ? '/dashboard' : '/onboarding';
      navigate(destination, { replace: true });
    } catch {
      window.history.replaceState({}, '', '/auth/callback');
      setError('Authentication failed - invalid data');
    }
  }, [searchParams, setAuth, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
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
