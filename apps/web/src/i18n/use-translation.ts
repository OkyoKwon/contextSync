import { useCallback } from 'react';
import { useLocaleStore } from '../stores/locale.store';
import { translations } from './translations';
import type { TranslationKey } from './types';

export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  const dict = translations[locale];

  const t = useCallback((key: TranslationKey): string => dict[key], [dict]);

  return t;
}
