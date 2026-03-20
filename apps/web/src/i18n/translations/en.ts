import type { TranslationKeys } from '../types';

export const en: TranslationKeys = {
  // Nav
  'nav.login': 'GitHub Login',

  // Hero
  'hero.title': 'The Hub for AI Session Context',
  'hero.subtitle':
    "Archive, sync, search, and detect conflicts across your team's Claude Code sessions",
  'hero.cta.github': 'Continue with GitHub',
  'hero.cta.features': 'Explore Features',

  // Problem Statement
  'problem.sectionLabel': '// Why ContextSync',
  'problem.terminal.prompt1': 'claude "refactor the auth module"',
  'problem.terminal.output1': '→ Modifying src/auth/middleware.ts...',
  'problem.terminal.output2': '→ Modifying src/auth/session.ts...',
  'problem.terminal.prompt2': 'claude "improve session management logic"',
  'problem.terminal.output3': '→ Modifying src/auth/session.ts...',
  'problem.terminal.output4': '→ Modifying src/auth/token.ts...',
  'problem.terminal.conflict': '⚠ CONFLICT: src/auth/session.ts — 2 devs working simultaneously',
  'problem.terminal.resolved': '✓ Conflict pre-detected — notifications sent to dev-A, dev-B',
  'problem.conclusion': 'When teams work with AI, ',
  'problem.conclusionHighlight': 'context sync is essential',
  'problem.conclusionEnd': '',

  // Features
  'features.sectionLabel': '// Features',
  'features.hero.0.title': 'Session Archive & Sync',
  'features.hero.0.description': 'Turn sessions into team knowledge assets',
  'features.hero.0.detail.0': 'Automatic Claude Code session collection & archiving',
  'features.hero.0.detail.1': 'Project-based session grouping & timeline',
  'features.hero.0.detail.2': 'Full-text search across messages',
  'features.hero.0.detail.3': 'Token usage & cost analysis dashboard',
  'features.hero.1.title': 'Conflict Detection',
  'features.hero.1.description': 'Detect conflicts before merge',
  'features.hero.1.detail.0': 'Real-time detection of teammates editing the same file',
  'features.hero.1.detail.1': 'Auto-classified severity (Critical / High / Medium / Low)',
  'features.hero.1.detail.2': 'Per-file and per-module conflict heatmap',
  'features.hero.1.detail.3': 'Instant notifications to teammates',
  'features.hero.2.title': 'PRD Analysis',
  'features.hero.2.description': 'AI-powered requirement fulfillment tracking',
  'features.hero.2.detail.0': 'Upload PRD docs & auto-extract requirements',
  'features.hero.2.detail.1': 'Auto-calculate fulfillment rate from session conversations',
  'features.hero.2.detail.2': 'Detailed per-requirement status tracking',
  'features.hero.2.detail.3': 'Trend charts & change-rate reports',
  'features.sub.0.title': 'Dashboard & Analytics',
  'features.sub.0.description':
    "Real-time timeline and stats showing your entire team's AI activity at a glance",
  'features.sub.1.title': 'Full-text Search',
  'features.sub.1.description':
    'Instantly search conversations across thousands of sessions. Filter by message, file, or code',
  'features.sub.2.title': 'Team Collaboration',
  'features.sub.2.description':
    'Role-based access control (Owner / Admin / Member). Invite teammates & share projects',
  'features.sub.3.title': 'Local Session Sync',
  'features.sub.3.description':
    'Share local Claude Code sessions with your team in one click. Auto project matching',

  // How It Works
  'howItWorks.sectionLabel': '// How It Works',
  'howItWorks.step.0.title': 'Import',
  'howItWorks.step.0.description':
    'Sync local Claude Code sessions to your project. One-click upload with auto project matching.',
  'howItWorks.step.1.title': 'Analyze',
  'howItWorks.step.1.description':
    'Automatic conflict detection, PRD fulfillment analysis, and token usage tracking.',
  'howItWorks.step.2.title': 'Collaborate',
  'howItWorks.step.2.description':
    'Share sessions with teammates, prevent conflicts proactively, and build team knowledge.',

  // Social Proof
  'social.sectionLabel': '// By the Numbers',
  'social.stat.0.label': 'Teams',
  'social.stat.1.label': 'Sessions Archived',
  'social.stat.2.label': 'Conflicts Prevented',
  'social.stat.3.label': 'Avg. Fulfillment Rate',
  'social.testimonial.0.quote':
    '"Losing Claude Code sessions was our biggest fear — now our entire team history is searchable."',
  'social.testimonial.0.author': '— Frontend Lead, Startup A',
  'social.testimonial.1.quote':
    '"Merge hell from simultaneous edits dropped dramatically. Conflict detection is the key feature."',
  'social.testimonial.1.author': '— CTO, Startup B',

  // Terminal Demo
  'demo.sectionLabel': '// Terminal Demo',
  'demo.scanning': '⠋ Scanning local sessions...',
  'demo.found': '✓ 3 new sessions found',
  'demo.uploaded': '✓ Upload complete — 1,247 messages, 34 file changes',
  'demo.conflict1': '⚠ src/auth/session.ts — dev-A, dev-B working simultaneously',
  'demo.conflict2': '⚠ src/api/routes.ts — dev-A, dev-C working simultaneously',
  'demo.notified': '→ Notifications sent to affected teammates.',

  // Footer
  'footer.cta.title': "Sync your team's AI workflow",
  'footer.cta.subtitle': 'Start for free. No installation — just a GitHub account.',
  'footer.cta.button': 'Continue with GitHub',
  'footer.link.docs': 'Docs',
  'footer.link.github': 'GitHub',
  'footer.link.contact': 'Contact',
};
