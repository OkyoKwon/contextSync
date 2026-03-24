import { isToday, isThisWeek } from 'date-fns';

export type FilterType = 'all' | 'unsynced' | 'synced' | 'today' | 'this-week';
export type SortType = 'recent' | 'messages' | 'tokens';

interface SessionFiltersProps {
  readonly activeFilter: FilterType;
  readonly activeSort: SortType;
  readonly onFilterChange: (filter: FilterType) => void;
  readonly onSortChange: (sort: SortType) => void;
}

const FILTERS: readonly { readonly value: FilterType; readonly label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unsynced', label: 'Unsynced' },
  { value: 'synced', label: 'Synced' },
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This Week' },
];

const SORTS: readonly { readonly value: SortType; readonly label: string }[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'messages', label: 'Most Messages' },
  { value: 'tokens', label: 'Most Tokens' },
];

export function SessionFilters({
  activeFilter,
  activeSort,
  onFilterChange,
  onSortChange,
}: SessionFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onFilterChange(f.value)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              activeFilter === f.value
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-text-muted hover:bg-surface-hover hover:text-text-secondary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <select
        value={activeSort}
        onChange={(e) => onSortChange(e.target.value as SortType)}
        className="ml-auto rounded-md border border-border-input bg-page px-2 py-1 text-xs text-text-secondary"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function filterSession(
  session: { readonly isSynced: boolean; readonly lastModifiedAt: string },
  filter: FilterType,
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'unsynced':
      return !session.isSynced;
    case 'synced':
      return session.isSynced;
    case 'today':
      return isToday(new Date(session.lastModifiedAt));
    case 'this-week':
      return isThisWeek(new Date(session.lastModifiedAt));
  }
}

export function sortSessions<
  T extends {
    readonly lastModifiedAt: string;
    readonly messageCount: number;
    readonly totalTokens: number;
  },
>(sessions: readonly T[], sort: SortType): readonly T[] {
  return [...sessions].sort((a, b) => {
    switch (sort) {
      case 'recent':
        return new Date(b.lastModifiedAt).getTime() - new Date(a.lastModifiedAt).getTime();
      case 'messages':
        return b.messageCount - a.messageCount;
      case 'tokens':
        return b.totalTokens - a.totalTokens;
    }
  });
}
