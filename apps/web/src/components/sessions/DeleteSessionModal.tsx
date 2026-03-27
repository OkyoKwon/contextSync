import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface DeleteSessionModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly isDeleting: boolean;
  readonly sessionTitle: string;
}

export function DeleteSessionModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  sessionTitle,
}: DeleteSessionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Session" size="sm">
      <p className="text-sm text-text-secondary">
        Are you sure you want to delete{' '}
        <span className="font-semibold text-text-primary">{sessionTitle}</span>?
      </p>
      <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
        <p className="text-xs text-red-400">
          This will permanently remove the session and all its messages. This action cannot be
          undone.
        </p>
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm} isLoading={isDeleting}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
