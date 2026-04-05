import { useAuthStore } from '../../stores/auth.store';
import { useProjects } from '../../hooks/use-projects';
import { Badge } from '../ui/Badge';
import { CheckCircleIcon } from '../ui/icons';

const AVATAR_COLORS = [
  { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  { bg: 'bg-violet-500/20', text: 'text-violet-400' },
  { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  { bg: 'bg-rose-500/20', text: 'text-rose-400' },
  { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-400' },
  { bg: 'bg-lime-500/20', text: 'text-lime-400' },
  { bg: 'bg-teal-500/20', text: 'text-teal-400' },
] as const;

const SELECTED_COLOR = { bg: 'bg-blue-500/20', text: 'text-blue-400' } as const;

function getProjectColor(name: string): (typeof AVATAR_COLORS)[number] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}

const selectedClass =
  'relative flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm transition-colors bg-blue-500/10 font-medium text-blue-400 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-blue-400';

const unselectedClass =
  'relative flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm transition-colors text-text-secondary hover:bg-interactive-hover hover:text-text-primary';

export function ProjectSelector() {
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);

  const { data } = useProjects();
  const projects = data?.data ?? [];

  const handleSelect = (projectId: string) => {
    if (!projectId) return;
    setCurrentProject(projectId);
  };

  return (
    <div className="max-h-48 overflow-y-auto scrollbar-thin">
      {projects.length > 0 ? (
        <div className="space-y-0.5">
          {projects.map((project) => {
            const selected = currentProjectId === project.id;
            const color = selected ? SELECTED_COLOR : getProjectColor(project.name);
            return (
              <button
                key={project.id}
                onClick={() => handleSelect(project.id)}
                className={selected ? selectedClass : unselectedClass}
              >
                <div className="flex w-full items-center gap-2.5">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${color.bg} ${color.text}`}
                  >
                    {project.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{project.name}</span>
                      <Badge
                        variant={project.databaseMode === 'remote' ? 'success' : 'default'}
                        className="shrink-0"
                      >
                        {project.databaseMode === 'remote' ? 'Remote' : 'Local'}
                      </Badge>
                      {project.isTeam && (
                        <Badge variant="info" className="shrink-0">
                          Team
                        </Badge>
                      )}
                    </div>
                  </div>
                  {selected && <CheckCircleIcon size={16} className="shrink-0 text-blue-400" />}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="px-3 py-2 text-sm text-text-tertiary">No projects</p>
      )}
    </div>
  );
}
