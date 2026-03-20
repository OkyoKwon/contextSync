export function AnalyzingOverlay() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border-default bg-surface p-12">
      <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
      <h3 className="text-lg font-semibold text-text-primary">Analyzing PRD</h3>
      <p className="mt-2 text-sm text-text-tertiary">
        Scanning codebase and evaluating requirements...
      </p>
      <p className="mt-1 text-xs text-text-tertiary">
        This may take 15-60 seconds depending on codebase size
      </p>
    </div>
  );
}
