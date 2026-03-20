import { useTeamMembers } from '../../hooks/use-teams';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';

export function MemberList() {
  const { data, isLoading } = useTeamMembers();
  const members = data?.data ?? [];

  if (isLoading) return <Spinner />;

  return (
    <Card>
      <h3 className="mb-4 text-lg font-semibold">Team Members</h3>
      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-hover">
            <Avatar src={member.userAvatarUrl} name={member.userName ?? 'User'} />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{member.userName}</p>
              <p className="text-xs text-text-tertiary">{member.userEmail}</p>
            </div>
            <Badge>{member.role}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
