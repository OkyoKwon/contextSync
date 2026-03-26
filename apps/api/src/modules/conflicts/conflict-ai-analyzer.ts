import Anthropic from '@anthropic-ai/sdk';
import type {
  Conflict,
  Session,
  Message,
  AiVerdict,
  AiOverlapType,
  AiRecommendation,
  ConflictOverviewAnalysis,
} from '@context-sync/shared';
import { AI_VERDICTS, AI_OVERLAP_TYPES, AI_RECOMMENDATIONS } from '@context-sync/shared';
import { callWithRetry } from '../../lib/claude-utils.js';

const MAX_MESSAGES_PER_SESSION = 10;
const MAX_CHARS_PER_MESSAGE = 1500;
const MAX_TOTAL_CHARS = 60_000;

export interface ConflictAnalysisResult {
  readonly verdict: AiVerdict;
  readonly confidence: number;
  readonly overlapType: AiOverlapType;
  readonly summary: string;
  readonly riskAreas: readonly string[];
  readonly recommendation: AiRecommendation;
  readonly recommendationDetail: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly modelUsed: string;
}

export async function analyzeConflict(
  apiKey: string,
  model: string,
  sessionA: Session,
  messagesA: readonly Message[],
  sessionB: Session,
  messagesB: readonly Message[],
  conflict: Conflict,
): Promise<ConflictAnalysisResult> {
  const client = new Anthropic({ apiKey });

  const sampledA = sampleSessionMessages(messagesA);
  const sampledB = sampleSessionMessages(messagesB);
  const userMessage = buildConflictAnalysisPrompt(sessionA, sampledA, sessionB, sampledB, conflict);

  const response = await callWithRetry(client, model, SYSTEM_PROMPT, userMessage, 1, 2048);

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const parsed = parseConflictAnalysisResponse(text);

  return {
    ...parsed,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    modelUsed: model,
  };
}

export function sampleSessionMessages(messages: readonly Message[]): readonly Message[] {
  if (messages.length <= MAX_MESSAGES_PER_SESSION) {
    return truncateMessages(messages);
  }

  const half = Math.floor(MAX_MESSAGES_PER_SESSION / 2);
  const first = messages.slice(0, half);
  const last = messages.slice(-half);
  return truncateMessages([...first, ...last]);
}

function truncateMessages(messages: readonly Message[]): readonly Message[] {
  let totalChars = 0;
  const result: Message[] = [];

  for (const msg of messages) {
    const truncatedContent =
      msg.content.length > MAX_CHARS_PER_MESSAGE
        ? msg.content.slice(0, MAX_CHARS_PER_MESSAGE) + '...[truncated]'
        : msg.content;
    totalChars += truncatedContent.length;
    if (totalChars > MAX_TOTAL_CHARS) break;
    result.push({ ...msg, content: truncatedContent });
  }

  return result;
}

function buildConflictAnalysisPrompt(
  sessionA: Session,
  messagesA: readonly Message[],
  sessionB: Session,
  messagesB: readonly Message[],
  conflict: Conflict,
): string {
  const formatMessages = (msgs: readonly Message[]) =>
    msgs.map((m, i) => `### Message ${i + 1} [${m.role}]\n${m.content}`).join('\n\n');

  return `## Conflict Context

- Conflict Type: ${conflict.conflictType}
- Current Severity: ${conflict.severity}
- Overlapping Files: ${conflict.overlappingPaths.join(', ')}

## Session A — ${sessionA.userName ?? 'User A'}

- Title: ${sessionA.title}
- Branch: ${sessionA.branch ?? 'unknown'}
- File Paths: ${sessionA.filePaths.join(', ')}
- Modules: ${sessionA.moduleNames?.join(', ') ?? 'N/A'}
- Created: ${sessionA.createdAt}

### Messages (${messagesA.length} sampled)

${formatMessages(messagesA)}

## Session B — ${sessionB.userName ?? 'User B'}

- Title: ${sessionB.title}
- Branch: ${sessionB.branch ?? 'unknown'}
- File Paths: ${sessionB.filePaths.join(', ')}
- Modules: ${sessionB.moduleNames?.join(', ') ?? 'N/A'}
- Created: ${sessionB.createdAt}

### Messages (${messagesB.length} sampled)

${formatMessages(messagesB)}

위 두 세션을 분석하여 실제 작업 충돌 여부를 판단하고 JSON으로 응답하세요.`;
}

