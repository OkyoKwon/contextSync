import { Link } from 'react-router';
import { useAuthStore } from '../../stores/auth.store';

export function ApiKeyMissingBanner() {
  const hasKey = useAuthStore((s) => s.user?.hasAnthropicApiKey ?? false);

  if (hasKey) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-yellow-400">&#9888;</span>
        <p className="text-sm text-yellow-300">
          Anthropic API Key is not configured. Please set your API Key to use this feature.
        </p>
      </div>
      <Link
        to="/settings"
        className="shrink-0 rounded-md bg-yellow-500/20 px-3 py-1.5 text-sm font-medium text-yellow-300 transition-colors hover:bg-yellow-500/30"
      >
        Go to Settings
      </Link>
    </div>
  );
}
