export type EvalContentLang = 'en' | 'ko';

interface EvalLanguageToggleProps {
  value: EvalContentLang;
  onChange: (lang: EvalContentLang) => void;
}

export function EvalLanguageToggle({ value, onChange }: EvalLanguageToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-border-default bg-surface-secondary p-0.5">
      <button
        type="button"
        onClick={() => onChange('en')}
        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
          value === 'en'
            ? 'bg-surface-primary text-text-primary shadow-sm'
            : 'text-text-tertiary hover:text-text-secondary'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onChange('ko')}
        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
          value === 'ko'
            ? 'bg-surface-primary text-text-primary shadow-sm'
            : 'text-text-tertiary hover:text-text-secondary'
        }`}
      >
        KO
      </button>
    </div>
  );
}
