import { useAuthStore } from '../stores/auth.store';
import { TeamSettings } from '../components/teams/TeamSettings';
import { MemberList } from '../components/teams/MemberList';
import { ProjectSettingsInline } from '../pages/ProjectSettingsPage';

export function TeamSettingsPage() {
  const teamId = useAuthStore((s) => s.currentTeamId);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">Settings</h1>
      <div className="space-y-6">
        {!teamId && <TeamSettings />}
        {teamId && (
          <>
            <ProjectSettingsInline />
            <MemberList />
          </>
        )}
      </div>
    </div>
  );
}
