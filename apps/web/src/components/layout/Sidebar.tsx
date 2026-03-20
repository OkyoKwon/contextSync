import { useState } from 'react';
import { NavLink } from 'react-router';
import { ProjectSelector } from './ProjectSelector';
import { CreateProjectModal } from '../projects/CreateProjectModal';
import { useConflicts } from '../../hooks/use-conflicts';

interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly icon: () => React.ReactNode;
  readonly badge?: number;
}

export function Sidebar() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: conflictsData } = useConflicts({ status: 'detected' });
  const activeConflictCount = conflictsData?.data?.length ?? 0;

  const navItems: readonly NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { to: '/project', label: 'Conversations', icon: ConversationsIcon },
    { to: '/conflicts', label: 'Conflicts', icon: ConflictsIcon, badge: activeConflictCount },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="flex w-60 flex-col border-r border-border-default bg-surface">
      <div className="flex h-14 items-center gap-2 border-b border-border-default px-4">
        <img src="/logo.png" alt="ContextSync" className="h-7 w-7" />
        <h1 className="text-lg font-bold text-text-primary">ContextSync</h1>
      </div>
      <div className="border-b border-border-default p-3">
        <div className="mb-2 flex items-center justify-between px-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Projects
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex h-5 w-5 items-center justify-center rounded text-text-tertiary transition-colors hover:bg-interactive-hover hover:text-text-primary"
            title="Create project"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
            </svg>
          </button>
        </div>
        <ProjectSelector />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-text-tertiary hover:bg-interactive-hover hover:text-text-primary'
              }`
            }
          >
            <item.icon />
            <span className="flex-1">{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/20 px-1.5 text-xs font-semibold text-red-400">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </aside>
  );
}

function DashboardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function ConversationsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 2H4a2 2 0 00-2 2v12a2 2 0 002 2h3l3 3 3-3h7a2 2 0 002-2V4a2 2 0 00-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9h8M8 13h5" />
    </svg>
  );
}

function ConflictsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
