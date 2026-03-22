import { useState } from 'react';
import { NavLink } from 'react-router';
import { ProjectSelector } from './ProjectSelector';
import { CreateProjectModal } from '../projects/CreateProjectModal';
import { useConflicts } from '../../hooks/use-conflicts';
import { useMyInvitations } from '../../hooks/use-invitations';
import { useCurrentProject } from '../../hooks/use-current-project';
import { useAdminConfig } from '../../hooks/use-admin';
import { useUiStore } from '../../stores/ui.store';
import { Tooltip } from '../ui/Tooltip';
import {
  DashboardIcon,
  ConversationsIcon,
  ConflictsIcon,
  PrdAnalysisIcon,
  AiEvaluationIcon,
  PlansIcon,
  AdminIcon,
  SettingsIcon,
  DocsIcon,
} from './sidebar-icons';

interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly icon: () => React.ReactNode;
  readonly badge?: number;
}

interface NavSection {
  readonly label: string;
  readonly items: readonly NavItem[];
}

export function Sidebar() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: projectData } = useCurrentProject();
  const isTeam = projectData?.data?.isTeam ?? false;
  const { data: conflictsData } = useConflicts({ status: 'detected' }, { enabled: isTeam });
  const activeConflictCount = conflictsData?.data?.length ?? 0;
  const { data: invitationsData } = useMyInvitations();
  const pendingInvitationCount = invitationsData?.data?.length ?? 0;
  const { data: adminConfig } = useAdminConfig();
  const isAdmin = adminConfig?.data?.deploymentMode === 'team-host';

  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  const sections: readonly NavSection[] = [
    {
      label: 'Core',
      items: [
        {
          to: '/dashboard',
          label: 'Dashboard',
          icon: DashboardIcon,
          badge: pendingInvitationCount,
        },
        { to: '/project', label: 'Conversations', icon: ConversationsIcon },
        { to: '/plans', label: 'Plans', icon: PlansIcon },
        ...(isTeam
          ? [
              {
                to: '/conflicts',
                label: 'Conflicts',
                icon: ConflictsIcon,
                badge: activeConflictCount,
              } as const,
            ]
          : []),
      ],
    },
    {
      label: 'Analysis',
      items: [
        { to: '/prd-analysis', label: 'PRD Tracker', icon: PrdAnalysisIcon },
        { to: '/ai-evaluation', label: 'AI Evaluation', icon: AiEvaluationIcon },
      ],
    },
    {
      label: 'System',
      items: [
        ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: AdminIcon } as const] : []),
        { to: '/settings', label: 'Settings', icon: SettingsIcon },
      ],
    },
  ];

  return (
    <aside
      className={`flex ${sidebarCollapsed ? 'w-16' : 'w-60'} flex-col border-r border-border-default bg-surface transition-all duration-200`}
    >
      <div className="flex h-14 items-center gap-2 border-b border-border-default px-4">
        <img src="/logo.png" alt="ContextSync" className="h-7 w-7 flex-shrink-0" />
        {!sidebarCollapsed && <h1 className="text-lg font-bold text-text-primary">ContextSync</h1>}
      </div>

      {!sidebarCollapsed && (
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v12m6-6H6"
                />
              </svg>
            </button>
          </div>
          <ProjectSelector />
        </div>
      )}

      <nav className="flex-1 overflow-y-auto p-3">
        {sections.map((section, sectionIdx) => (
          <div key={section.label} className={sectionIdx > 0 ? 'mt-4' : ''}>
            {!sidebarCollapsed && (
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                {section.label}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) =>
                sidebarCollapsed ? (
                  <Tooltip
                    key={item.to}
                    content={item.label}
                    position="bottom"
                    align="left"
                    width="w-auto"
                  >
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `relative flex items-center justify-center rounded-lg p-2 transition-colors ${
                          isActive
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'text-text-tertiary hover:bg-interactive-hover hover:text-text-primary'
                        }`
                      }
                    >
                      <item.icon />
                      {item.badge != null && item.badge > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </NavLink>
                  </Tooltip>
                ) : (
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
                ),
              )}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border-default p-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg p-2 text-text-tertiary transition-colors hover:bg-interactive-hover hover:text-text-primary"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`h-4 w-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>

      <div className="border-t border-border-default p-3">
        {sidebarCollapsed ? (
          <Tooltip content="Docs" position="bottom" align="left" width="w-auto">
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-lg p-2 text-text-tertiary transition-colors hover:bg-interactive-hover hover:text-text-primary"
            >
              <DocsIcon />
            </a>
          </Tooltip>
        ) : (
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-tertiary transition-colors hover:bg-interactive-hover hover:text-text-primary"
          >
            <DocsIcon />
            <span className="flex-1">Docs</span>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>
      <CreateProjectModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </aside>
  );
}
