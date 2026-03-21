import type { TranslationKeys } from '../types';

export const en: TranslationKeys = {
  // Nav
  'nav.login': 'Log In',

  // Hero
  'hero.title': 'The Hub for AI Session Context',
  'hero.subtitle': 'Manage your Claude Code sessions — solo or with your team',
  'hero.cta.login': 'Get Started',
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
  'problem.conclusion': 'Whether solo or in a team, ',
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
  'howItWorks.step.2.title': 'Scale',
  'howItWorks.step.2.description':
    "Start solo, then invite your team when you're ready. Role-based access and conflict detection built in.",

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

  // Docs
  'docs.hero.title': 'Learn how to get the most out of ContextSync',
  'docs.hero.subtitle':
    "Archive, sync, search, and detect conflicts across your team's Claude Code sessions",
  'docs.hero.highlight.0.title': 'Session Sync',
  'docs.hero.highlight.0.desc': 'Import and archive Claude Code sessions automatically',
  'docs.hero.highlight.1.title': 'Conflict Detection',
  'docs.hero.highlight.1.desc': 'Detect file conflicts before they become merge hell',
  'docs.hero.highlight.2.title': 'Full-Text Search',
  'docs.hero.highlight.2.desc': 'Search across all sessions, messages, and code changes',
  'docs.hero.cta': 'Get Started',
  'docs.toc.title': 'On this page',
  'docs.toc.gettingStarted': 'Getting Started',
  'docs.toc.features': 'Features',
  'docs.toc.faq': 'FAQ',
  'docs.gettingStarted.title': 'Getting Started',
  'docs.gettingStarted.step.0.title': 'Create a Project',
  'docs.gettingStarted.step.0.desc':
    'Enter a name and link your local working directory. Projects group all sessions, conflicts, and analytics in one place.',
  'docs.gettingStarted.step.1.title': 'Sync Your First Session',
  'docs.gettingStarted.step.1.desc':
    'Scan and import local Claude Code sessions. ContextSync reads your .claude/ directories and uploads conversations, file changes, and token usage.',
  'docs.gettingStarted.step.2.title': 'Explore the Dashboard',
  'docs.gettingStarted.step.2.desc':
    "View session stats, timeline, token usage charts, and hot files. The dashboard gives you a real-time overview of your team's AI activity.",
  'docs.gettingStarted.step.3.title': 'Invite Your Team',
  'docs.gettingStarted.step.3.desc':
    'Add collaborators with roles — Owner, Admin, or Member. Each role has different permissions for managing projects and sessions.',
  'docs.features.title': 'Features',
  'docs.features.learnMore': 'Learn more',
  'docs.features.0.title': 'Session Sync',
  'docs.features.0.summary':
    'Scans local .claude/ directories for sessions. Supports auto and manual import with sync status tracking.',
  'docs.features.0.detail':
    'Session sync reads your local Claude Code session files, extracts conversations and file changes, and uploads them to your project. You can trigger a manual scan or let ContextSync auto-detect new sessions. Each sync shows status (pending, syncing, synced, failed) so you always know where things stand.',
  'docs.features.1.title': 'Conflict Detection',
  'docs.features.1.summary':
    'Auto-detects when multiple team members edit the same files. Severity badges (info, warning, critical) and status flow tracking.',
  'docs.features.1.detail':
    'When two or more team members modify the same file in overlapping sessions, ContextSync flags a potential conflict. Conflicts are auto-classified by severity — info for low-risk, warning for moderate overlap, and critical for direct edits to the same code block. You can review, assign, and resolve conflicts through a structured workflow: detected → reviewing → resolved.',
  'docs.features.2.title': 'Dashboard',
  'docs.features.2.summary':
    'Today and weekly session counts, active conflicts, token usage charts, and hot file list at a glance.',
  'docs.features.2.detail':
    "The dashboard is your team's command center. It shows today's session count, weekly trends, active conflict alerts, token usage broken down by model, and a list of \"hot files\" — the files most frequently modified across sessions. Use it to spot bottlenecks and understand your team's AI usage patterns.",
  'docs.features.3.title': 'PRD Analysis',
  'docs.features.3.summary':
    'Upload PRD documents and let Claude analyze requirement fulfillment across your sessions.',
  'docs.features.3.detail':
    'Upload a PRD (Product Requirements Document) and ContextSync sends it to the Claude API for analysis. It extracts individual requirements and tracks how well your sessions address each one. You get a fulfillment percentage per requirement and an overall score, helping you ensure nothing falls through the cracks.',
  'docs.features.4.title': 'Plans',
  'docs.features.4.summary':
    'Create and view markdown plans with project associations for structured development workflows.',
  'docs.features.4.detail':
    'Plans let you write markdown documents that outline implementation strategies, architecture decisions, or task breakdowns. Each plan can be associated with a project, making it easy to find the planning context behind your sessions. Plans support full markdown rendering with code blocks, lists, and headings.',
  'docs.features.5.title': 'Search',
  'docs.features.5.summary':
    'Full-text search across all sessions and messages. Find any conversation or code change instantly.',
  'docs.features.5.detail':
    'ContextSync uses PostgreSQL full-text search with tsvector indexes on sessions and messages. Search by keyword, file path, or code snippet to find relevant conversations across your entire session history. Results are ranked by relevance and grouped by session for easy browsing.',
  'docs.features.6.title': 'Team Collaboration',
  'docs.features.6.summary':
    'Role-based access control with Owner, Admin, and Member roles. Invite collaborators and manage permissions.',
  'docs.features.6.detail':
    'Projects support three roles: Owner (full control including deletion), Admin (manage members and sessions), and Member (view and sync sessions). Invite teammates by GitHub username and manage roles from the Settings page. Activity feeds keep everyone informed about session syncs, conflicts, and resolution updates.',
  'docs.faq.title': 'Frequently Asked Questions',
  'docs.faq.0.q': 'What data does session sync collect?',
  'docs.faq.0.a':
    'Session sync reads your local .claude/ directory and collects conversation messages, file change metadata (paths and change types), token usage counts, and session timestamps. It does not upload your actual source code — only the Claude Code conversation and metadata about which files were modified.',
  'docs.faq.1.q': 'How do I resolve a detected conflict?',
  'docs.faq.1.a':
    'Navigate to the Conflicts page, click on the conflict to view details, then click "Start Review" to move it to reviewing status. After coordinating with your teammate, click "Resolve" to mark it as resolved. You can add notes during the review process.',
  'docs.faq.2.q': 'Does PRD analysis require an Anthropic API key?',
  'docs.faq.2.a':
    'Yes. PRD analysis uses the Claude API to extract and evaluate requirements. Set the ANTHROPIC_API_KEY environment variable on the server. Without it, the PRD analysis feature will not be available.',
  'docs.faq.3.q': 'What are the differences between team roles?',
  'docs.faq.3.a':
    'Owner: full project control including deletion and role management. Admin: manage members, sessions, and conflicts. Member: view data and sync their own sessions. All roles can search and browse sessions.',
  'docs.faq.4.q': 'What can I search for?',
  'docs.faq.4.a':
    'You can search across session titles, conversation messages, and file paths. The search uses PostgreSQL full-text indexing, so it supports natural language queries and partial matching. Use the search page or the global search bar in the navigation.',
  'docs.faq.5.q': 'Where are local sessions stored?',
  'docs.faq.5.a':
    'Claude Code stores session data in the .claude/ directory within your project root. ContextSync reads from this directory when you trigger a session scan. The data stays on your machine until you explicitly sync it to a project.',

  // Deploy Modes
  'deployModes.sectionLabel': '// Deploy Your Way',
  'deployModes.title': 'One Tool, Three Modes',
  'deployModes.subtitle': 'From solo archive to full team sync — pick the setup that fits',
  'deployModes.0.title': 'Personal',
  'deployModes.0.description': 'Solo developer, local everything',
  'deployModes.0.detail.0': 'Local Docker PostgreSQL — zero config',
  'deployModes.0.detail.1': 'Private session archive & search',
  'deployModes.0.detail.2': 'Token usage tracking & cost analysis',
  'deployModes.1.title': 'Team Host',
  'deployModes.1.description': 'Admin hosting a shared DB for the team',
  'deployModes.1.detail.0': 'SSL-enabled PostgreSQL with team roles',
  'deployModes.1.detail.1': 'Centralized migrations & access control',
  'deployModes.1.detail.2': 'Interactive setup wizard included',
  'deployModes.2.title': 'Team Member',
  'deployModes.2.description': 'Connect to your team — no Docker needed',
  'deployModes.2.detail.0': 'Point to the remote DB and run pnpm dev',
  'deployModes.2.detail.1': 'Full conflict detection & notifications',
  'deployModes.2.detail.2': 'Shared sessions, search, and dashboards',

  // Footer
  'footer.cta.title': 'Sync your AI workflow',
  'footer.cta.subtitle': 'Start for free. Run locally with Docker, or connect to a shared team DB.',
  'footer.cta.button': 'Get Started',
  'footer.link.docs': 'Docs',
  'footer.link.github': 'GitHub',
  'footer.link.contact': 'Contact',
};
