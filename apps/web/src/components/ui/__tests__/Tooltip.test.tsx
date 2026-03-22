import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  it('renders children', () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
  });

  it('renders tooltip content', () => {
    render(
      <Tooltip content="Help text">
        <span>Target</span>
      </Tooltip>,
    );
    expect(screen.getByRole('tooltip')).toHaveTextContent('Help text');
  });

  it('renders default InfoIcon when no children', () => {
    render(<Tooltip content="Info" />);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });
});
