import { useState } from 'react';
import { useNavigate } from 'react-router';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../stores/auth.store';

export function DevLoginButton() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      const response = await authApi.devLogin();
      if (response.data) {
        setAuth(response.data.token, response.data.user);
        navigate('/onboarding');
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDevLogin}
      disabled={loading}
      className="flex cursor-pointer items-center gap-2 rounded-md border border-border-default px-6 py-3 font-mono text-sm text-text-secondary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
      {loading ? 'Signing in...' : 'Dev Login'}
    </button>
  );
}
