import { useLocaleStore } from '../../stores/locale.store';
import type { Locale } from '../../i18n/types';

const LOCALES: readonly { readonly value: Locale; readonly label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'ko', label: 'KO' },
  { value: 'ja', label: 'JA' },
];

export function LanguageSwitcher() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setLocale(value)}
          className={`cursor-pointer rounded px-2 py-1 font-mono text-xs transition-colors ${
            locale === value
              ? 'font-medium text-text-primary'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
