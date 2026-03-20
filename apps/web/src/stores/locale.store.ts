import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '../i18n/types';

interface LocaleState {
  readonly locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale: Locale) => set({ locale }),
    }),
    { name: 'context-sync-locale' },
  ),
);
