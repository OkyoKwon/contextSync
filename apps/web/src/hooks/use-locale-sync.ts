import { useEffect } from 'react';
import { useLocaleStore } from '../stores/locale.store';

export function useLocaleSync() {
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);
}
