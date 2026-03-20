import { useMyInvitations } from '../../hooks/use-invitations';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

export function PendingInvitations() {
  const { data } = useMyInvitations();
  const invitations = data?.data ?? [];

  if (invitations.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="h-5 w-5 text-blue-400"
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
        <h3 className="text-sm font-semibold text-text-primary">
          Pending Invitations ({invitations.length})
        </h3>
      </div>
      <div className="space-y-2">
        {invitations.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center gap-3 rounded-lg border border-border-default p-3"
          >
            <Avatar src={inv.inviterAvatarUrl} name={inv.inviterName} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{inv.projectName}</p>
              <p className="text-xs text-text-tertiary">
                Invited by {inv.inviterName} as <Badge variant="info">{inv.role}</Badge>
              </p>
            </div>
            <p className="text-xs text-text-tertiary whitespace-nowrap">
              Expires {new Date(inv.expiresAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-text-tertiary">
        Check your email for invitation links to accept or decline.
      </p>
    </Card>
  );
}
