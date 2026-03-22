import { db, daysAgo } from './helpers.js';

export async function seedAiEvaluation(
  projectId: string,
  userId: string,
  sessions: ReadonlyArray<{ id: string }>,
) {
  const evaluation = await db
    .insertInto('ai_evaluations')
    .values({
      project_id: projectId,
      target_user_id: userId,
      triggered_by_user_id: userId,
      status: 'completed',
      overall_score: 82,
      prompt_quality_score: 85,
      task_complexity_score: 78,
      iteration_pattern_score: 80,
      context_utilization_score: 88,
      ai_capability_leverage_score: 84,
      proficiency_tier: 'expert',
      sessions_analyzed: 8,
      messages_analyzed: 42,
      date_range_start: daysAgo(7),
      date_range_end: new Date(),
      model_used: 'claude-opus-4-20250514',
      input_tokens_used: 45000,
      output_tokens_used: 12000,
      improvement_summary:
        'Strong overall AI utilization with excellent context management. Main improvement area: provide more specific constraints in prompts to reduce iteration cycles.',
      completed_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  const dimensions = [
    {
      dimension: 'prompt_quality',
      score: 85,
      confidence: 90,
      summary:
        'Clear and well-structured prompts with specific requirements. Consistently provides context and constraints.',
      strengths: [
        'Provides clear acceptance criteria',
        'Includes relevant code context',
        'Uses examples effectively',
      ],
      weaknesses: ['Occasionally lacks edge case specification'],
      suggestions: [
        'Add more boundary conditions to prompts',
        'Specify error handling expectations upfront',
      ],
    },
    {
      dimension: 'task_complexity',
      score: 78,
      confidence: 85,
      summary:
        'Tackles moderately complex tasks including architectural decisions and multi-file refactoring.',
      strengths: ['Handles multi-file changes well', 'Good at breaking down complex tasks'],
      weaknesses: ['Could attempt more ambitious architectural changes'],
      suggestions: ['Try using AI for system design, not just implementation'],
    },
    {
      dimension: 'iteration_pattern',
      score: 80,
      confidence: 88,
      summary:
        'Efficient iteration pattern with good follow-up questions. Average 3.2 turns per task completion.',
      strengths: [
        'Builds on previous responses effectively',
        'Asks clarifying questions when needed',
      ],
      weaknesses: ['Sometimes restarts instead of building on context'],
      suggestions: ['Reference previous conversation context more explicitly'],
    },
    {
      dimension: 'context_utilization',
      score: 88,
      confidence: 92,
      summary:
        'Excellent use of project context, file references, and codebase knowledge in prompts.',
      strengths: [
        'Always references relevant files',
        'Provides existing code patterns',
        'Uses project-specific terminology',
      ],
      weaknesses: [],
      suggestions: ['Share test files alongside source files for better test generation'],
    },
    {
      dimension: 'ai_capability_leverage',
      score: 84,
      confidence: 87,
      summary: 'Good use of AI capabilities including code generation, review, and documentation.',
      strengths: [
        'Uses AI for both creation and review',
        'Leverages AI for test generation',
        'Multi-language support',
      ],
      weaknesses: ['Underutilizes AI for architectural analysis'],
      suggestions: [
        'Use AI for architecture decision records',
        'Try AI-assisted code review workflows',
      ],
    },
  ];

  for (let i = 0; i < dimensions.length; i++) {
    const d = dimensions[i]!;
    const dim = await db
      .insertInto('ai_evaluation_dimensions')
      .values({
        evaluation_id: evaluation.id,
        dimension: d.dimension,
        score: d.score,
        confidence: d.confidence,
        summary: d.summary,
        strengths: d.strengths,
        weaknesses: d.weaknesses,
        suggestions: d.suggestions,
        sort_order: i + 1,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Add evidence for each dimension
    if (sessions[0]) {
      await db
        .insertInto('ai_evaluation_evidence')
        .values({
          dimension_id: dim.id,
          session_id: sessions[0].id,
          excerpt:
            'JWT 인증 플로우를 구현해야 합니다. 로그인, 토큰 갱신, 보호 라우트 미들웨어를 포함해주세요.',
          sentiment: 'positive',
          annotation: 'Clear and specific prompt with well-defined scope',
          sort_order: 1,
        })
        .execute();
    }
  }
}
