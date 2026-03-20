import { useAuthStore } from '../stores/auth.store';
import { TeamSettings } from '../components/teams/TeamSettings';
import { MemberList } from '../components/teams/MemberList';
import { ProjectSettingsInline } from '../pages/ProjectSettingsPage';
import { PageBreadcrumb } from '../components/layout/PageBreadcrumb';

export function TeamSettingsPage() {
  const teamId = useAuthStore((s) => s.currentTeamId);

  return (
    <div>
      <div className="mb-6">
        <PageBreadcrumb pageName="Settings" />
      </div>
      <div className="space-y-6">
        <ProjectSettingsInline />
        {!teamId && <TeamSettings />}
        {teamId && <MemberList />}
      </div>
    </div>
  );
}
