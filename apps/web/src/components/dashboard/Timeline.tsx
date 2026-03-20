import type { TimelineEntry } from '@context-sync/shared';
import { TimelineItem } from './TimelineItem';
import { Spinner } from '../ui/Spinner';

interface TimelineProps {
  entries: readonly TimelineEntry[];
  isLoading: boolean;
}

export function Timeline({ entries, isLoading }: TimelineProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-tertiary">
        No activity yet. Import sessions to see the timeline.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <TimelineItem key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
