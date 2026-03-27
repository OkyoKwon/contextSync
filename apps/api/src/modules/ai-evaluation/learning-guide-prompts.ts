import type { AiEvaluationWithDetails } from '@context-sync/shared';

export const LEARNING_GUIDE_SYSTEM_PROMPT = `You are an AI learning coach. Based on multi-perspective evaluation results, create a personalized step-by-step learning roadmap.

## Input
You will receive evaluation results from up to 3 perspectives (Claude, ChatGPT, Gemini), each with dimension scores, strengths, weaknesses, and suggestions.

## Your Task
1. Identify the user's current overall proficiency level across perspectives
2. Determine the next realistic tier goal
3. Prioritize the weakest dimensions across all perspectives
4. Create 3-6 concrete learning steps, ordered from highest priority to lowest
5. For each step, recommend 2-4 real, accessible learning resources

## Resource Guidelines
- Recommend REAL, well-known resources that are likely to exist and be accessible
- Prioritize official documentation (OpenAI, Anthropic, Google AI docs)
- Include a mix of resource types: videos, articles, documentation, tutorials
- Match resource difficulty to the user's current level
- Prefer free resources; mark paid resources clearly
- Include estimated time for each resource

## Trusted Resource Domains
- platform.openai.com/docs
- docs.anthropic.com
- ai.google.dev/docs
- learnprompting.org
- promptingguide.ai
- youtube.com (well-known AI/tech channels)
- github.com (official repos, awesome-lists)
- microsoft.com/en-us/research
- arxiv.org (for advanced users only)

## Output Format
Respond ONLY with valid JSON:
{
  "currentTierSummary": "1-2 sentence summary of current level",
  "nextTierGoal": "1-2 sentence description of next tier goal",
  "priorityAreas": ["dimension_name_1", "dimension_name_2"],
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step title",
      "objective": "What the user will learn",
      "targetDimensions": ["dimension_name"],
      "keyActions": ["Specific action 1", "Specific action 2"],
      "resources": [
        {
          "title": "Resource title",
          "url": "https://...",
          "type": "video|article|documentation|tutorial|course|tool",
          "level": "beginner|intermediate|advanced",
          "description": "Why this resource helps",
          "estimatedMinutes": 30
        }
      ],
      "practicePrompt": "A concrete exercise prompt"
    }
  ]
}

## Guidelines
- Steps should be progressive: foundation → intermediate → advanced
- Each step should be completable independently (no hard dependencies)
- Include at least one practical exercise (practicePrompt) per step
- Be specific and actionable, not generic advice
- Encourage strengths while addressing weaknesses
- Maximum 6 steps, maximum 4 resources per step`;

export function buildLearningGuideUserMessage(perspectives: {
  readonly claude?: AiEvaluationWithDetails | null;
  readonly chatgpt?: AiEvaluationWithDetails | null;
  readonly gemini?: AiEvaluationWithDetails | null;
}): string {
  const sections: string[] = [
    'Here are the evaluation results for a user across multiple AI perspectives:',
  ];

  const perspectiveEntries = [
    { key: 'Claude', data: perspectives.claude },
    { key: 'ChatGPT', data: perspectives.chatgpt },
    { key: 'Gemini', data: perspectives.gemini },
  ] as const;

  for (const { key, data } of perspectiveEntries) {
    if (!data || data.status !== 'completed') continue;

    sections.push(
      `\n## ${key} Perspective (Overall: ${data.overallScore ?? 'N/A'}/100 — ${data.proficiencyTier ?? 'N/A'})`,
    );
    sections.push('Dimensions:');

    for (const dim of data.dimensions) {
      const weaknesses =
        dim.weaknesses.length > 0 ? ` — Weaknesses: ${JSON.stringify(dim.weaknesses)}` : '';
      const suggestions =
        dim.suggestions.length > 0 ? ` — Suggestions: ${JSON.stringify(dim.suggestions)}` : '';
      sections.push(`- ${dim.dimension}: ${dim.score}/100${weaknesses}${suggestions}`);
    }
  }

  sections.push('\nGenerate a personalized learning roadmap with 3-6 steps.');

  return sections.join('\n');
}
