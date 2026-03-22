import { LandingNav } from '../components/landing/LandingNav';
import { LandingHero } from '../components/landing/LandingHero';
import { ProblemStatement } from '../components/landing/ProblemStatement';
import { FeatureShowcase } from '../components/landing/FeatureShowcase';
import { QuickStart } from '../components/landing/QuickStart';
import { HowItWorks } from '../components/landing/HowItWorks';
import { OpenSource } from '../components/landing/OpenSource';
import { LandingFooter } from '../components/landing/LandingFooter';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-page font-mono">
      <LandingNav />
      <LandingHero />
      <ProblemStatement />
      <FeatureShowcase />
      <QuickStart />
      <HowItWorks />
      <OpenSource />
      <LandingFooter />
    </div>
  );
}
