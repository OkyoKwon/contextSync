import { Navigate } from 'react-router';
import { useAuthStore } from '../stores/auth.store';
import { LoginHero } from '../components/auth/LoginHero';

export function LoginPage() {
  const token = useAuthStore((s) => s.token);

  if (token) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-6 font-mono">
      <LoginHero />
    </div>
  );
}
