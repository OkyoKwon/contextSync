import { Outlet, useNavigate } from 'react-router';
import { useCallback, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useKeyboardShortcuts } from '../../hooks/use-keyboard-shortcuts';
import type { KeyBinding } from '../../lib/keyboard';

export function AppLayout() {
  const navigate = useNavigate();

  const focusSearch = useCallback(() => {
    const searchButton = document.querySelector<HTMLButtonElement>(
      '[aria-label="Search sessions"]',
    );
    searchButton?.click();
  }, []);

  const bindings: readonly KeyBinding[] = useMemo(
    () => [
      { key: 'k', meta: true, description: 'Focus search', action: focusSearch },
      { key: '1', meta: true, description: 'Dashboard', action: () => navigate('/dashboard') },
      { key: '2', meta: true, description: 'Conversations', action: () => navigate('/project') },
      { key: '3', meta: true, description: 'Conflicts', action: () => navigate('/conflicts') },
      { key: '4', meta: true, description: 'PRD Tracker', action: () => navigate('/prd-analysis') },
      { key: '5', meta: true, description: 'Settings', action: () => navigate('/settings') },
    ],
    [navigate, focusSearch],
  );

  useKeyboardShortcuts(bindings);

  return (
    <div className="flex h-screen bg-page font-sans">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
