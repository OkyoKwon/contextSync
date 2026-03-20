import { useParams, Link } from 'react-router';
import { useSession } from '../hooks/use-sessions';
import { SessionDetail } from '../components/sessions/SessionDetail';
import { Spinner } from '../components/ui/Spinner';
import { ErrorDisplay } from '../components/ui/ApiErrorBoundary';

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data, isLoading, error } = useSession(sessionId!);

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
      <Link to="/sessions" className="mb-4 inline-block text-sm text-blue-400 hover:underline">
        &larr; Back to sessions
      </Link>
      <SessionDetail session={data.data} />
    </div>
  );
}
