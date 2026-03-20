interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
      <p className="mb-2 text-sm text-red-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-red-400 underline hover:text-red-300"
        >
          Retry
        </button>
      )}
    </div>
  );
}
