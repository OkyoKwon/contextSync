import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/auth.store';
import { useRespondInvitation } from '../hooks/use-invitations';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const TOKEN_STORAGE_KEY = 'invitation_token';

export function InvitationAcceptPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const isAuthenticated = !!useAuthStore((s) => s.token);

  // Store token for post-login retrieval
  useEffect(() => {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  }, [token]);

  // Retrieve token from sessionStorage if not in URL (post-login redirect)
  const effectiveToken = token ?? sessionStorage.getItem(TOKEN_STORAGE_KEY);

  if (!effectiveToken) {
    return (
      <CenteredLayout>
        <Card>
          <div className="p-6 text-center">
            <h2 className="text-lg font-semibold text-text-primary">Invalid Invitation</h2>
            <p className="mt-2 text-sm text-text-tertiary">No invitation token provided.</p>
          </div>
        </Card>
      </CenteredLayout>
    );
  }

  if (!isAuthenticated) {
    return <UnauthenticatedView />;
  }

  return <AuthenticatedView token={effectiveToken} />;
}

function UnauthenticatedView() {
  return (
    <CenteredLayout>
      <Card>
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
            <svg
              className="h-6 w-6 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Project Invitation</h2>
          <p className="mt-2 text-sm text-text-tertiary">
            Log in with GitHub to accept this invitation.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              window.location.href = '/login';
            }}
          >
            Log in with GitHub
          </Button>
        </div>
      </Card>
    </CenteredLayout>
  );
}

function AuthenticatedView({ token }: { readonly token: string }) {
  const navigate = useNavigate();
  const respondMutation = useRespondInvitation();

  const handleRespond = (action: 'accept' | 'decline') => {
    respondMutation.mutate(
      { token, action },
      {
        onSuccess: (result) => {
          sessionStorage.removeItem(TOKEN_STORAGE_KEY);
          if (action === 'accept' && result.data) {
            navigate('/project');
          } else {
            navigate('/dashboard');
          }
        },
      },
    );
  };

  return (
    <CenteredLayout>
      <Card>
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
            <svg
              className="h-6 w-6 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Project Invitation</h2>
          <p className="mt-2 text-sm text-text-tertiary">
            You've been invited to join a project. Would you like to accept?
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="ghost"
              onClick={() => handleRespond('decline')}
              disabled={respondMutation.isPending}
            >
              Decline
            </Button>
            <Button onClick={() => handleRespond('accept')} disabled={respondMutation.isPending}>
              {respondMutation.isPending ? 'Processing...' : 'Accept Invitation'}
            </Button>
          </div>
          {respondMutation.isError && (
            <p className="mt-4 text-sm text-red-400">
              {respondMutation.error instanceof Error
                ? respondMutation.error.message
                : 'Failed to respond to invitation'}
            </p>
          )}
        </div>
      </Card>
    </CenteredLayout>
  );
}

function CenteredLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
