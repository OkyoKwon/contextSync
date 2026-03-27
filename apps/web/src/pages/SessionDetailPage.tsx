import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useSession, useDeleteSession } from '../hooks/use-sessions';
import { SessionDetail } from '../components/sessions/SessionDetail';
import { DeleteSessionModal } from '../components/sessions/DeleteSessionModal';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { ErrorDisplay } from '../components/ui/ApiErrorBoundary';
import { showToast } from '../lib/toast';

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useSession(sessionId!);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const deleteMutation = useDeleteSession();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data?.data) {
    return <ErrorDisplay message="Failed to load session" />;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/project"
          className="inline-block text-sm text-link hover:text-link-hover hover:underline"
        >
          &larr; Back to project
        </Link>
        <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
          Delete
        </Button>
      </div>
      <SessionDetail session={data.data} />

      <DeleteSessionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          deleteMutation.mutate(sessionId!, {
            onSuccess: () => {
              showToast.success('Session deleted');
              navigate('/project');
            },
            onError: (err) =>
              showToast.error(err instanceof Error ? err.message : 'Failed to delete session'),
          });
        }}
        isDeleting={deleteMutation.isPending}
        sessionTitle={data.data.title}
      />
    </div>
  );
}
