import Anthropic from '@anthropic-ai/sdk';
import type { CodebaseSummary } from './codebase-scanner.js';
import { callWithRetry } from '../../lib/claude-utils.js';

export interface ParsedRequirement {
  readonly requirementText: string;
  readonly category: string | null;
  readonly status: 'achieved' | 'partial' | 'not_started';
  readonly confidence: number;
  readonly evidence: string | null;
  readonly filePaths: readonly string[];
}

export interface PrdAnalysisResult {
  readonly requirements: readonly ParsedRequirement[];
  readonly overallRate: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly modelUsed: string;
}

const SYSTEM_PROMPT = `You are a PRD (Product Requirements Document) analysis expert. Your task is to analyze a PRD against an actual codebase to determine the achievement rate of each requirement.

For each requirement found in the PRD:
1. Determine its implementation status: "achieved", "partial", or "not_started"
2. Provide a confidence score (0-100) for your assessment
3. Cite specific file paths and evidence from the codebase
4. Categorize the requirement (e.g., "Feature", "UI/UX", "Performance", "Security", "API", "Database", "Testing")

Respond ONLY with valid JSON in this exact format:
{
  "requirements": [
    {
      "requirementText": "The exact or summarized requirement text",
      "category": "Category name",
      "status": "achieved" | "partial" | "not_started",
      "confidence": 85,
      "evidence": "Brief explanation of why this status was assigned, referencing specific code",
      "filePaths": ["path/to/relevant/file.ts"]
    }
  ],
  "overallRate": 75.5
}

Guidelines:
- Extract ALL requirements from the PRD, including implicit ones
- "achieved" = fully implemented and working as described
- "partial" = some aspects implemented but incomplete
- "not_started" = no evidence of implementation
- overallRate = weighted average considering achieved=100%, partial=50%, not_started=0%
- Be thorough but concise in evidence
- Only reference file paths that exist in the provided file tree`;

export async function analyzePrd(
  apiKey: string,
  model: string,
  prdContent: string,
  codebaseSummary: CodebaseSummary,
): Promise<PrdAnalysisResult> {
  const client = new Anthropic({ apiKey });

  const codebaseContext = buildCodebaseContext(codebaseSummary);

  const userMessage = `## PRD Document

${prdContent}

## Codebase Information

### File Tree (${codebaseSummary.totalFiles} files, ${codebaseSummary.totalLines} lines)

\`\`\`
${codebaseSummary.fileTree}
\`\`\`

### Source Code

${codebaseContext}

Analyze the PRD against this codebase and return the JSON result.`;

  const response = await callWithRetry(client, model, SYSTEM_PROMPT, userMessage);

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const parsed = parseAnalysisResponse(text);

  return {
    ...parsed,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    modelUsed: model,
  };
}

function buildCodebaseContext(summary: CodebaseSummary): string {
  return summary.files
    .map((file) => `### ${file.path}\n\`\`\`\n${file.content}\n\`\`\``)
    .join('\n\n');
}

function parseAnalysisResponse(text: string): {
  requirements: readonly ParsedRequirement[];
  overallRate: number;
} {
  // Extract JSON from potential markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
  const jsonStr = (jsonMatch[1] ?? text).trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Failed to parse Claude API response as JSON: ${text.slice(0, 200)}`);
  }

  const result = parsed as {
    requirements?: unknown[];
    overallRate?: number;
  };

  if (!result.requirements || !Array.isArray(result.requirements)) {
    throw new Error('Claude API response missing "requirements" array');
  }

  const requirements: ParsedRequirement[] = result.requirements.map((req: unknown) => {
    const r = req as Record<string, unknown>;
    return {
      requirementText: String(r['requirementText'] ?? ''),
      category: r['category'] ? String(r['category']) : null,
      status: validateStatus(String(r['status'] ?? 'not_started')),
      confidence: Math.min(100, Math.max(0, Number(r['confidence'] ?? 0))),
      evidence: r['evidence'] ? String(r['evidence']) : null,
      filePaths: Array.isArray(r['filePaths']) ? (r['filePaths'] as unknown[]).map(String) : [],
    };
  });

  const overallRate =
    typeof result.overallRate === 'number'
      ? Math.min(100, Math.max(0, result.overallRate))
      : calculateOverallRate(requirements);

  return { requirements, overallRate };
}

function validateStatus(status: string): 'achieved' | 'partial' | 'not_started' {
  if (status === 'achieved' || status === 'partial' || status === 'not_started') {
    return status;
  }
  return 'not_started';
}

function calculateOverallRate(requirements: readonly ParsedRequirement[]): number {
  if (requirements.length === 0) return 0;

  const total = requirements.reduce((sum, req) => {
    if (req.status === 'achieved') return sum + 100;
    if (req.status === 'partial') return sum + 50;
    return sum;
  }, 0);

  return Math.round((total / requirements.length) * 100) / 100;
}
