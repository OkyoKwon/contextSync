import { SearchBar } from '../search/SearchBar';
import { UserDropdown } from './UserDropdown';

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border-default bg-surface px-6">
      <div className="flex items-center gap-4">
        <SearchBar />
      </div>
      <UserDropdown />
    </header>
  );
}
