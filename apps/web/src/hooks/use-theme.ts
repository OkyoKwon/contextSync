import { useEffect } from 'react';
import { useThemeStore } from '../stores/theme.store';

export function useThemeSync() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
}
