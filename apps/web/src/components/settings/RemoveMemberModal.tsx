import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Collaborator } from '@context-sync/shared';
import { projectsApi } from '../../api/projects.api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface RemoveMemberModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (deleteData: boolean) => void;
  readonly isRemoving: boolean;
  readonly projectId: string;
  readonly collaborator: Collaborator;
}

export function RemoveMemberModal({
  isOpen,
  onClose,
  onConfirm,
  isRemoving,
  projectId,
  collaborator,
}: RemoveMemberModalProps) {
  const [deleteData, setDeleteData] = useState(false);
  const [confirmName, setConfirmName] = useState('');

  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['collaborator-data-summary', projectId, collaborator.userId],
    queryFn: () => projectsApi.getCollaboratorDataSummary(projectId, collaborator.userId),
    enabled: isOpen,
  });

  const summary = summaryData?.data?.summary;
  const memberName = collaborator.userName ?? 'User';
  const nameMatches = confirmName.trim() === memberName;
  const canConfirm = deleteData ? nameMatches : true;

  const handleClose = () => {
    setDeleteData(false);
    setConfirmName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Remove Member">
      <p className="text-sm text-text-secondary">
        Remove <span className="font-semibold text-text-primary">{memberName}</span> from this
        project.
      </p>

      {/* Data Summary */}
      {isSummaryLoading ? (
        <div className="mt-4 flex justify-center py-4">
          <Spinner />
        </div>
      ) : summary ? (
        <div className="mt-4 rounded-lg border border-border-default bg-surface-hover p-3">
          <p className="mb-2 text-xs font-medium text-text-tertiary">Data Summary</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <SummaryRow label="Sessions" count={summary.sessions} />
            <SummaryRow label="Messages" count={summary.messages} />
            <SummaryRow label="PRD Documents" count={summary.prdDocuments} />
            <SummaryRow label="PRD Analyses" count={summary.prdAnalyses} />
            <SummaryRow label="AI Evaluations" count={summary.aiEvaluations} />
            <SummaryRow label="Activity Logs" count={summary.activityLogs} />
            <SummaryRow label="Prompt Templates" count={summary.promptTemplates} />
            <SummaryRow label="Conflicts" count={summary.conflicts} />
            <SummaryRow label="Synced Sessions" count={summary.syncedSessions} />
          </div>
        </div>
      ) : null}

      {/* Options */}
      <div className="mt-4 space-y-2">
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border-default p-3 hover:bg-surface-hover">
          <input
            type="radio"
            name="removeOption"
            checked={!deleteData}
            onChange={() => setDeleteData(false)}
            className="accent-btn-primary-bg"
          />
          <div>
            <p className="text-sm font-medium text-text-primary">Remove member only</p>
            <p className="text-xs text-text-tertiary">Revoke access but keep existing data</p>
          </div>
        </label>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border-default p-3 hover:bg-surface-hover">
          <input
            type="radio"
            name="removeOption"
            checked={deleteData}
            onChange={() => setDeleteData(true)}
            className="accent-btn-primary-bg"
          />
          <div>
            <p className="text-sm font-medium text-text-primary">Remove member and delete data</p>
            <p className="text-xs text-text-tertiary">
              Remove from project and permanently delete all their data
            </p>
          </div>
        </label>
      </div>

      {/* Confirmation input for data deletion */}
      {deleteData && (
        <div className="mt-4">
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
            <p className="text-sm text-red-400">
              This action cannot be undone. All sessions, messages, PRD documents, and other data
              created by this member will be permanently deleted.
            </p>
          </div>
          <div className="mt-3">
            <label className="block text-sm text-text-secondary">
              Type <span className="font-semibold text-text-primary">{memberName}</span> to confirm
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={memberName}
              className="mt-1 w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-btn-primary-bg focus:outline-none focus:ring-1 focus:ring-btn-primary-bg"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={handleClose} disabled={isRemoving}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={() => onConfirm(deleteData)}
          disabled={!canConfirm || isRemoving}
          isLoading={isRemoving}
        >
          {deleteData ? 'Remove & Delete Data' : 'Remove Member'}
        </Button>
      </div>
    </Modal>
  );
}

function SummaryRow({ label, count }: { readonly label: string; readonly count: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-tertiary">{label}</span>
      <span className="font-medium text-text-primary">{count}</span>
    </div>
  );
}
