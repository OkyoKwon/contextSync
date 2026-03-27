import type { LearningStep } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { LearningResourceItem } from './LearningResourceItem';
import type { EvalContentLang } from './EvalLanguageToggle';

interface LearningStepCardProps {
  step: LearningStep;
  contentLang?: EvalContentLang;
}

export function LearningStepCard({ step, contentLang = 'en' }: LearningStepCardProps) {
  const isKo = contentLang === 'ko';
  const title = isKo ? (step.titleKo ?? step.title) : step.title;
  const objective = isKo ? (step.objectiveKo ?? step.objective) : step.objective;
  const keyActions = isKo ? (step.keyActionsKo ?? step.keyActions) : step.keyActions;
  const practicePrompt = isKo
    ? (step.practicePromptKo ?? step.practicePrompt)
    : step.practicePrompt;

  return (
    <Card>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
          {step.stepNumber}
        </span>
        <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
      </div>

      <p className="mb-3 text-xs text-text-secondary">{objective}</p>

      {step.targetDimensions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {step.targetDimensions.map((dim) => (
            <span
              key={dim}
              className="rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] text-text-tertiary"
            >
              {dim.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {keyActions.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-text-tertiary">
            {isKo ? '실행 항목' : 'Key Actions'}
          </p>
          <ul className="space-y-1">
            {keyActions.map((action, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                <span className="mt-0.5 text-blue-400">•</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {step.resources.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-text-tertiary">
            {isKo ? '추천 리소스' : 'Resources'}
          </p>
          <ul className="space-y-2">
            {step.resources.map((resource) => (
              <LearningResourceItem
                key={resource.id}
                resource={resource}
                contentLang={contentLang}
              />
            ))}
          </ul>
        </div>
      )}

      {practicePrompt && (
        <div className="rounded-lg bg-surface-secondary p-3">
          <p className="mb-1 text-xs font-medium text-yellow-400">
            {isKo ? '연습 과제' : 'Practice'}
          </p>
          <p className="text-xs leading-relaxed text-text-secondary">{practicePrompt}</p>
        </div>
      )}
    </Card>
  );
}
