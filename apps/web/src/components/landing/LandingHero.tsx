import { CONTEXT_SYNC_ASCII, CONTEXT_SYNC_ASCII_COMPACT } from '../auth/login-ascii';
import { useT } from '../../i18n/use-translation';
import { BrowserFrame } from '../ui/BrowserFrame';
import { ScreenshotImage } from '../ui/ScreenshotImage';
import { assetUrl } from '@/lib/asset-url';

function ChevronDownIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function LandingHero() {
  const t = useT();

  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-16">
      <div className="flex flex-col items-center gap-8 font-mono">
        <pre
          className="hidden select-none text-text-primary leading-tight sm:block sm:text-[0.55rem] md:text-xs"
          aria-label="ContextSync"
        >
          {CONTEXT_SYNC_ASCII}
        </pre>
        <pre
          className="block select-none text-text-primary leading-tight text-[0.55rem] sm:hidden"
          aria-label="ContextSync"
        >
          {CONTEXT_SYNC_ASCII_COMPACT}
        </pre>

        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-lg font-medium text-text-primary md:text-xl">{t('hero.title')}</h1>
          <p className="text-sm whitespace-nowrap text-text-tertiary">{t('hero.subtitle')}</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://github.com/OkyoKwon/contextSync"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md bg-btn-primary-bg px-6 py-3 font-mono text-sm font-medium text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
            >
              {t('hero.cta.viewOnGithub')}
            </a>
          </div>
        </div>
      </div>

      <div className="group mt-12 w-full max-w-4xl [perspective:1200px]">
        <BrowserFrame className="transition-transform duration-500 [transform:rotateX(2deg)] group-hover:[transform:rotateX(0deg)]">
          <ScreenshotImage
            src={assetUrl('/screenshots/dashboard-full.png')}
            alt={t('screenshot.alt.dashboard')}
            className="w-full"
          />
        </BrowserFrame>
      </div>

      <button
        type="button"
        aria-label="Scroll down"
        onClick={() => scrollToSection('problem')}
        className="mt-16 animate-bounce cursor-pointer text-text-tertiary/60 transition-colors hover:text-text-tertiary"
      >
        <ChevronDownIcon />
      </button>
    </section>
  );
}
