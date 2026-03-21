import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { TeamEvaluationSummaryEntry } from '@context-sync/shared';

interface TriggerEvaluationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: readonly TeamEvaluationSummaryEntry[];
  onTrigger: (targetUserId: string, dateRangeStart?: string, dateRangeEnd?: string) => void;
  isPending: boolean;
}

export function TriggerEvaluationDialog({
  isOpen,
  onClose,
  members,
  onTrigger,
  isPending,
}: TriggerEvaluationDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    onTrigger(selectedUserId, dateRangeStart || undefined, dateRangeEnd || undefined);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Run AI Evaluation">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Target User</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full rounded-lg border border-border-default bg-surface-hover px-3 py-2 text-sm text-text-primary focus:border-blue-500 focus:outline-none"
            required
          >
            <option value="">Select a team member</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.userName}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Start Date (optional)
            </label>
            <Input
              type="date"
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              End Date (optional)
            </label>
            <Input
              type="date"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-text-tertiary">
          Default: Last 30 days. Up to 50 sessions will be analyzed.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!selectedUserId || isPending}>
            {isPending ? 'Analyzing...' : 'Run Evaluation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
