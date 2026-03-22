import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { PageLayout } from '../PageLayout';

describe('PageLayout', () => {
  it('renders children', () => {
    render(<PageLayout>Page content</PageLayout>);
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('applies default maxWidth (md)', () => {
    const { container } = render(<PageLayout>Content</PageLayout>);
    expect(container.firstChild).toHaveClass('max-w-4xl');
  });

  it('applies xl maxWidth', () => {
    const { container } = render(<PageLayout maxWidth="xl">Content</PageLayout>);
    expect(container.firstChild).toHaveClass('max-w-6xl');
  });
});
