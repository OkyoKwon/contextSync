import type { ReactNode } from 'react';
import { SETTINGS_TABS, type SettingsTab } from './settings-tabs';

interface SettingsLayoutProps {
  readonly activeTab: SettingsTab;
  readonly onTabChange: (tab: SettingsTab) => void;
  readonly children: ReactNode;
}

const TAB_ICONS: Record<string, ReactNode> = {
  cog: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  users: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  puzzle: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
      />
    </svg>
  ),
  trash: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  ),
};

export function SettingsLayout({ activeTab, onTabChange, children }: SettingsLayoutProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Desktop sidebar */}
      <nav className="hidden w-48 shrink-0 md:block">
        <ul className="space-y-1">
          {SETTINGS_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDanger = tab.id === 'danger-zone';
            return (
              <li key={tab.id}>
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? isDanger
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-surface-hover text-text-primary'
                      : isDanger
                        ? 'text-red-400/70 hover:bg-red-500/5 hover:text-red-400'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  {TAB_ICONS[tab.icon]}
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile horizontal tab bar */}
      <nav className="overflow-x-auto md:hidden">
        <div className="flex gap-1 rounded-lg bg-surface p-1">
          {SETTINGS_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDanger = tab.id === 'danger-zone';
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? isDanger
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-surface-hover text-text-primary'
                    : isDanger
                      ? 'text-red-400/70 hover:text-red-400'
                      : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {TAB_ICONS[tab.icon]}
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content area */}
      <div className="min-w-0 flex-1">
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
