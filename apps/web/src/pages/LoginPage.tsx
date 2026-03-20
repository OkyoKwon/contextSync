import { Navigate } from 'react-router';
import { useAuthStore } from '../stores/auth.store';
import { LoginHero } from '../components/auth/LoginHero';
import { FeatureCards } from '../components/auth/FeatureCards';

export function LoginPage() {
  const token = useAuthStore((s) => s.token);

  if (token) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-[#141414]">
      <header className="px-6 pt-6">
        <img src="/logo.png" alt="ContextSync" className="h-8" />
      </header>
      <div className="flex items-center justify-center pt-24 pb-16">
        <LoginHero />
      </div>
      <FeatureCards />
      <footer className="border-t border-zinc-800 bg-[#111111] px-6 py-8">
        <div className="mx-auto max-w-2xl text-center font-mono text-xs text-[#A1A1AA]/60">
          <span>&copy; {new Date().getFullYear()} ContextSync</span>
        </div>
      </footer>
    </div>
  );
}