function parseConflictAnalysisResponse(text: string): {
  readonly verdict: AiVerdict;
  readonly confidence: number;
  readonly overlapType: AiOverlapType;
  readonly summary: string;
  readonly riskAreas: readonly string[];
  readonly recommendation: AiRecommendation;
  readonly recommendationDetail: string;
} {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
  const jsonStr = (jsonMatch[1] ?? text).trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Failed to parse conflict analysis response as JSON: ${text.slice(0, 200)}`);
  }

  const result = parsed as Record<string, unknown>;

  const verdict = validateEnum(
    String(result['verdict'] ?? ''),
    AI_VERDICTS,
    'low_risk' as AiVerdict,
  );
  const overlapType = validateEnum(
    String(result['overlapType'] ?? ''),
    AI_OVERLAP_TYPES,
    'independent' as AiOverlapType,
  );
  const recommendation = validateEnum(
    String(result['recommendation'] ?? ''),
    AI_RECOMMENDATIONS,
    'no_action' as AiRecommendation,
  );

  return {
    verdict,
    confidence: clamp(Number(result['confidence'] ?? 50), 0, 100),
    overlapType,
    summary: String(result['summary'] ?? ''),
    riskAreas: Array.isArray(result['riskAreas'])
      ? (result['riskAreas'] as unknown[]).map(String)
      : [],
    recommendation,
    recommendationDetail: String(result['recommendationDetail'] ?? ''),
  };
}

function validateEnum<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

// ── Overview Analysis ──

export async function analyzeConflictOverview(
  apiKey: string,
  model: string,
  conflicts: readonly Conflict[],
): Promise<ConflictOverviewAnalysis> {
  const client = new Anthropic({ apiKey });

  // Compute verdict distribution from existing data
  const distribution = {
    realConflict: 0,
    likelyConflict: 0,
    lowRisk: 0,
    falsePositive: 0,
    notAnalyzed: 0,
  };
  for (const c of conflicts) {
    switch (c.aiVerdict) {
      case 'real_conflict':
        distribution.realConflict++;
        break;
      case 'likely_conflict':
        distribution.likelyConflict++;
        break;
      case 'low_risk':
        distribution.lowRisk++;
        break;
      case 'false_positive':
        distribution.falsePositive++;
        break;
      default:
        distribution.notAnalyzed++;
    }
  }

  const userMessage = buildOverviewPrompt(conflicts, distribution);
  const response = await callWithRetry(client, model, OVERVIEW_SYSTEM_PROMPT, userMessage, 1, 4096);

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const parsed = parseOverviewResponse(text);

  return {
    ...parsed,
    verdictDistribution: distribution,
    analyzedCount: conflicts.length - distribution.notAnalyzed,
    totalCount: conflicts.length,
  };
}

function buildOverviewPrompt(
  conflicts: readonly Conflict[],
  distribution: ConflictOverviewAnalysis['verdictDistribution'],
): string {
  const conflictEntries = conflicts
    .map(
      (c, i) =>
        `### Conflict ${i + 1}
- Severity: ${c.severity} | Status: ${c.status} | Type: ${c.conflictType}
- Users: ${c.sessionAUserName ?? 'Unknown'} ↔ ${c.sessionBUserName ?? 'Unknown'}
- Overlapping Files: ${c.overlappingPaths.join(', ')}
- AI Verdict: ${c.aiVerdict ?? 'not analyzed'}${c.aiConfidence != null ? ` (${c.aiConfidence}%)` : ''}
- AI Summary: ${c.aiSummary ?? 'N/A'}`,
    )
    .join('\n\n');

  return `## Project Conflict Overview

- Total Conflicts: ${conflicts.length}
- Verdict Distribution: real_conflict=${distribution.realConflict}, likely_conflict=${distribution.likelyConflict}, low_risk=${distribution.lowRisk}, false_positive=${distribution.falsePositive}, not_analyzed=${distribution.notAnalyzed}

## Individual Conflicts

${conflictEntries}

위 프로젝트의 전체 충돌 상황을 종합 분석하여 JSON으로 응답하세요.`;
}

function parseOverviewResponse(text: string): {
  readonly riskLevel: ConflictOverviewAnalysis['riskLevel'];
  readonly summary: string;
  readonly hotspotFiles: readonly string[];
  readonly teamRecommendations: readonly string[];
  readonly memberPairs: ConflictOverviewAnalysis['memberPairs'];
} {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
  const jsonStr = (jsonMatch[1] ?? text).trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Failed to parse overview response as JSON: ${text.slice(0, 200)}`);
  }

  const result = parsed as Record<string, unknown>;

  const riskLevels = ['critical', 'high', 'moderate', 'low'] as const;
  const riskLevel = validateEnum(String(result['riskLevel'] ?? 'moderate'), riskLevels, 'moderate');

  const memberPairs = Array.isArray(result['memberPairs'])
    ? (result['memberPairs'] as unknown[]).map((p) => {
        const pair = p as Record<string, unknown>;
        return {
          userA: String(pair['userA'] ?? ''),
          userB: String(pair['userB'] ?? ''),
          conflictCount: Number(pair['conflictCount'] ?? 0),
          recommendation: String(pair['recommendation'] ?? ''),
        };
      })
    : [];

  return {
    riskLevel,
    summary: String(result['summary'] ?? ''),
    hotspotFiles: Array.isArray(result['hotspotFiles'])
      ? (result['hotspotFiles'] as unknown[]).map(String)
      : [],
    teamRecommendations: Array.isArray(result['teamRecommendations'])
      ? (result['teamRecommendations'] as unknown[]).map(String)
      : [],
    memberPairs,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const OVERVIEW_SYSTEM_PROMPT = `당신은 소프트웨어 개발팀의 프로젝트 충돌 현황 분석 전문가입니다.
프로젝트에서 감지된 모든 충돌을 종합 분석하여 팀 차원의 리스크 평가와 조율 권장사항을 제시합니다.

## Output Format

Respond ONLY with valid JSON:
{
  "riskLevel": "high",
  "summary": "프로젝트 전체 충돌 상황 한국어 2-3문장 요약",
  "hotspotFiles": ["가장 많이 충돌하는 파일 경로 top 5"],
  "teamRecommendations": ["팀 차원 권장사항 1", "팀 차원 권장사항 2"],
  "memberPairs": [
    {
      "userA": "사용자 A 이름",
      "userB": "사용자 B 이름",
      "conflictCount": 3,
      "recommendation": "이 두 사람에 대한 구체적 조율 권장"
    }
  ]
}

## Guidelines
- riskLevel: critical (실제 충돌 다수) | high (잠재적 충돌 다수) | moderate (일부 위험) | low (대부분 안전)
- summary: 전체 상황을 팀 리더가 빠르게 파악할 수 있도록 요약
- hotspotFiles: 여러 충돌에 등장하는 파일을 빈도순으로 최대 5개
- teamRecommendations: 팀 전체에 적용할 수 있는 실행 가능한 권장사항 2-4개
- memberPairs: 충돌이 있는 팀원 쌍별로 구체적 조율 방안 제시
- 모든 텍스트는 한국어로 작성
- 개별 conflict의 AI verdict가 있다면 그 결과를 신뢰하고 종합할 것
- verdict가 없는 conflict은 메타데이터(severity, overlapping files)로 판단`;

const SYSTEM_PROMPT = `당신은 소프트웨어 개발팀의 작업 충돌 분석 전문가입니다.
두 팀원이 각각 AI 코딩 어시스턴트와 나눈 대화 및 작업 컨텍스트를 분석하여,
실제로 중복/충돌되는 작업을 하고 있는지 판단합니다.

## 판단 기준

1. **같은 함수/컴포넌트 수정** → real_conflict
   - 동일한 함수명, 클래스명, 컴포넌트명이 양쪽 대화에서 언급됨
   - 동일한 로직을 서로 다른 방식으로 변경하려 함
   - 같은 파일의 같은 영역을 수정 중

2. **같은 기능을 각자 구현** → likely_conflict
   - 파일은 다르지만 동일한 비즈니스 요구사항을 구현 중
   - 예: 한 명은 프론트엔드, 다른 한 명은 백엔드에서 같은 기능 작업
   - 서로의 작업 결과에 영향을 줄 가능성이 높음

3. **공유 유틸/설정 파일 수정** → low_risk
   - 공통 파일을 건드리지만 서로 다른 부분을 수정
   - 예: 한 명은 새 상수 추가, 다른 한 명은 기존 함수 수정
   - merge 시 minor conflict 가능하나 로직 충돌은 아님

4. **실제 관련 없음** → false_positive
   - 파일 경로만 겹칠 뿐 작업 내용이 완전히 독립적
   - 예: 한 명은 타입 추가, 다른 한 명은 테스트 작성
   - 동시 수정해도 문제없음

## 분석 시 고려 사항

- 파일 경로 겹침만으로 판단하지 말 것 — 대화 내용에서 실제 의도를 파악
- assistant 응답에서 실제 코드 변경 내용을 확인하여 수정 범위 파악
- 같은 브랜치에서 작업 중인지 확인 (같은 브랜치 = 위험도 높음)
- 시간적 근접성 고려 (같은 날 작업 = 위험도 높음)
- 유틸/설정/타입 파일은 자연스럽게 여러 사람이 수정 — 이것만으로 conflict 아님
- index.ts, package.json 등 공통 파일의 겹침은 가중치 낮게

## Output Format

Respond ONLY with valid JSON:
{
  "verdict": "real_conflict",
  "confidence": 85,
  "overlapType": "same_function",
  "summary": "한국어 2-3문장 요약",
  "riskAreas": ["위험 지점 1", "위험 지점 2"],
  "recommendation": "coordinate",
  "recommendationDetail": "구체적 권장 조치 설명"
}

## Guidelines
- verdict: real_conflict | likely_conflict | low_risk | false_positive
- confidence: 0-100 (데이터가 부족하면 낮게)
- overlapType: same_function | same_feature | shared_utility | independent
- recommendation: coordinate | review_together | no_action | merge_carefully
- summary, riskAreas, recommendationDetail은 한국어로 작성
- 근거 없이 추측하지 말 것 — 대화 내용에서 확인 가능한 사실만 기반으로 판단`;
