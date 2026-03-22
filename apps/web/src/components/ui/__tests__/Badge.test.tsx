import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { Badge, SeverityBadge } from '../Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    render(<Badge data-testid="badge">Default</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('bg-zinc-500/15');
  });

  it('applies warning variant', () => {
    render(
      <Badge variant="warning" data-testid="badge">
        Warning
      </Badge>,
    );
    expect(screen.getByTestId('badge')).toHaveClass('bg-yellow-500/15');
  });

  it('applies critical variant', () => {
    render(
      <Badge variant="critical" data-testid="badge">
        Critical
      </Badge>,
    );
    expect(screen.getByTestId('badge')).toHaveClass('bg-red-500/15');
  });
});

describe('SeverityBadge', () => {
  it('renders severity text in uppercase', () => {
    render(<SeverityBadge severity="critical" />);
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('uses critical variant for critical severity', () => {
    const { container } = render(<SeverityBadge severity="critical" />);
    expect(container.querySelector('span')).toHaveClass('bg-red-500/15');
  });

  it('uses warning variant for warning severity', () => {
    const { container } = render(<SeverityBadge severity="warning" />);
    expect(container.querySelector('span')).toHaveClass('bg-yellow-500/15');
  });

  it('uses info variant for other severities', () => {
    const { container } = render(<SeverityBadge severity="low" />);
    expect(container.querySelector('span')).toHaveClass('bg-blue-500/15');
  });
});
