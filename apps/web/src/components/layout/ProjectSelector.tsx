import { useAuthStore } from '../../stores/auth.store';
import { usePersonalProjects, useProjects } from '../../hooks/use-projects';
import { useTeams } from '../../hooks/use-teams';

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

  return (
    <div className="max-h-48 overflow-y-auto">
      {personalProjects.length > 0 && (
        <div>
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Personal Projects
          </p>
          {personalProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleSelect(project.id, null)}
              className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                currentProjectId === project.id
                  ? 'bg-blue-500/10 font-medium text-blue-400'
                  : 'text-text-secondary hover:bg-interactive-hover hover:text-text-primary'
              }`}
            >
              {project.name}
            </button>
          ))}
        </div>
      )}
      {teamProjects.length > 0 && (
        <div className={personalProjects.length > 0 ? 'mt-2' : ''}>
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {currentTeamName ? `Team: ${currentTeamName}` : 'Team Projects'}
          </p>
          {teamProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleSelect(project.id, project.teamId ?? null)}
              className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                currentProjectId === project.id
                  ? 'bg-blue-500/10 font-medium text-blue-400'
                  : 'text-text-secondary hover:bg-interactive-hover hover:text-text-primary'
              }`}
            >
              {project.name}
            </button>
          ))}
        </div>
      )}
      {personalProjects.length === 0 && teamProjects.length === 0 && (
        <p className="px-3 py-2 text-sm text-text-tertiary">No projects</p>
      )}
    </div>
  );
}
