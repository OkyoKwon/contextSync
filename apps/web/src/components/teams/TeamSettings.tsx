import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { teamsApi } from '../../api/teams.api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

export function TeamSettings() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const queryClient = useQueryClient();
  const setCurrentTeam = useAuthStore((s) => s.setCurrentTeam);

  const createMutation = useMutation({
    mutationFn: () => teamsApi.create({ name, slug }),
    onSuccess: (result) => {
      if (result.data) {
        setCurrentTeam(result.data.id);
        queryClient.invalidateQueries({ queryKey: ['teams'] });
        setName('');
        setSlug('');
      }
    },
  });

  return (
    <Card>
      <h3 className="mb-4 text-lg font-semibold">Create Team</h3>
      <div className="space-y-3">
        <Input
          label="Team Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Team"
        />
        <Input
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          placeholder="my-team"
        />
        {createMutation.isError && (
          <p className="text-sm text-red-600">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : 'Failed to create team'}
          </p>
        )}
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!name || !slug || createMutation.isPending}
        >
          Create Team
        </Button>
      </div>
    </Card>
  );
}
