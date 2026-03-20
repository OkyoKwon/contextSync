import { LandingNav } from '../components/landing/LandingNav';
import { LandingFooter } from '../components/landing/LandingFooter';
import { DocsSidebar, MobileTocButton } from '../components/docs/DocsSidebar';
import { DocsHero } from '../components/docs/DocsHero';
import { GettingStartedSection } from '../components/docs/GettingStartedSection';
import { FeatureSection } from '../components/docs/FeatureSection';
import { FaqSection } from '../components/docs/FaqSection';

export function DocsPage() {
  return (
    <div className="min-h-screen bg-page font-mono" style={{ scrollBehavior: 'smooth' }}>
      <LandingNav />
      <div className="mx-auto flex max-w-5xl gap-10 px-6 pt-24">
        <DocsSidebar />
        <main className="min-w-0 flex-1">
          <DocsHero />
          <GettingStartedSection />
          <FeatureSection />
          <FaqSection />
        </main>
      </div>
      <MobileTocButton />
      <LandingFooter />
    </div>
  );
}
