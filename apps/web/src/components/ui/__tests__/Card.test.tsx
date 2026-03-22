import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default padding (md)', () => {
    render(<Card data-testid="card">Content</Card>);
    expect(screen.getByTestId('card')).toHaveClass('p-4');
  });

  it('applies none padding', () => {
    render(
      <Card padding="none" data-testid="card">
        Content
      </Card>,
    );
    const card = screen.getByTestId('card');
    expect(card).not.toHaveClass('p-3');
    expect(card).not.toHaveClass('p-4');
    expect(card).not.toHaveClass('p-6');
  });

  it('applies lg padding', () => {
    render(
      <Card padding="lg" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId('card')).toHaveClass('p-6');
  });

  it('merges custom className', () => {
    render(
      <Card className="custom-class" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId('card')).toHaveClass('custom-class');
  });
});
