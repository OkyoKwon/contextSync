import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Spinner } from '../../ui/Spinner';

export const SUPABASE_REGIONS = [
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

export function NewProjectForm({
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
            <span className="text-xs text-text-tertiary">Loading organizations...</span>
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
          Choose a region close to your team for lower latency.
        </p>
      </div>

      <div>
        <Input
          label="Database Password"
          value={dbPassword}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="A strong password (min. 6 characters)"
          type="password"
        />
        <p className="mt-1 text-xs text-text-muted">
          This password is used for database connections. You can reset it later in the Supabase
          dashboard.
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
