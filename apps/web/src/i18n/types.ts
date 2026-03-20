export type Locale = 'en' | 'ko' | 'ja';

export type TranslationKey = keyof TranslationKeys;

export interface TranslationKeys {
  // Nav
  readonly 'nav.login': string;

  // Hero
  readonly 'hero.title': string;
  readonly 'hero.subtitle': string;
  readonly 'hero.cta.github': string;
  readonly 'hero.cta.features': string;

  // Problem Statement
  readonly 'problem.sectionLabel': string;
  readonly 'problem.terminal.prompt1': string;
  readonly 'problem.terminal.output1': string;
  readonly 'problem.terminal.output2': string;
  readonly 'problem.terminal.prompt2': string;
  readonly 'problem.terminal.output3': string;
  readonly 'problem.terminal.output4': string;
  readonly 'problem.terminal.conflict': string;
  readonly 'problem.terminal.resolved': string;
  readonly 'problem.conclusion': string;
  readonly 'problem.conclusionHighlight': string;
  readonly 'problem.conclusionEnd': string;

  // Features
  readonly 'features.sectionLabel': string;
  readonly 'features.hero.0.title': string;
  readonly 'features.hero.0.description': string;
  readonly 'features.hero.0.detail.0': string;
  readonly 'features.hero.0.detail.1': string;
  readonly 'features.hero.0.detail.2': string;
  readonly 'features.hero.0.detail.3': string;
  readonly 'features.hero.1.title': string;
  readonly 'features.hero.1.description': string;
  readonly 'features.hero.1.detail.0': string;
  readonly 'features.hero.1.detail.1': string;
  readonly 'features.hero.1.detail.2': string;
  readonly 'features.hero.1.detail.3': string;
  readonly 'features.hero.2.title': string;
  readonly 'features.hero.2.description': string;
  readonly 'features.hero.2.detail.0': string;
  readonly 'features.hero.2.detail.1': string;
  readonly 'features.hero.2.detail.2': string;
  readonly 'features.hero.2.detail.3': string;
  readonly 'features.sub.0.title': string;
  readonly 'features.sub.0.description': string;
  readonly 'features.sub.1.title': string;
  readonly 'features.sub.1.description': string;
  readonly 'features.sub.2.title': string;
  readonly 'features.sub.2.description': string;
  readonly 'features.sub.3.title': string;
  readonly 'features.sub.3.description': string;

  // How It Works
  readonly 'howItWorks.sectionLabel': string;
  readonly 'howItWorks.step.0.title': string;
  readonly 'howItWorks.step.0.description': string;
  readonly 'howItWorks.step.1.title': string;
  readonly 'howItWorks.step.1.description': string;
  readonly 'howItWorks.step.2.title': string;
  readonly 'howItWorks.step.2.description': string;

  // Social Proof
  readonly 'social.sectionLabel': string;
  readonly 'social.stat.0.label': string;
  readonly 'social.stat.1.label': string;
  readonly 'social.stat.2.label': string;
  readonly 'social.stat.3.label': string;
  readonly 'social.testimonial.0.quote': string;
  readonly 'social.testimonial.0.author': string;
  readonly 'social.testimonial.1.quote': string;
  readonly 'social.testimonial.1.author': string;

  // Terminal Demo
  readonly 'demo.sectionLabel': string;
  readonly 'demo.scanning': string;
  readonly 'demo.found': string;
  readonly 'demo.uploaded': string;
  readonly 'demo.conflict1': string;
  readonly 'demo.conflict2': string;
  readonly 'demo.notified': string;

  // Footer
  readonly 'footer.cta.title': string;
  readonly 'footer.cta.subtitle': string;
  readonly 'footer.cta.button': string;
  readonly 'footer.link.docs': string;
  readonly 'footer.link.github': string;
  readonly 'footer.link.contact': string;
}
