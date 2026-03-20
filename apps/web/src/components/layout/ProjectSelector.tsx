import { useAuthStore } from '../../stores/auth.store';
import { usePersonalProjects, useProjects } from '../../hooks/use-projects';
import { useTeams } from '../../hooks/use-teams';
import { CheckCircleIcon, FolderIcon } from '../ui/icons';

export function ProjectSelector() {
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);
  const setCurrentTeam = useAuthStore((s) => s.setCurrentTeam);

  const { data: personalData } = usePersonalProjects();
  const { data: teamData } = useProjects();
  const { data: teamsData } = useTeams();

  const personalProjects = personalData?.data ?? [];
  const teamProjects = teamData?.data ?? [];
  const teams = teamsData?.data ?? [];

  const currentTeamId = useAuthStore((s) => s.currentTeamId);
  const currentTeamName = teams.find((t) => t.id === currentTeamId)?.name;

  const handleSelect = (projectId: string, teamId: string | null) => {
    if (!projectId) return;
    setCurrentTeam(teamId);
    setCurrentProject(projectId);
  };

  const isSelected = (projectId: string) => currentProjectId === projectId;

  const selectedClass =
    'relative flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors bg-blue-500/10 font-medium text-blue-400 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-blue-400';

  const unselectedClass =
    'relative flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors text-text-secondary hover:bg-interactive-hover hover:text-text-primary';

  return (
    <div className="max-h-48 overflow-y-auto">
      {personalProjects.length > 0 && (
        <div className="space-y-0.5">
          {personalProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleSelect(project.id, null)}
              className={isSelected(project.id) ? selectedClass : unselectedClass}
            >
              <FolderIcon
                size={16}
                className={isSelected(project.id) ? 'shrink-0 text-blue-400' : 'shrink-0 text-text-muted'}
              />
              <span className="truncate">{project.name}</span>
              {isSelected(project.id) && (
                <CheckCircleIcon size={16} className="ml-auto shrink-0 text-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}
      {teamProjects.length > 0 && (
        <div className={personalProjects.length > 0 ? 'mt-2' : ''}>
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {currentTeamName ? `Team: ${currentTeamName}` : 'Team Projects'}
          </p>
          <div className="space-y-0.5">
            {teamProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelect(project.id, project.teamId ?? null)}
                className={isSelected(project.id) ? selectedClass : unselectedClass}
              >
                <FolderIcon
                  size={16}
                  className={isSelected(project.id) ? 'shrink-0 text-blue-400' : 'shrink-0 text-text-muted'}
                />
                <span className="truncate">{project.name}</span>
                {isSelected(project.id) && (
                  <CheckCircleIcon size={16} className="ml-auto shrink-0 text-blue-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      {personalProjects.length === 0 && teamProjects.length === 0 && (
        <p className="px-3 py-2 text-sm text-text-tertiary">No projects</p>
      )}
    </div>
  );
}
