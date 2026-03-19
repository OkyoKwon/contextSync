import { useAuthStore } from '../../stores/auth.store';
import { Avatar } from '../ui/Avatar';
import { ProjectSelector } from './ProjectSelector';
import { SearchBar } from '../search/SearchBar';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <ProjectSelector />
        <SearchBar />
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2">
            <Avatar src={user.avatarUrl} name={user.name} size="sm" />
            <span className="text-sm text-gray-700">{user.name}</span>
          </div>
        )}
        <button
          onClick={logout}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
