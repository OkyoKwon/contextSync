import { Button } from '../ui/Button';

interface ConnectionErrorProps {
  readonly onRetry: () => void;
}

export function ConnectionError({ onRetry }: ConnectionErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <svg
            className="h-8 w-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-bold text-text-primary">Unable to connect to server</h2>
          <p className="mt-2 text-sm text-text-tertiary">
            The API server is not responding. Please check:
          </p>
        </div>

        <ul className="space-y-2 text-left text-sm text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-text-tertiary">1.</span>
            <span>
              Docker is running —{' '}
              <code className="rounded bg-surface-secondary px-1.5 py-0.5 text-xs text-text-tertiary">
                docker compose up -d
              </code>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-text-tertiary">2.</span>
            <span>
              Dev server is running —{' '}
              <code className="rounded bg-surface-secondary px-1.5 py-0.5 text-xs text-text-tertiary">
                pnpm dev
              </code>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-text-tertiary">3.</span>
            <span>
              Database is accessible (check{' '}
              <code className="rounded bg-surface-secondary px-1.5 py-0.5 text-xs text-text-tertiary">
                DATABASE_URL
              </code>{' '}
              in .env)
            </span>
          </li>
        </ul>

        <Button onClick={onRetry} variant="secondary" className="w-full">
          Retry connection
        </Button>
      </div>
    </div>
  );
}
