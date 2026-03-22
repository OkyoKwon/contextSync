import { useSearchParams } from 'react-router';
import { useAuthStore } from '../stores/auth.store';
import { useRequireProject } from '../hooks/use-require-project';
import { NoProjectState } from '../components/shared/NoProjectState';
import { PageBreadcrumb } from '../components/layout/PageBreadcrumb';
import { Spinner } from '../components/ui/Spinner';
import { SettingsLayout } from '../components/settings/SettingsLayout';
import { GeneralTab } from '../components/settings/GeneralTab';
import { TeamTab } from '../components/settings/TeamTab';
import { IntegrationsTab } from '../components/settings/IntegrationsTab';
import { DangerZoneTab } from '../components/settings/DangerZoneTab';
import { DEFAULT_TAB, isValidTab, type SettingsTab } from '../components/settings/settings-tabs';

export function SettingsPage() {
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const { isProjectSelected, isLoading: isProjectLoading } = useRequireProject();

  if (isProjectLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isProjectSelected || !currentProjectId) {
    return (
      <div>
        <div className="mb-6">
          <PageBreadcrumb pageName="Settings" />
        </div>
        <div className="space-y-6">
          <NoProjectState pageName="Settings" />
        </div>
      </div>
    );
  }

  return <SettingsContent projectId={currentProjectId} />;
}

function SettingsContent({ projectId }: { readonly projectId: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: SettingsTab = isValidTab(rawTab) ? rawTab : DEFAULT_TAB;

  const handleTabChange = (tab: SettingsTab) => {
    setSearchParams({ tab }, { replace: true });
  };

  return (
    <div>
      <div className="mb-6">
        <PageBreadcrumb pageName="Settings" />
      </div>
      <SettingsLayout activeTab={activeTab} onTabChange={handleTabChange}>
        {activeTab === 'general' && <GeneralTab projectId={projectId} />}
        {activeTab === 'team' && <TeamTab projectId={projectId} />}
        {activeTab === 'integrations' && <IntegrationsTab />}
        {activeTab === 'danger-zone' && <DangerZoneTab projectId={projectId} />}
      </SettingsLayout>
    </div>
  );
}
