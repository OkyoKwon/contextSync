import { useQuery } from '@tanstack/react-query';
import { sessionsApi } from '../../api/sessions.api';

function shortPath(absolutePath: string): string {
  const home = absolutePath.match(/^\/Users\/[^/]+/)?.[0];
  if (home) {
    return absolutePath.replace(home, '~');
  }
  return absolutePath;
}

interface DirectoryPickerProps {
  readonly value: string | null;
  readonly onChange: (directory: string | null) => void;
}

export function DirectoryPicker({ value, onChange }: DirectoryPickerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['local-directories'],
    queryFn: () => sessionsApi.listLocalDirectories(),
  });

  const directories = data?.data ?? [];

  if (isLoading || directories.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-secondary">
        Link Local Directory
      </label>
      <div className="space-y-1">
        {directories.map((dir) => (
          <label
            key={dir.path}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
              value === dir.path
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-border-default hover:border-border-hover'
            }`}
          >
            <input
              type="radio"
              name="local-directory"
              checked={value === dir.path}
              onChange={() => onChange(dir.path)}
              className="accent-blue-500"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">
                {shortPath(dir.path)}
              </p>
              <p className="text-xs text-text-tertiary">
                {dir.sessionCount} session{dir.sessionCount !== 1 ? 's' : ''}
              </p>
            </div>
          </label>
        ))}
        <label
          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
            value === null
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-border-default hover:border-border-hover'
          }`}
        >
          <input
            type="radio"
            name="local-directory"
            checked={value === null}
            onChange={() => onChange(null)}
            className="accent-blue-500"
          />
          <p className="text-sm text-text-secondary">Don't link a directory</p>
        </label>
      </div>
    </div>
  );
}
