export type SettingsTab = 'general' | 'team' | 'integrations' | 'danger-zone';

export const SETTINGS_TABS = [
  { id: 'general' as const, label: 'General', icon: 'cog' },
  { id: 'team' as const, label: 'Team', icon: 'users' },
  { id: 'integrations' as const, label: 'Integrations', icon: 'puzzle' },
  { id: 'danger-zone' as const, label: 'Danger Zone', icon: 'trash' },
] as const;

export const DEFAULT_TAB: SettingsTab = 'general';

export function isValidTab(tab: string | null): tab is SettingsTab {
  return tab !== null && SETTINGS_TABS.some((t) => t.id === tab);
}
