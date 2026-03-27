import type { LearningGuide } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Badge } from '../ui/Badge';
import { LearningStepCard } from './LearningStepCard';
import type { EvalContentLang } from './EvalLanguageToggle';

interface LearningRoadmapProps {
  guide: LearningGuide | null;
  isLoading: boolean;
  contentLang?: EvalContentLang;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function LearningRoadmap({
  guide,
  isLoading,
  contentLang = 'en',
  onRegenerate,
  isRegenerating = false,
}: LearningRoadmapProps) {
  const isKo = contentLang === 'ko';

  if (isLoading) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner />
          <p className="text-sm text-text-tertiary">
            {isKo ? '학습 로드맵을 생성하고 있습니다...' : 'Generating learning roadmap...'}
          </p>
        </div>
      </Card>
    );
  }

  if (!guide) return null;

  if (guide.status === 'pending' || guide.status === 'generating') {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner />
          <p className="text-sm text-text-tertiary">
            {isKo ? '학습 로드맵을 생성하고 있습니다...' : 'Generating learning roadmap...'}
          </p>
        </div>
      </Card>
    );
  }

  if (guide.status === 'failed') {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-8">
          <Badge variant="critical">{isKo ? '생성 실패' : 'Generation Failed'}</Badge>
          <p className="text-sm text-text-tertiary">
            {guide.errorMessage ??
              (isKo
                ? '학습 가이드 생성 중 오류가 발생했습니다.'
                : 'An error occurred while generating the learning guide.')}
          </p>
          {onRegenerate && (
            <Button variant="secondary" size="sm" onClick={onRegenerate} disabled={isRegenerating}>
              {isRegenerating
                ? isKo
                  ? '재생성 중...'
                  : 'Regenerating...'
                : isKo
                  ? '다시 생성'
                  : 'Regenerate'}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const currentTierSummary = isKo
    ? (guide.currentTierSummaryKo ?? guide.currentTierSummary)
    : guide.currentTierSummary;
  const nextTierGoal = isKo ? (guide.nextTierGoalKo ?? guide.nextTierGoal) : guide.nextTierGoal;

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">
            {isKo ? '학습 로드맵' : 'Learning Roadmap'}
          </h2>
          {onRegenerate && (
            <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={isRegenerating}>
              {isRegenerating
                ? isKo
                  ? '재생성 중...'
                  : 'Regenerating...'
                : isKo
                  ? '다시 생성'
                  : 'Regenerate'}
            </Button>
          )}
        </div>

        {currentTierSummary && (
          <p className="mb-2 text-sm text-text-secondary">{currentTierSummary}</p>
        )}
        {nextTierGoal && <p className="mb-3 text-sm font-medium text-blue-400">{nextTierGoal}</p>}

        {guide.priorityAreas.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-text-tertiary">
              {isKo ? '우선 개선 영역:' : 'Priority areas:'}
            </span>
            {guide.priorityAreas.map((area) => (
              <span
                key={area}
                className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-medium text-yellow-400"
              >
                {area.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </Card>

      {guide.steps.map((step) => (
        <LearningStepCard key={step.id} step={step} contentLang={contentLang} />
      ))}

      <p className="text-center text-[10px] text-text-tertiary">
        {isKo
          ? 'AI가 추천한 리소스입니다. 일부 링크가 유효하지 않을 수 있습니다.'
          : 'Resources recommended by AI. Some links may not be valid.'}
      </p>
    </div>
  );
}
