import type { PrdAnalysisWithRequirements, PrdAnalysisHistoryEntry, PrdRequirement } from '@context-sync/shared';
import { PrdAnalysisResults } from './PrdAnalysisResults';
import { PrdTrendChart } from './PrdTrendChart';

interface PrdDashboardProps {
  readonly analysis: PrdAnalysisWithRequirements;
  readonly previousRate: number | null;
  readonly previousRequirements: readonly PrdRequirement[] | null;
  readonly historyEntries: readonly PrdAnalysisHistoryEntry[];
}

export function PrdDashboard({ analysis, previousRate, previousRequirements, historyEntries }: PrdDashboardProps) {
  const completedEntries = historyEntries.filter(
    (e) => e.status === 'completed' && e.overallRate !== null,
  );
  const hasChart = completedEntries.length >= 2;

  if (!hasChart) {
    return <PrdAnalysisResults analysis={analysis} previousRate={previousRate} previousRequirements={previousRequirements} />;
  }

  return (
    <div className="space-y-6">
      <PrdAnalysisResults analysis={analysis} previousRate={previousRate} previousRequirements={previousRequirements} />
      <PrdTrendChart entries={historyEntries} />
    </div>
  );
}
