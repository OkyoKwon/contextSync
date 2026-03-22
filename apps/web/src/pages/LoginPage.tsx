import { Navigate } from 'react-router';
import { useAuthStore } from '../stores/auth.store';
import { LoginHero } from '../components/auth/LoginHero';
import { useT } from '../i18n/use-translation';

const SHOW_LANDING = import.meta.env.VITE_SHOW_LANDING === 'true';

export function LoginPage() {
  const token = useAuthStore((s) => s.token);
  const t = useT();

  if (token) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-6 font-mono">
      <LoginHero />
      {SHOW_LANDING && (
        <a
          href="/"
          className="mt-8 text-xs text-text-tertiary transition-colors hover:text-text-secondary"
        >
          {t('login.backToHome')}
        </a>
      )}
    </div>
  );
}
