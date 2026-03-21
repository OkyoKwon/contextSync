import { useState, useCallback, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router';
import { useSearch } from '../../hooks/use-search';
import { useRecentSearches } from '../../hooks/use-recent-searches';
import { Spinner } from '../ui/Spinner';

interface SearchOverlayProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { searches: recentSearches, addSearch } = useRecentSearches();

  const { data, isLoading } = useSearch(query);
  const results = data?.data?.results ?? [];

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (sessionId: string, title: string) => {
      addSearch(title);
      onClose();
      navigate(`/sessions/${sessionId}`);
    },
    [navigate, onClose, addSearch],
  );

  const handleRecentClick = useCallback((search: string) => {
    setQuery(search);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-xl border border-border-default bg-surface shadow-2xl"
        style={{ animation: 'fadeIn 0.15s ease-out' }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        <div className="flex items-center gap-3 border-b border-border-default px-4 py-3">
          <svg
            className="h-5 w-5 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search sessions, messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          {isLoading && <Spinner size="sm" />}
          <kbd className="rounded border border-border-default bg-surface-hover px-1.5 py-0.5 text-[10px] text-text-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query && results.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Results
              </p>
              {results.slice(0, 8).map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result.sessionId, result.title)}
                  className="flex w-full items-start gap-3 px-4 py-2 text-left transition-colors hover:bg-surface-hover"
                >
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 2H4a2 2 0 00-2 2v12a2 2 0 002 2h3l3 3 3-3h7a2 2 0 002-2V4a2 2 0 00-2-2z"
                    />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">{result.title}</p>
                    <p
                      className="mt-0.5 truncate text-xs text-text-tertiary"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(result.highlight) }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}

          {query && results.length === 0 && !isLoading && (
            <div className="px-4 py-8 text-center text-sm text-text-muted">
              No results for &quot;{query}&quot;
            </div>
          )}

          {!query && recentSearches.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Recent
              </p>
              {recentSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => handleRecentClick(search)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-surface-hover"
                >
                  <svg
                    className="h-4 w-4 text-text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {search}
                </button>
              ))}
            </div>
          )}

          {!query && recentSearches.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-text-muted">
              Type to search sessions and messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
