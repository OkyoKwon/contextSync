import { useAuthStore } from '../../stores/auth.store';
import { useProjects } from '../../hooks/use-projects';
import { Badge } from '../ui/Badge';
import { CheckCircleIcon, FolderIcon } from '../ui/icons';

export function ProjectSelector() {
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);

  const { data } = useProjects();
  const projects = data?.data ?? [];

  const handleSelect = (projectId: string) => {
    if (!projectId) return;
    setCurrentProject(projectId);
  };

  const isSelected = (projectId: string) => currentProjectId === projectId;

  const selectedClass =
    'relative flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors bg-blue-500/10 font-medium text-blue-400 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-blue-400';

  const unselectedClass =
    'relative flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors text-text-secondary hover:bg-interactive-hover hover:text-text-primary';

  return (
    <div className="max-h-48 overflow-y-auto">
      {projects.length > 0 ? (
        <div className="space-y-0.5">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleSelect(project.id)}
              className={isSelected(project.id) ? selectedClass : unselectedClass}
            >
              <FolderIcon
                size={16}
                className={
                  isSelected(project.id) ? 'shrink-0 text-blue-400' : 'shrink-0 text-text-muted'
                }
              />
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
              {isSelected(project.id) && (
                <CheckCircleIcon size={16} className="ml-auto shrink-0 text-blue-400" />
              )}
            </button>
          ))}
        </div>
      ) : (
        <p className="px-3 py-2 text-sm text-text-tertiary">No projects</p>
      )}
    </div>
  );
}
