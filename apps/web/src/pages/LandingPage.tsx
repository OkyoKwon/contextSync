import { LandingNav } from '../components/landing/LandingNav';
import { LandingHero } from '../components/landing/LandingHero';
import { ProblemStatement } from '../components/landing/ProblemStatement';
import { FeatureShowcase } from '../components/landing/FeatureShowcase';
import { QuickStart } from '../components/landing/QuickStart';
import { DeployModes } from '../components/landing/DeployModes';
import { HowItWorks } from '../components/landing/HowItWorks';
import { TerminalDemo } from '../components/landing/TerminalDemo';
import { TechStack } from '../components/landing/TechStack';
import { SocialProof } from '../components/landing/SocialProof';
import { Contributing } from '../components/landing/Contributing';
import { LandingFooter } from '../components/landing/LandingFooter';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-page font-mono">
      <LandingNav />
      <LandingHero />
      <ProblemStatement />
      <FeatureShowcase />
      <QuickStart />
      <DeployModes />
      <HowItWorks />
      <TerminalDemo />
      <TechStack />
      <SocialProof />
      <Contributing />
      <LandingFooter />
    </div>
  );
}
