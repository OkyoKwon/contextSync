import type { TeamEvaluationSummaryEntry, EvaluationPerspective } from '@context-sync/shared';
import { PERSPECTIVE_LABELS } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { ModelIcon } from './ModelIcon';

interface TeamEvaluationSummaryProps {
  members: readonly TeamEvaluationSummaryEntry[];
  onSelectUser: (userId: string) => void;
}

const PERSPECTIVES: EvaluationPerspective[] = ['claude', 'chatgpt', 'gemini'];

const perspectiveColors: Record<EvaluationPerspective, string> = {
  claude: 'text-orange-400',
  chatgpt: 'text-emerald-400',
  gemini: 'text-blue-400',
};

const barColors: Record<EvaluationPerspective, string> = {
  claude: 'bg-orange-500',
  chatgpt: 'bg-emerald-500',
  gemini: 'bg-blue-500',
};

export function TeamEvaluationSummary({ members, onSelectUser }: TeamEvaluationSummaryProps) {
  if (members.length === 0) {
    return (
      <Card padding="lg" className="text-center text-sm text-text-tertiary">
        No team members found.
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => {
        const hasAnyScore = PERSPECTIVES.some((p) => member.perspectives[p] != null);

        return (
          <Card
            key={member.userId}
            className="cursor-pointer transition-colors hover:border-blue-500/30"
            onClick={() => onSelectUser(member.userId)}
          >
            <div className="flex items-center gap-3">
              <Avatar src={member.userAvatarUrl} name={member.userName} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{member.userName}</p>
                {!hasAnyScore ? (
                  <Badge variant="default" className="mt-1">
                    Not evaluated
                  </Badge>
                ) : (
                  <div className="mt-1 flex items-center gap-3">
                    {PERSPECTIVES.map((p) => {
                      const data = member.perspectives[p];
                      return (
                        <span key={p} className={`text-xs font-medium ${perspectiveColors[p]}`}>
                          {data ? data.score.toFixed(0) : '—'}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            {hasAnyScore && (
              <div className="mt-3 space-y-1.5">
                {PERSPECTIVES.map((p) => {
                  const data = member.perspectives[p];
                  const score = data?.score ?? 0;
                  return (
                    <div key={p} className="flex items-center gap-2">
                      <span
                        className={`flex w-14 items-center gap-0.5 text-[10px] ${perspectiveColors[p]}`}
                      >
                        <ModelIcon perspective={p} size={12} />
                        {PERSPECTIVE_LABELS[p]}
                      </span>
                      <div className="flex-1">
                        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-hover">
                          <div
                            className={`h-full rounded-full ${barColors[p]}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
