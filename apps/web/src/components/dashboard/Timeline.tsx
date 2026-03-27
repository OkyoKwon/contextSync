import type { TimelineEntry } from '@context-sync/shared';
import { TimelineItem } from './TimelineItem';
import { Spinner } from '../ui/Spinner';

interface TimelineProps {
  readonly entries: readonly TimelineEntry[];
  readonly isLoading: boolean;
  readonly onDeleteSession?: (id: string, title: string) => void;
}

export function Timeline({ entries, isLoading, onDeleteSession }: TimelineProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-default py-10">
        <p className="text-sm text-text-tertiary">Get started by importing your first session</p>
        <a
          href="/sessions"
          className="inline-flex items-center justify-center rounded-lg bg-btn-primary-bg px-3 py-1.5 text-sm font-medium text-btn-primary-text hover:bg-btn-primary-hover transition-colors"
        >
          Import Session
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <TimelineItem key={entry.id} entry={entry} onDelete={onDeleteSession} />
      ))}
    </div>
  );
}
