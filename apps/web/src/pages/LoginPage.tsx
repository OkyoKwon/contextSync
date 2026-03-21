import { useAuthStore } from '../stores/auth.store';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingHero } from '../components/landing/LandingHero';
import { ProblemStatement } from '../components/landing/ProblemStatement';
import { FeatureShowcase } from '../components/landing/FeatureShowcase';
import { DeployModes } from '../components/landing/DeployModes';
import { HowItWorks } from '../components/landing/HowItWorks';
import { TerminalDemo } from '../components/landing/TerminalDemo';
import { SocialProof } from '../components/landing/SocialProof';
import { LandingFooter } from '../components/landing/LandingFooter';

export function LoginPage() {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = token !== null;

  return (
    <div className="min-h-screen bg-page font-mono">
      <LandingNav isAuthenticated={isAuthenticated} />
      <LandingHero isAuthenticated={isAuthenticated} />
      <ProblemStatement />
      <FeatureShowcase />
      <DeployModes />
      <HowItWorks />
      <TerminalDemo />
      <SocialProof />
      <LandingFooter isAuthenticated={isAuthenticated} />
    </div>
  );
}
