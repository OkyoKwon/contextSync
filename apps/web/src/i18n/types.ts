export type Locale = 'en' | 'ko' | 'ja';

export type TranslationKey = keyof TranslationKeys;

export interface TranslationKeys {
  // App
  readonly 'app.loading': string;

  // Nav
  readonly 'nav.login': string;

  // Hero
  readonly 'hero.title': string;
  readonly 'hero.subtitle': string;
  readonly 'hero.cta.login': string;
  readonly 'hero.cta.features': string;

  // Problem Statement
  readonly 'problem.sectionLabel': string;
  readonly 'problem.solo.label': string;
  readonly 'problem.solo.prompt1': string;
  readonly 'problem.solo.output1': string;
  readonly 'problem.solo.output2': string;
  readonly 'problem.solo.prompt2': string;
  readonly 'problem.solo.output3': string;
  readonly 'problem.team.label': string;
  readonly 'problem.team.prompt1': string;
  readonly 'problem.team.output1': string;
  readonly 'problem.team.output2': string;
  readonly 'problem.team.prompt2': string;
  readonly 'problem.team.output3': string;
  readonly 'problem.team.output4': string;
  readonly 'problem.team.conflict': string;
  readonly 'problem.team.resolved': string;
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

  // Docs
  readonly 'docs.hero.title': string;
  readonly 'docs.hero.subtitle': string;
  readonly 'docs.hero.highlight.0.title': string;
  readonly 'docs.hero.highlight.0.desc': string;
  readonly 'docs.hero.highlight.1.title': string;
  readonly 'docs.hero.highlight.1.desc': string;
  readonly 'docs.hero.highlight.2.title': string;
  readonly 'docs.hero.highlight.2.desc': string;
  readonly 'docs.hero.cta': string;
  readonly 'docs.toc.title': string;
  readonly 'docs.toc.gettingStarted': string;
  readonly 'docs.toc.features': string;
  readonly 'docs.toc.faq': string;
  readonly 'docs.gettingStarted.title': string;
  readonly 'docs.gettingStarted.step.0.title': string;
  readonly 'docs.gettingStarted.step.0.desc': string;
  readonly 'docs.gettingStarted.step.1.title': string;
  readonly 'docs.gettingStarted.step.1.desc': string;
  readonly 'docs.gettingStarted.step.2.title': string;
  readonly 'docs.gettingStarted.step.2.desc': string;
  readonly 'docs.gettingStarted.step.3.title': string;
  readonly 'docs.gettingStarted.step.3.desc': string;
  readonly 'docs.features.title': string;
  readonly 'docs.features.learnMore': string;
  readonly 'docs.features.0.title': string;
  readonly 'docs.features.0.summary': string;
  readonly 'docs.features.0.detail': string;
  readonly 'docs.features.1.title': string;
  readonly 'docs.features.1.summary': string;
  readonly 'docs.features.1.detail': string;
  readonly 'docs.features.2.title': string;
  readonly 'docs.features.2.summary': string;
  readonly 'docs.features.2.detail': string;
  readonly 'docs.features.3.title': string;
  readonly 'docs.features.3.summary': string;
  readonly 'docs.features.3.detail': string;
  readonly 'docs.features.4.title': string;
  readonly 'docs.features.4.summary': string;
  readonly 'docs.features.4.detail': string;
  readonly 'docs.features.5.title': string;
  readonly 'docs.features.5.summary': string;
  readonly 'docs.features.5.detail': string;
  readonly 'docs.features.6.title': string;
  readonly 'docs.features.6.summary': string;
  readonly 'docs.features.6.detail': string;
  readonly 'docs.features.7.title': string;
  readonly 'docs.features.7.summary': string;
  readonly 'docs.features.7.detail': string;
  readonly 'docs.faq.title': string;
  readonly 'docs.faq.0.q': string;
  readonly 'docs.faq.0.a': string;
  readonly 'docs.faq.1.q': string;
  readonly 'docs.faq.1.a': string;
  readonly 'docs.faq.2.q': string;
  readonly 'docs.faq.2.a': string;
  readonly 'docs.faq.3.q': string;
  readonly 'docs.faq.3.a': string;
  readonly 'docs.faq.4.q': string;
  readonly 'docs.faq.4.a': string;
  readonly 'docs.faq.5.q': string;
  readonly 'docs.faq.5.a': string;

  // Upgrade
  readonly 'upgrade.modal.title': string;
  readonly 'upgrade.modal.description': string;
  readonly 'upgrade.modal.submit': string;
  readonly 'upgrade.banner': string;
  readonly 'upgrade.settings.title': string;
  readonly 'upgrade.settings.description': string;
  readonly 'upgrade.settings.benefit.invite': string;
  readonly 'upgrade.settings.benefit.notification': string;
  readonly 'upgrade.settings.benefit.multiDevice': string;
  readonly 'upgrade.settings.cta': string;

  // User Dropdown
  readonly 'user.localUser': string;
  readonly 'user.linkEmail': string;

  // App Entry
  readonly 'app.connectionError': string;
  readonly 'app.retry': string;

  // Login
  readonly 'login.backToHome': string;

  // Nav (additional)
  readonly 'nav.docs': string;
  readonly 'nav.github': string;

  // Hero (additional)
  readonly 'hero.cta.viewOnGithub': string;

  // Quick Start
  readonly 'quickstart.sectionLabel': string;
  readonly 'quickstart.title': string;
  readonly 'quickstart.prerequisites': string;
  readonly 'quickstart.copied': string;

  // Screenshot Alt
  readonly 'screenshot.alt.dashboard': string;
  readonly 'screenshot.alt.sessionConversation': string;
  readonly 'screenshot.alt.conflictsList': string;
  readonly 'screenshot.alt.prdAnalysis': string;
  readonly 'screenshot.alt.searchOverlay': string;
  readonly 'screenshot.alt.settingsTeam': string;
  readonly 'screenshot.alt.aiEvaluation': string;

  // Open Source
  readonly 'openSource.sectionLabel': string;
  readonly 'openSource.title': string;
  readonly 'openSource.subtitle': string;
  readonly 'openSource.license.title': string;
  readonly 'openSource.license.description': string;
  readonly 'openSource.community.title': string;
  readonly 'openSource.community.description': string;
  readonly 'openSource.contributors.title': string;
  readonly 'openSource.contributors.description': string;
  readonly 'openSource.cta.star': string;
  readonly 'openSource.cta.contributing': string;
  readonly 'openSource.cta.issues': string;

  // Hero (additional CTA)
  readonly 'hero.cta.getStarted': string;

  // Footer
  readonly 'footer.cta.title': string;
  readonly 'footer.cta.subtitle': string;
  readonly 'footer.cta.button': string;
  readonly 'footer.link.docs': string;
  readonly 'footer.link.github': string;
  readonly 'footer.link.contact': string;
  readonly 'footer.link.contributing': string;
  readonly 'footer.link.license': string;
}
