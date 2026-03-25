import { db, daysAgo } from './helpers.js';

interface EvalConfig {
  readonly targetIndex: number;
  readonly triggeredByIndex: number;
  readonly overall: number;
  readonly pq: number;
  readonly tc: number;
  readonly ip: number;
  readonly cu: number;
  readonly al: number;
  readonly tier: string;
  readonly sessionsAnalyzed: number;
  readonly messagesAnalyzed: number;
  readonly summary: string;
}

const EVAL_CONFIGS: readonly EvalConfig[] = [
  {
    targetIndex: 0, // Alex
    triggeredByIndex: 0,
    overall: 84,
    pq: 88,
    tc: 80,
    ip: 82,
    cu: 92,
    al: 78,
    tier: 'expert',
    sessionsAnalyzed: 8,
    messagesAnalyzed: 42,
    summary:
      'Strong overall AI utilization with excellent context management. Main improvement area: provide more specific constraints in prompts to reduce iteration cycles.',
  },
  {
    targetIndex: 1, // Sarah
    triggeredByIndex: 0,
    overall: 76,
    pq: 82,
    tc: 74,
    ip: 78,
    cu: 76,
    al: 70,
    tier: 'advanced',
    sessionsAnalyzed: 6,
    messagesAnalyzed: 28,
    summary:
      'Solid AI usage with good prompt structure. Could benefit from tackling more complex architectural tasks and leveraging AI for broader system design.',
  },
  {
    targetIndex: 3, // Emily
    triggeredByIndex: 0,
    overall: 68,
    pq: 72,
    tc: 68,
    ip: 70,
    cu: 74,
    al: 56,
    tier: 'proficient',
    sessionsAnalyzed: 5,
    messagesAnalyzed: 22,
    summary:
      'Good foundational AI skills with room to grow. Strongest in context utilization; should explore AI capabilities beyond code generation, such as testing and review workflows.',
  },
  {
    targetIndex: 4, // Jason
    triggeredByIndex: 0,
    overall: 42,
    pq: 48,
    tc: 38,
    ip: 52,
    cu: 44,
    al: 28,
    tier: 'developing',
    sessionsAnalyzed: 3,
    messagesAnalyzed: 10,
    summary:
      'Early-stage AI adoption showing promise. Focus on writing more specific prompts with clear acceptance criteria and providing code context for better results.',
  },
];

interface DimensionData {
  readonly dimension: string;
  readonly score: number;
  readonly confidence: number;
  readonly summary: string;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly suggestions: readonly string[];
}

function getDimensions(config: EvalConfig): readonly DimensionData[] {
  return [
    {
      dimension: 'prompt_quality',
      score: config.pq,
      confidence: Math.min(95, config.pq + 4),
      summary:
        config.pq >= 80
          ? 'Clear and well-structured prompts with specific requirements and code context.'
          : config.pq >= 60
            ? 'Adequate prompts but sometimes lacks specificity in requirements.'
            : 'Prompts tend to be vague; more structure and context would improve outcomes.',
      strengths:
        config.pq >= 70
          ? ['Provides clear acceptance criteria', 'Includes relevant code context']
          : ['Shows willingness to iterate on prompts'],
      weaknesses:
        config.pq >= 80
          ? ['Occasionally lacks edge case specification']
          : config.pq >= 60
            ? ['Missing boundary conditions', 'Could provide more code context']
            : [
                'Prompts are often too vague',
                'Rarely provides existing code for reference',
                'Missing acceptance criteria',
              ],
      suggestions:
        config.pq >= 80
          ? ['Add boundary conditions to prompts']
          : ['Include code snippets for context', 'Define expected output format upfront'],
    },
    {
      dimension: 'task_complexity',
      score: config.tc,
      confidence: Math.min(92, config.tc + 7),
      summary:
        config.tc >= 70
          ? 'Tackles moderately complex architectural tasks including multi-file refactoring.'
          : config.tc >= 50
            ? 'Handles routine implementation tasks well; could attempt more ambitious changes.'
            : 'Focuses on simple, isolated tasks. Should gradually increase complexity.',
      strengths:
        config.tc >= 70
          ? ['Handles multi-file changes well', 'Good at breaking down complex tasks']
          : ['Completes assigned tasks reliably'],
      weaknesses:
        config.tc >= 70
          ? ['Could attempt more ambitious architectural changes']
          : ['Avoids complex multi-file refactoring', 'Tends to stick to familiar patterns'],
      suggestions:
        config.tc >= 70
          ? ['Try using AI for system design']
          : ['Start with small multi-file changes', 'Use AI to explore unfamiliar codebases'],
    },
    {
      dimension: 'iteration_pattern',
      score: config.ip,
      confidence: Math.min(93, config.ip + 8),
      summary:
        config.ip >= 75
          ? `Efficient iteration pattern. Average ${(config.ip / 28).toFixed(1)} turns per task completion.`
          : `Iteration pattern has room for improvement. Sometimes restarts instead of building on context.`,
      strengths:
        config.ip >= 75
          ? ['Builds on previous responses effectively', 'Asks clarifying questions when needed']
          : ['Persistent in seeking solutions'],
      weaknesses:
        config.ip >= 75
          ? ['Sometimes restarts instead of building on context']
          : ['Often restarts conversations unnecessarily', 'Could reference prior context more'],
      suggestions: ['Reference previous conversation context explicitly'],
    },
    {
      dimension: 'context_utilization',
      score: config.cu,
      confidence: Math.min(96, config.cu + 3),
      summary:
        config.cu >= 80
          ? 'Excellent use of project context, file references, and codebase knowledge.'
          : config.cu >= 60
            ? 'Good context awareness; could improve by referencing more specific files and patterns.'
            : 'Limited use of project context. Should reference existing code patterns more.',
      strengths:
        config.cu >= 80
          ? ['Always references relevant files', 'Uses project-specific terminology']
          : config.cu >= 60
            ? ['References key files', 'Aware of project structure']
            : ['Basic awareness of project layout'],
      weaknesses:
        config.cu >= 80
          ? []
          : [
              'Misses opportunities to reference existing patterns',
              'Could share more file context',
            ],
      suggestions: ['Share test files alongside source files for better test generation'],
    },
    {
      dimension: 'ai_capability_leverage',
      score: config.al,
      confidence: Math.min(90, config.al + 5),
      summary:
        config.al >= 70
          ? 'Good use of AI capabilities including code generation, review, and documentation.'
          : config.al >= 50
            ? 'Uses AI primarily for code generation; underutilizes review and testing capabilities.'
            : 'Minimal use of AI capabilities. Significant room to explore beyond basic code generation.',
      strengths:
        config.al >= 70
          ? ['Uses AI for both creation and review', 'Leverages AI for test generation']
          : config.al >= 50
            ? ['Uses AI for code generation effectively']
            : ['Beginning to use AI for development'],
      weaknesses:
        config.al >= 70
          ? ['Underutilizes AI for architectural analysis']
          : ['Does not use AI for code review', 'Missing opportunities for AI-assisted testing'],
      suggestions:
        config.al >= 70
          ? ['Use AI for architecture decision records']
          : ['Try AI-assisted code review', 'Use AI to generate test cases'],
    },
  ];
}

