import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { projectsApi } from '../../api/projects.api';

export function ProjectSelector() {
  const currentTeamId = useAuthStore((s) => s.currentTeamId);
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);

  const { data } = useQuery({
    queryKey: ['projects', currentTeamId],
    queryFn: () => projectsApi.listByTeam(currentTeamId!),
    enabled: !!currentTeamId,
  });

  const projects = data?.data ?? [];

  return (
    <select
      value={currentProjectId ?? ''}
      onChange={(e) => setCurrentProject(e.target.value)}
      className="rounded-lg border border-border-input bg-page px-3 py-1.5 text-sm text-text-primary focus:border-blue-500 focus:outline-none"
    >
      <option value="">Select project</option>
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  );
}
