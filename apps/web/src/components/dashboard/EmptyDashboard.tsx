import { useNavigate } from 'react-router';
import { Button } from '../ui/Button';

export function EmptyDashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h2 className="text-lg font-semibold text-text-primary">
        No project selected
      </h2>
      <p className="mt-2 max-w-md text-center text-sm text-text-tertiary">
        Create a personal project to start tracking your sessions, or join a team to collaborate.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => navigate('/settings/project')}>
          Create Personal Project
        </Button>
        <Button variant="secondary" onClick={() => navigate('/settings/team')}>
          Create Team
        </Button>
      </div>
    </div>
  );
}