export async function seedAiEvaluation(
  projectId: string,
  sessions: ReadonlyArray<{ id: string }>,
  users: ReadonlyArray<{ id: string }>,
) {
  for (const config of EVAL_CONFIGS) {
    const targetUserId = users[config.targetIndex]!.id;
    const triggeredByUserId = users[config.triggeredByIndex]!.id;

    const evaluation = await db
      .insertInto('ai_evaluations')
      .values({
        project_id: projectId,
        target_user_id: targetUserId,
        triggered_by_user_id: triggeredByUserId,
        status: 'completed',
        overall_score: config.overall,
        prompt_quality_score: config.pq,
        task_complexity_score: config.tc,
        iteration_pattern_score: config.ip,
        context_utilization_score: config.cu,
        ai_capability_leverage_score: config.al,
        proficiency_tier: config.tier,
        sessions_analyzed: config.sessionsAnalyzed,
        messages_analyzed: config.messagesAnalyzed,
        date_range_start: daysAgo(7),
        date_range_end: new Date(),
        model_used: 'claude-opus-4-20250514',
        input_tokens_used: 45000 + config.messagesAnalyzed * 500,
        output_tokens_used: 12000 + config.messagesAnalyzed * 200,
        improvement_summary: config.summary,
        completed_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const dimensions = getDimensions(config);

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
          strengths: [...d.strengths],
          weaknesses: [...d.weaknesses],
          suggestions: [...d.suggestions],
          sort_order: i + 1,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Evidence for first session of this user
      const sessionIdx =
        config.targetIndex === 0
          ? 0
          : config.targetIndex === 1
            ? 1
            : config.targetIndex === 3
              ? 3
              : 11;
      if (sessions[sessionIdx] && i === 0) {
        await db
          .insertInto('ai_evaluation_evidence')
          .values({
            dimension_id: dim.id,
            session_id: sessions[sessionIdx]!.id,
            excerpt:
              config.targetIndex === 0
                ? 'JWT 인증 플로우를 구현해야 합니다. 로그인, 토큰 갱신, 보호 라우트 미들웨어를 포함해주세요.'
                : config.targetIndex === 1
                  ? '팀원들이 같은 파일을 동시에 수정할 때 충돌을 감지하는 시스템이 필요합니다.'
                  : config.targetIndex === 3
                    ? '각 모듈에 흩어진 검증 로직을 Zod 스키마 기반 유틸리티로 추출해주세요.'
                    : '새 팀원이 처음 접속했을 때 보이는 온보딩 위자드를 만들어주세요.',
            sentiment: config.overall >= 70 ? 'positive' : 'neutral',
            annotation:
              config.overall >= 70
                ? 'Clear and specific prompt with well-defined scope'
                : 'Prompt could benefit from more specific requirements and context',
            sort_order: 1,
          })
          .execute();
      }
    }
  }
}
