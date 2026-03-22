import { useState } from 'react';
import type { SupabaseProject } from '@context-sync/shared';
import { useAuthStore } from '../../../stores/auth.store';
import {
  useSupabaseProjects,
  useSupabaseOrganizations,
  useSupabaseAutoSetup,
  useSupabaseCreateAndSetup,
  useSaveSupabaseToken,
  useDeleteSupabaseToken,
} from '../../../hooks/use-supabase-onboarding';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { Spinner } from '../../ui/Spinner';

interface SupabaseAutoSetupProps {
  readonly projectId: string;
  readonly onAutoSetupComplete: () => void;
}

type SetupTab = 'existing' | 'new';

const SUPABASE_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'eu-west-1', label: 'EU West (Ireland)' },
  { value: 'eu-west-2', label: 'EU West (London)' },
  { value: 'eu-central-1', label: 'EU Central (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'ap-northeast-2', label: 'Asia Pacific (Seoul)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'sa-east-1', label: 'South America (Sao Paulo)' },
  { value: 'ca-central-1', label: 'Canada (Central)' },
] as const;

export function SupabaseAutoSetup({ projectId, onAutoSetupComplete }: SupabaseAutoSetupProps) {
  const user = useAuthStore((s) => s.user);
  const hasToken = user?.hasSupabaseToken ?? false;

  // Step 1: Token
  const [tokenInput, setTokenInput] = useState('');
  const saveTokenMutation = useSaveSupabaseToken();
  const deleteTokenMutation = useDeleteSupabaseToken();
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Step 2: Project selection
  const [tab, setTab] = useState<SetupTab>('existing');
  const supabaseProjects = useSupabaseProjects(projectId, hasToken);
  const supabaseOrgs = useSupabaseOrganizations(projectId, hasToken && tab === 'new');

  // Existing project form
  const [selectedRef, setSelectedRef] = useState('');
  const [dbPassword, setDbPassword] = useState('');

  // New project form
  const [newName, setNewName] = useState('');
  const [newRegion, setNewRegion] = useState('us-east-1');
  const [newOrgId, setNewOrgId] = useState('');
  const [newDbPassword, setNewDbPassword] = useState('');

  // Mutations
  const autoSetupMutation = useSupabaseAutoSetup(projectId);
  const createAndSetupMutation = useSupabaseCreateAndSetup(projectId);

  const [error, setError] = useState<string | null>(null);

  const handleSaveToken = () => {
    setError(null);
    saveTokenMutation.mutate(tokenInput, {
      onSuccess: () => {
        setTokenInput('');
        setShowTokenInput(false);
      },
      onError: (err) => setError(err instanceof Error ? err.message : 'Failed to save token'),
    });
  };

  const handleDeleteToken = () => {
    setError(null);
    deleteTokenMutation.mutate(undefined, {
      onError: (err) => setError(err instanceof Error ? err.message : 'Failed to delete token'),
    });
  };

  const handleConnectExisting = () => {
    setError(null);
    autoSetupMutation.mutate(
      { supabaseProjectRef: selectedRef, dbPassword },
      {
        onSuccess: () => onAutoSetupComplete(),
        onError: (err) => setError(err instanceof Error ? err.message : 'Auto setup failed'),
      },
    );
  };

  const handleCreateAndConnect = () => {
    setError(null);
    createAndSetupMutation.mutate(
      { name: newName, dbPassword: newDbPassword, region: newRegion, organizationId: newOrgId },
      {
        onSuccess: () => onAutoSetupComplete(),
        onError: (err) => setError(err instanceof Error ? err.message : 'Create and setup failed'),
      },
    );
  };

  const isConnecting = autoSetupMutation.isPending || createAndSetupMutation.isPending;

  const projects = supabaseProjects.data?.data ?? [];
  const organizations = supabaseOrgs.data?.data ?? [];

  return (
    <div className="space-y-4">
      {/* Step 1: Token */}
      <div
        className={`rounded-lg border p-4 transition-colors ${
          hasToken
            ? 'border-green-500/20 bg-green-500/5'
            : 'border-accent-primary/30 bg-accent-primary/5'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <StepNumber step={1} completed={hasToken} active={!hasToken} />
          <span className="text-sm font-medium text-text-primary">Supabase Access Token</span>
          {hasToken && <Badge variant="success">Connected</Badge>}
        </div>

        {hasToken && !showTokenInput ? (
          <div className="ml-7 mt-1 flex items-center justify-between">
            <p className="text-xs text-text-tertiary">Supabase 계정이 연결되어 있습니다.</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setShowTokenInput(true)}>
                Change
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteToken}
                isLoading={deleteTokenMutation.isPending}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="ml-7 mt-2 space-y-3">
            <p className="text-xs text-text-tertiary leading-relaxed">
              Supabase 대시보드에서 Access Token을 발급받아 입력해주세요. 이 토큰으로 프로젝트 목록
              조회와 새 프로젝트 생성이 가능합니다. 토큰은 암호화되어 안전하게 저장됩니다.
            </p>
            <Input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              type="password"
            />
            <div className="flex items-center justify-between">
              <a
                href="https://supabase.com/dashboard/account/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent-primary hover:underline"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                  <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                </svg>
                Supabase에서 토큰 발급받기
              </a>
              <div className="flex gap-2">
                {showTokenInput && (
                  <Button variant="ghost" size="sm" onClick={() => setShowTokenInput(false)}>
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSaveToken}
                  disabled={!tokenInput}
                  isLoading={saveTokenMutation.isPending}
                >
                  Save Token
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Project selection — only shown when token is configured */}
      <div
        className={`rounded-lg border p-4 transition-colors ${
          !hasToken
            ? 'border-border-default bg-bg-secondary opacity-50'
            : 'border-accent-primary/30 bg-accent-primary/5'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <StepNumber step={2} completed={false} active={hasToken} />
          <span className="text-sm font-medium text-text-primary">프로젝트 선택</span>
        </div>

        {!hasToken ? (
          <p className="ml-7 mt-1 text-xs text-text-muted">
            위에서 Access Token을 먼저 저장해주세요.
          </p>
        ) : (
          <div className="ml-7 mt-3 space-y-4">
            {/* Tab selector */}
            <div className="flex rounded-lg bg-page p-0.5">
              {(['existing', 'new'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    tab === t
                      ? 'bg-surface-hover text-text-primary shadow-sm'
                      : 'text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  {t === 'existing' ? 'Existing Project' : 'New Project'}
                </button>
              ))}
            </div>

            <p className="text-xs text-text-tertiary">
              {tab === 'existing'
                ? 'Supabase 계정의 프로젝트를 선택하고 DB 비밀번호를 입력하면 자동으로 연결됩니다.'
                : '새 Supabase 프로젝트를 생성하면 비밀번호가 자동 설정되어 별도 입력 없이 바로 연결됩니다.'}
            </p>

            {tab === 'existing' && (
              <ExistingProjectForm
                projects={projects}
                isLoading={supabaseProjects.isLoading}
                selectedRef={selectedRef}
                dbPassword={dbPassword}
                onSelectRef={setSelectedRef}
                onPasswordChange={setDbPassword}
                onConnect={handleConnectExisting}
                isConnecting={isConnecting}
              />
            )}

            {tab === 'new' && (
              <NewProjectForm
                organizations={organizations}
                isLoadingOrgs={supabaseOrgs.isLoading}
                name={newName}
                region={newRegion}
                orgId={newOrgId}
                dbPassword={newDbPassword}
                onNameChange={setNewName}
                onRegionChange={setNewRegion}
                onOrgChange={setNewOrgId}
                onPasswordChange={setNewDbPassword}
                onCreateAndConnect={handleCreateAndConnect}
                isConnecting={isConnecting}
              />
            )}
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
          <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 flex-shrink-0">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Connecting progress */}
      {isConnecting && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
          <Spinner size="sm" />
          <div>
            <p className="text-sm font-medium text-blue-400">
              {createAndSetupMutation.isPending ? '프로젝트 생성 중...' : '데이터베이스 연결 중...'}
            </p>
            <p className="mt-0.5 text-xs text-blue-400/70">
              {createAndSetupMutation.isPending
                ? '새 프로젝트를 생성하고 스키마를 구성합니다. 최대 1분 정도 소요될 수 있습니다.'
                : '연결을 확인하고 스키마를 설정합니다. 잠시만 기다려주세요.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StepNumber({
  step,
  completed,
  active,
}: {
  readonly step: number;
  readonly completed: boolean;
  readonly active: boolean;
}) {
  if (completed) {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-green-400">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }

  return (
    <span
      className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
        active ? 'bg-accent-primary/20 text-accent-primary' : 'bg-surface-hover text-text-muted'
      }`}
    >
      {step}
    </span>
  );
}

interface ExistingProjectFormProps {
  readonly projects: readonly SupabaseProject[];
  readonly isLoading: boolean;
  readonly selectedRef: string;
  readonly dbPassword: string;
  readonly onSelectRef: (ref: string) => void;
  readonly onPasswordChange: (pw: string) => void;
  readonly onConnect: () => void;
  readonly isConnecting: boolean;
}

function ExistingProjectForm({
  projects,
  isLoading,
  selectedRef,
  dbPassword,
  onSelectRef,
  onPasswordChange,
  onConnect,
  isConnecting,
}: ExistingProjectFormProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6">
        <Spinner size="sm" />
        <span className="text-sm text-text-tertiary">프로젝트 목록을 불러오는 중...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-default py-6 text-center">
        <p className="text-sm text-text-tertiary">Supabase 계정에 프로젝트가 없습니다.</p>
        <p className="mt-1 text-xs text-text-muted">
          &ldquo;New Project&rdquo; 탭에서 새 프로젝트를 생성해보세요.
        </p>
      </div>
    );
  }

  const selectedProject = projects.find((p) => p.ref === selectedRef);
  const isInactive = selectedProject && selectedProject.status !== 'ACTIVE_HEALTHY';

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-secondary">
          Supabase Project
        </label>
        <select
          value={selectedRef}
          onChange={(e) => onSelectRef(e.target.value)}
          className="block w-full rounded-lg border border-border-input bg-page px-3 py-2 text-sm text-text-primary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select a project...</option>
          {projects.map((p) => (
            <option key={p.ref} value={p.ref}>
              {p.name} ({p.region}){p.status !== 'ACTIVE_HEALTHY' ? ` — ${p.status}` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedRef && (
        <>
          {isInactive && (
            <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 p-2.5 text-xs text-yellow-400">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>이 프로젝트는 현재 비활성 상태입니다. 연결이 실패할 수 있습니다.</span>
            </div>
          )}
          <div>
            <Input
              label="Database Password"
              value={dbPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="프로젝트 생성 시 설정한 DB 비밀번호"
              type="password"
            />
            <p className="mt-1 text-xs text-text-muted">
              Supabase 대시보드 → Project Settings → Database 에서 확인하거나 재설정할 수 있습니다.
            </p>
          </div>
        </>
      )}

      <div className="flex justify-end pt-1">
        <Button
          onClick={onConnect}
          disabled={!selectedRef || !dbPassword || isConnecting}
          isLoading={isConnecting}
        >
          Connect
        </Button>
      </div>
    </div>
  );
}

interface NewProjectFormProps {
  readonly organizations: readonly { readonly id: string; readonly name: string }[];
  readonly isLoadingOrgs: boolean;
  readonly name: string;
  readonly region: string;
  readonly orgId: string;
  readonly dbPassword: string;
  readonly onNameChange: (v: string) => void;
  readonly onRegionChange: (v: string) => void;
  readonly onOrgChange: (v: string) => void;
  readonly onPasswordChange: (v: string) => void;
  readonly onCreateAndConnect: () => void;
  readonly isConnecting: boolean;
}

function NewProjectForm({
  organizations,
  isLoadingOrgs,
  name,
  region,
  orgId,
  dbPassword,
  onNameChange,
  onRegionChange,
  onOrgChange,
  onPasswordChange,
  onCreateAndConnect,
  isConnecting,
}: NewProjectFormProps) {
  return (
    <div className="space-y-3">
      <Input
        label="Project Name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="my-contextsync-db"
        maxLength={40}
      />

      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-secondary">Organization</label>
        {isLoadingOrgs ? (
          <div className="flex items-center gap-2 py-2">
            <Spinner size="sm" />
            <span className="text-xs text-text-tertiary">Organization 목록을 불러오는 중...</span>
          </div>
        ) : (
          <select
            value={orgId}
            onChange={(e) => onOrgChange(e.target.value)}
            className="block w-full rounded-lg border border-border-input bg-page px-3 py-2 text-sm text-text-primary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select organization...</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-secondary">Region</label>
        <select
          value={region}
          onChange={(e) => onRegionChange(e.target.value)}
          className="block w-full rounded-lg border border-border-input bg-page px-3 py-2 text-sm text-text-primary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {SUPABASE_REGIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-text-muted">
          팀원들과 가까운 리전을 선택하면 지연 시간이 줄어듭니다.
        </p>
      </div>

      <div>
        <Input
          label="Database Password"
          value={dbPassword}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="6자 이상의 강력한 비밀번호"
          type="password"
        />
        <p className="mt-1 text-xs text-text-muted">
          이 비밀번호는 DB 연결에 사용됩니다. 잊어버리면 Supabase 대시보드에서 재설정할 수 있습니다.
        </p>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          onClick={onCreateAndConnect}
          disabled={!name || !orgId || !region || dbPassword.length < 6 || isConnecting}
          isLoading={isConnecting}
        >
          Create & Connect
        </Button>
      </div>
    </div>
  );
}
