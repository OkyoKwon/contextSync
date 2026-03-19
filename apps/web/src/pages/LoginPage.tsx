import { Navigate } from 'react-router';
import { useAuthStore } from '../stores/auth.store';
import { GitHubLoginButton } from '../components/auth/GitHubLoginButton';

export function LoginPage() {
  const token = useAuthStore((s) => s.token);

  if (token) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">ContextSync</h1>
          <p className="mt-2 text-sm text-gray-500">
            Team collaboration context management for Claude AI
          </p>
        </div>
        <GitHubLoginButton />
      </div>
    </div>
  );
}
