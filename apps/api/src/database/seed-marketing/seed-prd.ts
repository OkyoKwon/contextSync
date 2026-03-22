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
- Users can import local Claude Code sessions
- Sessions are grouped by project
- Full conversation history is preserved
- File path tracking per session

## 2. Conflict Detection
- Auto-detect file overlaps between team sessions
- Severity classification (critical/warning/info)
- Reviewer assignment workflow
- Slack/email notifications

## 3. Search
- Full-text search across all sessions
- Filter by file path, message content, tags
- Relevance-ranked results

## 4. Dashboard
- Daily session count and trends
- Token usage by model with cost analysis
- Team activity timeline
- Hot files ranking

## 5. PRD Analysis
- Document upload and requirement extraction
- Auto-calculate fulfillment rate
- Trend tracking over time

## 6. Team Collaboration
- Role-based access (Owner/Admin/Member)
- Email invitation system
- Activity feed per project`,
      file_name: 'contextsync-v2-prd.md',
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  // 7 analyses over 7 days showing progress
  const rates = [45, 52, 62, 68, 71, 74, 78];
  const achieved = [5, 6, 7, 8, 8, 9, 9];
  const partial = [2, 2, 2, 1, 2, 1, 2];
  const notStarted = [5, 4, 3, 3, 2, 2, 1];

  for (let i = 0; i < 7; i++) {
    const analysis = await db
      .insertInto('prd_analyses')
      .values({
        prd_document_id: doc.id,
        project_id: projectId,
        status: 'completed',
        overall_rate: rates[i]!,
        total_items: 12,
        achieved_items: achieved[i]!,
        partial_items: partial[i]!,
        not_started_items: notStarted[i]!,
        scanned_files_count: 24 + i * 3,
        model_used: 'claude-sonnet-4-20250514',
        input_tokens_used: 8000 + i * 500,
        output_tokens_used: 3000 + i * 200,
        created_at: daysAgo(6 - i),
        completed_at: daysAgo(6 - i),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Requirements for the latest analysis only
    if (i === 6) {
      await seedRequirements(analysis.id);
    }
  }
}

async function seedRequirements(analysisId: string) {
  const requirements = [
    {
      text: 'Users can import local Claude Code sessions',
      category: 'Session Management',
      status: 'achieved',
      confidence: 95,
    },
    {
      text: 'Sessions are grouped by project',
      category: 'Session Management',
      status: 'achieved',
      confidence: 98,
    },
    {
      text: 'Full conversation history is preserved',
      category: 'Session Management',
      status: 'achieved',
      confidence: 92,
    },
    {
      text: 'File path tracking per session',
      category: 'Session Management',
      status: 'achieved',
      confidence: 90,
    },
    {
      text: 'Auto-detect file overlaps between team sessions',
      category: 'Conflict Detection',
      status: 'achieved',
      confidence: 88,
    },
    {
      text: 'Severity classification (critical/warning/info)',
      category: 'Conflict Detection',
      status: 'achieved',
      confidence: 95,
    },
    {
      text: 'Reviewer assignment workflow',
      category: 'Conflict Detection',
      status: 'achieved',
      confidence: 85,
    },
    {
      text: 'Slack/email notifications for conflicts',
      category: 'Conflict Detection',
      status: 'partial',
      confidence: 60,
    },
    {
      text: 'Full-text search across all sessions',
      category: 'Search',
      status: 'achieved',
      confidence: 93,
    },
    {
      text: 'Token usage by model with cost analysis',
      category: 'Dashboard',
      status: 'achieved',
      confidence: 91,
    },
    {
      text: 'Auto-calculate PRD fulfillment rate',
      category: 'PRD Analysis',
      status: 'partial',
      confidence: 55,
    },
    {
      text: 'Email invitation system for team members',
      category: 'Team Collaboration',
      status: 'not_started',
      confidence: 20,
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
        evidence: r.status === 'achieved' ? 'Implementation found in codebase with tests' : null,
        file_paths: [],
        sort_order: j + 1,
      })
      .execute();
  }
}
