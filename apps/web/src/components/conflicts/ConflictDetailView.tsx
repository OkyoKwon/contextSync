import { useState } from 'react';
import type { Conflict } from '@context-sync/shared';
import { SeverityBadge, Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { formatDate } from '../../lib/date';
import { useUpdateConflict, useAssignReviewer, useAddReviewNotes } from '../../hooks/use-conflicts';
import { useCollaborators } from '../../hooks/use-collaborators';
import { useAuthStore } from '../../stores/auth.store';

interface ConflictDetailViewProps {
  conflict: Conflict;
}

export function ConflictDetailView({ conflict }: ConflictDetailViewProps) {
  const updateMutation = useUpdateConflict();
  const assignMutation = useAssignReviewer();
  const notesMutation = useAddReviewNotes();
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: collabData } = useCollaborators(currentProjectId);
  const collaborators = collabData?.data ?? [];

  const [reviewNotes, setReviewNotes] = useState('');
  const [showAssign, setShowAssign] = useState(false);

  const isActive = conflict.status === 'detected' || conflict.status === 'reviewing';

  const handleAssign = (reviewerId: string) => {
    assignMutation.mutate({ conflictId: conflict.id, reviewerId });
    setShowAssign(false);
  };

  const handleSubmitNotes = () => {
    if (!reviewNotes.trim()) return;
    notesMutation.mutate({ conflictId: conflict.id, reviewNotes: reviewNotes.trim() });
    setReviewNotes('');
  };

  return (
    <div className="rounded-xl border border-border-default bg-surface p-6">
      <div className="flex items-center gap-3">
        <SeverityBadge severity={conflict.severity} />
        <Badge>{conflict.conflictType}</Badge>
        <Badge>{conflict.status}</Badge>
        <span className="ml-auto text-sm text-text-tertiary">{formatDate(conflict.createdAt)}</span>
      </div>

      <p className="mt-4 text-sm text-text-secondary">{conflict.description}</p>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-text-primary">Overlapping Files</h4>
        <div className="mt-2 space-y-1">
          {conflict.overlappingPaths.map((path) => (
            <div key={path} className="rounded bg-red-500/10 px-3 py-1.5 text-sm font-mono text-red-400">
              {path}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border-default p-4">
          <h4 className="text-sm font-medium text-text-primary">Session A</h4>
          <p className="mt-1 text-xs text-text-tertiary">ID: {conflict.sessionAId}</p>
          {conflict.sessionATitle && <p className="text-sm">{conflict.sessionATitle}</p>}
        </div>
        <div className="rounded-lg border border-border-default p-4">
          <h4 className="text-sm font-medium text-text-primary">Session B</h4>
          <p className="mt-1 text-xs text-text-tertiary">ID: {conflict.sessionBId}</p>
          {conflict.sessionBTitle && <p className="text-sm">{conflict.sessionBTitle}</p>}
        </div>
      </div>

      {/* Reviewer section */}
      <div className="mt-6 rounded-lg border border-border-default p-4">
        <h4 className="text-sm font-medium text-text-primary">Reviewer</h4>
        {conflict.reviewerId ? (
          <div className="mt-2 flex items-center gap-2">
            <Avatar name={conflict.reviewerName ?? 'Reviewer'} size="sm" />
            <span className="text-sm text-text-secondary">{conflict.reviewerName ?? conflict.reviewerId}</span>
            {conflict.assignedAt && (
              <span className="text-xs text-text-tertiary">Assigned {formatDate(conflict.assignedAt)}</span>
            )}
          </div>
        ) : (
          <p className="mt-1 text-xs text-text-tertiary">No reviewer assigned</p>
        )}
        {isActive && (
          <div className="mt-2">
            {showAssign ? (
              <div className="space-y-1">
                {currentUserId && (
                  <button
                    onClick={() => handleAssign(currentUserId)}
                    className="block w-full rounded px-2 py-1 text-left text-sm text-text-secondary hover:bg-surface-hover"
                  >
                    Assign to me
                  </button>
                )}
                {collaborators.map((c) => (
                  <button
                    key={c.userId}
                    onClick={() => handleAssign(c.userId)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm text-text-secondary hover:bg-surface-hover"
                  >
                    <Avatar src={c.userAvatarUrl} name={c.userName ?? 'User'} size="sm" />
                    {c.userName}
                  </button>
                ))}
                <Button size="sm" variant="secondary" onClick={() => setShowAssign(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setShowAssign(true)}>
                {conflict.reviewerId ? 'Reassign' : 'Assign Reviewer'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Review notes */}
      {conflict.reviewNotes && (
        <div className="mt-4 rounded-lg border border-border-default p-4">
          <h4 className="text-sm font-medium text-text-primary">Review Notes</h4>
          <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">{conflict.reviewNotes}</p>
        </div>
      )}

      {isActive && (
        <div className="mt-4">
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Add review notes..."
            className="w-full rounded-lg border border-border-default bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-500 focus:outline-none"
            rows={3}
          />
          <Button
            size="sm"
            className="mt-2"
            onClick={handleSubmitNotes}
            disabled={!reviewNotes.trim() || notesMutation.isPending}
          >
            {notesMutation.isPending ? 'Saving...' : 'Save Notes'}
          </Button>
        </div>
      )}

      {isActive && (
        <div className="mt-6 flex gap-2">
          <Button
            onClick={() => updateMutation.mutate({ id: conflict.id, input: { status: 'resolved' } })}
            disabled={updateMutation.isPending}
          >
            Mark as Resolved
          </Button>
          <Button
            variant="secondary"
            onClick={() => updateMutation.mutate({ id: conflict.id, input: { status: 'dismissed' } })}
            disabled={updateMutation.isPending}
          >
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
