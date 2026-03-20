import { useCurrentProjectName } from '../../hooks/use-current-project-name';

interface PageBreadcrumbProps {
  readonly pageName: string;
}

export function PageBreadcrumb({ pageName }: PageBreadcrumbProps) {
  const projectName = useCurrentProjectName();

  if (!projectName) {
    return <h1 className="text-xl font-bold text-text-primary">{pageName}</h1>;
  }

  return (
    <h1 className="text-xl font-bold text-text-primary">
      <span className="text-text-tertiary">{projectName}</span>
      <span className="mx-2 text-text-muted">&gt;</span>
      <span>{pageName}</span>
    </h1>
  );
}
