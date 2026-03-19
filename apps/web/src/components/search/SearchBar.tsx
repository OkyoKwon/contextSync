import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useSearch } from '../../hooks/use-search';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const { data } = useSearch(query);
  const results = data?.data?.results ?? [];

  const handleSelect = useCallback(
    (sessionId: string) => {
      setIsOpen(false);
      setQuery('');
      navigate(`/sessions/${sessionId}`);
    },
    [navigate],
  );

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search sessions..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="w-64 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
      />
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-1 w-96 rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.slice(0, 8).map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result.sessionId)}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
            >
              <div className="font-medium text-gray-900">{result.title}</div>
              <div
                className="mt-0.5 text-xs text-gray-500"
                dangerouslySetInnerHTML={{ __html: result.highlight }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
