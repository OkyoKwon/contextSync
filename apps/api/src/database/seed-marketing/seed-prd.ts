import { db, daysAgo } from './helpers.js';

export async function seedPrd(projectId: string, userId: string) {
  const doc = await db
    .insertInto('prd_documents')
    .values({
      project_id: projectId,
      user_id: userId,
      title: 'ContextSync v2.0 Requirements',
      content: `# ContextSync v2.0 Product Requirements

## 1. Session Management
- Auto-sync from ~/.claude/projects/
- Session metadata extraction (branch, files, tags)
- Multi-project session grouping
- Session status lifecycle (active → completed)

## 2. Conflict Detection
- Real-time file overlap detection
- Severity classification (info/warning/critical)
- Review workflow with assignee
- Auto-resolve for stale conflicts

## 3. Search
- Full-text search across sessions & messages
- File path + tag combined filtering

## 4. Dashboard
- Daily usage charts (7-day)
- Token usage breakdown by model
- Real-time activity feed (WebSocket)

## 5. PRD Analysis
- Claude-powered requirement extraction

## 6. Team Collaboration
- Role-based access (Owner / Member)
- Granular permissions (view/edit/admin)`,
      file_name: 'contextsync-v2-prd.md',
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  // 10 analyses over 10 days showing progress 38% → 82%
  const rates = [38, 42, 48, 55, 58, 64, 70, 74, 78, 82];
  const achieved = [5, 5, 6, 7, 8, 9, 10, 10, 11, 12];
  const partial = [2, 4, 4, 4, 3, 3, 3, 4, 3, 3];
  const notStarted = [9, 7, 6, 5, 5, 4, 3, 2, 2, 1];

  for (let i = 0; i < 10; i++) {
    const analysis = await db
      .insertInto('prd_analyses')
      .values({
        prd_document_id: doc.id,
        project_id: projectId,
        status: 'completed',
        overall_rate: rates[i]!,
        total_items: 16,
        achieved_items: achieved[i]!,
        partial_items: partial[i]!,
        not_started_items: notStarted[i]!,
        scanned_files_count: 18 + i * 3,
        model_used: 'claude-sonnet-4-20250514',
        input_tokens_used: 7200 + i * 420,
        output_tokens_used: 2800 + i * 200,
        created_at: daysAgo(9 - i),
        completed_at: daysAgo(9 - i),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Requirements for the latest analysis only
    if (i === 9) {
      await seedRequirements(analysis.id);
    }
  }
}

async function seedRequirements(analysisId: string) {
  const requirements = [
    // Session Management (4)
    {
      text: 'Auto-sync from ~/.claude/projects/',
      category: 'Session Management',
      status: 'achieved',
      confidence: 96,
      evidence: 'Auto-sync plugin found at src/plugins/auto-sync.ts with configurable interval',
      file_paths: [
        'src/plugins/auto-sync.ts',
        'src/modules/local-sessions/local-sessions.service.ts',
      ],
    },
    {
      text: 'Session metadata extraction (branch, files, tags)',
      category: 'Session Management',
      status: 'achieved',
      confidence: 94,
      evidence:
        'Session parser extracts branch, file_paths, tags, and module_names from Claude session data',
      file_paths: ['src/modules/sessions/sessions.service.ts'],
    },
    {
      text: 'Multi-project session grouping',
      category: 'Session Management',
      status: 'achieved',
      confidence: 91,
      evidence: 'Sessions are linked to projects via project_id foreign key with proper filtering',
      file_paths: ['src/modules/sessions/sessions.repository.ts'],
    },
    {
      text: 'Session status lifecycle (active → completed)',
      category: 'Session Management',
      status: 'achieved',
      confidence: 88,
      evidence: 'Status field supports active/completed transitions with timestamp tracking',
      file_paths: ['src/modules/sessions/sessions.service.ts'],
    },
    // Conflict Detection (4)
    {
      text: 'Real-time file overlap detection',
      category: 'Conflict Detection',
      status: 'achieved',
      confidence: 95,
      evidence: 'Conflict detector compares file_paths across active sessions in the same project',
      file_paths: ['src/modules/conflicts/conflicts.service.ts'],
    },
    {
      text: 'Severity classification (info/warning/critical)',
      category: 'Conflict Detection',
      status: 'achieved',
      confidence: 92,
      evidence:
        'Three severity levels implemented with automatic classification based on overlap scope',
      file_paths: ['src/modules/conflicts/conflicts.service.ts'],
    },
    {
      text: 'Review workflow with assignee',
      category: 'Conflict Detection',
      status: 'achieved',
      confidence: 85,
      evidence: 'reviewer_id and review_notes fields support assignment workflow',
      file_paths: ['src/modules/conflicts/conflicts.routes.ts'],
    },
    {
      text: 'Auto-resolve for stale conflicts',
      category: 'Conflict Detection',
      status: 'partial',
      confidence: 62,
      evidence:
        'Manual resolution exists but automatic stale conflict cleanup is not yet implemented',
      file_paths: ['src/modules/conflicts/conflicts.service.ts'],
    },
    // Search (2)
    {
      text: 'Full-text search across sessions & messages',
      category: 'Search',
      status: 'achieved',
      confidence: 97,
      evidence: 'PostgreSQL tsvector with GIN indexes on sessions and messages tables',
      file_paths: ['src/modules/search/search.service.ts'],
    },
    {
      text: 'File path + tag combined filtering',
      category: 'Search',
      status: 'partial',
      confidence: 58,
      evidence:
        'File path search works but combined tag + path filtering requires additional query logic',
      file_paths: ['src/modules/search/search.service.ts'],
    },
    // Dashboard (3)
    {
      text: 'Daily usage charts (7-day)',
      category: 'Dashboard',
      status: 'achieved',
      confidence: 90,
      evidence: 'Dashboard displays 7-day session count and activity trends with SVG charts',
      file_paths: ['apps/web/src/components/sessions/TokenUsagePanel.tsx'],
    },
    {
      text: 'Token usage breakdown by model',
      category: 'Dashboard',
      status: 'achieved',
      confidence: 87,
      evidence: 'Token usage repository aggregates by model_used with cost calculation',
      file_paths: ['src/modules/sessions/token-usage.repository.ts'],
    },
    {
      text: 'Real-time activity feed (WebSocket)',
      category: 'Dashboard',
      status: 'partial',
      confidence: 45,
      evidence: 'REST-based activity feed exists with polling; WebSocket upgrade not started',
      file_paths: ['src/modules/activity/activity.routes.ts'],
    },
    // PRD Analysis (1)
    {
      text: 'Claude-powered requirement extraction',
      category: 'PRD Analysis',
      status: 'achieved',
      confidence: 93,
      evidence:
        'Claude API integration extracts and classifies requirements from uploaded PRD documents',
      file_paths: ['src/modules/prd-analysis/prd.service.ts'],
    },
    // Team (2)
    {
      text: 'Role-based access (Owner / Member)',
      category: 'Team',
      status: 'achieved',
      confidence: 89,
      evidence: 'project_collaborators table with role column; assertAccess checks in services',
      file_paths: ['src/modules/projects/projects.service.ts'],
    },
    {
      text: 'Granular permissions (view/edit/admin)',
      category: 'Team',
      status: 'not_started',
      confidence: 22,
      evidence: 'Only Owner/Member roles exist; no granular permission matrix implemented',
      file_paths: [],
    },
  ];

  for (let j = 0; j < requirements.length; j++) {
    const r = requirements[j]!;
    await db
      .insertInto('prd_requirements')
      .values({
        prd_analysis_id: analysisId,
        requirement_text: r.text,
        category: r.category,
        status: r.status,
        confidence: r.confidence,
        evidence: r.evidence,
        file_paths: r.file_paths,
        sort_order: j + 1,
      })
      .execute();
  }
}
