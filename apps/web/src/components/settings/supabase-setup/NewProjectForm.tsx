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
  readonly orgError: boolean;
  readonly onRetryOrgs?: () => void;
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
  orgError,
  onRetryOrgs,
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
        ) : orgError ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
            <p className="text-xs text-red-400">
              Failed to load organizations. Check your token permissions.
            </p>
            {onRetryOrgs && (
              <button
                type="button"
                onClick={onRetryOrgs}
                className="mt-1.5 text-xs font-medium text-red-400 underline underline-offset-2 hover:text-red-300"
              >
                Retry
              </button>
            )}
          </div>
        ) : organizations.length === 0 ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <p className="text-xs text-amber-400">
              No organizations found. Create one on Supabase first.
            </p>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-amber-400 underline underline-offset-2 hover:text-amber-300"
            >
              Open Supabase Dashboard
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                <path
                  fillRule="evenodd"
                  d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
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
