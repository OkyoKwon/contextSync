import { useState } from 'react';
import { SearchOverlay } from './SearchOverlay';

export function SearchBar() {
  const [overlayKey, setOverlayKey] = useState(0);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const handleOpen = () => {
    setOverlayKey((k) => k + 1);
    setIsOverlayOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Search sessions"
        className="flex w-64 items-center justify-between rounded-lg border border-border-input bg-page px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-blue-500/50"
      >
        <span>Search sessions...</span>
        <kbd className="rounded border border-border-default bg-surface-hover px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
          ⌘K
        </kbd>
      </button>
      {isOverlayOpen && (
        <SearchOverlay key={overlayKey} isOpen onClose={() => setIsOverlayOpen(false)} />
      )}
    </>
  );
}
