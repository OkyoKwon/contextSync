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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;

    const personalMatch = personalProjects.find((p) => p.id === value);
    if (personalMatch) {
      setCurrentTeam(null);
      setCurrentProject(value);
      return;
    }

    const teamMatch = teamProjects.find((p) => p.id === value);
    if (teamMatch && teamMatch.teamId) {
      setCurrentTeam(teamMatch.teamId);
      setCurrentProject(value);
    }
  };

  return (
    <select
      value={currentProjectId ?? ''}
      onChange={handleChange}
      className="rounded-lg border border-border-input bg-page px-3 py-1.5 text-sm text-text-primary focus:border-blue-500 focus:outline-none"
    >
      <option value="">Select project</option>
      {personalProjects.length > 0 && (
        <optgroup label="Personal Projects">
          {personalProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </optgroup>
      )}
      {teamProjects.length > 0 && (
        <optgroup label={currentTeamName ? `Team: ${currentTeamName}` : 'Team Projects'}>
          {teamProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
