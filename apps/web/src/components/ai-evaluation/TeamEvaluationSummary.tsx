import type { TeamEvaluationSummaryEntry } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { ProficiencyBadge } from './ProficiencyBadge';

interface TeamEvaluationSummaryProps {
  members: readonly TeamEvaluationSummaryEntry[];
  onSelectUser: (userId: string) => void;
}

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
      {members.map((member) => (
        <Card
          key={member.userId}
          className="cursor-pointer transition-colors hover:border-blue-500/30"
          onClick={() => onSelectUser(member.userId)}
        >
          <div className="flex items-center gap-3">
            <Avatar src={member.userAvatarUrl} name={member.userName} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">{member.userName}</p>
              {member.latestEvaluation ? (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-lg font-bold text-text-primary">
                    {member.latestEvaluation.overallScore?.toFixed(1) ?? '-'}
                  </span>
                  <ProficiencyBadge tier={member.latestEvaluation.proficiencyTier} />
                </div>
              ) : (
                <Badge variant="default" className="mt-1">
                  Not evaluated
                </Badge>
              )}
            </div>
          </div>
          {member.latestEvaluation && (
            <div className="mt-3 grid grid-cols-5 gap-1">
              <ScoreBar label="PQ" score={member.latestEvaluation.promptQualityScore} />
              <ScoreBar label="TC" score={member.latestEvaluation.taskComplexityScore} />
              <ScoreBar label="IP" score={member.latestEvaluation.iterationPatternScore} />
              <ScoreBar label="CU" score={member.latestEvaluation.contextUtilizationScore} />
              <ScoreBar label="AL" score={member.latestEvaluation.aiCapabilityLeverageScore} />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  const value = score ?? 0;
  const color =
    value >= 71
      ? 'bg-green-500'
      : value >= 51
        ? 'bg-blue-500'
        : value >= 26
          ? 'bg-yellow-500'
          : 'bg-red-500';

  return (
    <div className="text-center">
      <div className="mb-1 h-1 w-full overflow-hidden rounded-full bg-surface-hover">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] text-text-tertiary">{label}</span>
    </div>
  );
}
