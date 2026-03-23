import { DirectoryPicker } from '../projects/DirectoryPicker';
import { Button } from '../ui/Button';

interface DirectoryStepProps {
  readonly value: string | null;
  readonly onChange: (dir: string | null) => void;
  readonly onBack: () => void;
  readonly onCreate: () => void;
  readonly isPending: boolean;
}

export function DirectoryStep({
  value,
  onChange,
  onBack,
  onCreate,
  isPending,
}: DirectoryStepProps) {
  return (
    <div className="space-y-4">
      <DirectoryPicker value={value} onChange={onChange} />
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onCreate} disabled={isPending}>
          Create Project
        </Button>
      </div>
    </div>
  );
}
