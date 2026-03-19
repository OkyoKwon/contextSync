import { Link } from 'react-router';
import { Badge } from '../ui/Badge';
import { timeAgo } from '../../lib/date';

interface SearchResult {
  readonly type: 'session' | 'message';
  readonly id: string;
  readonly sessionId: string;
  readonly title: string;
  readonly highlight: string;
  readonly createdAt: string;
}

interface SearchResultsProps {
  results: readonly SearchResult[];
}

export function SearchResults({ results }: SearchResultsProps) {
  if (results.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">No results found</p>;
  }

  return (
    <div className="space-y-2">
      {results.map((result) => (
        <Link
          key={result.id}
          to={`/sessions/${result.sessionId}`}
          className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <Badge variant={result.type === 'session' ? 'info' : 'default'}>
              {result.type}
            </Badge>
            <span className="text-sm font-medium text-gray-900">{result.title}</span>
            <span className="ml-auto text-xs text-gray-400">{timeAgo(result.createdAt)}</span>
          </div>
          <div
            className="mt-1 text-xs text-gray-600"
            dangerouslySetInnerHTML={{ __html: result.highlight }}
          />
        </Link>
      ))}
    </div>
  );
}
