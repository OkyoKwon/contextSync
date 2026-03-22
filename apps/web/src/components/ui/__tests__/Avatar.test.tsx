import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { Avatar } from '../Avatar';

describe('Avatar', () => {
  it('shows image when src is provided', () => {
    render(<Avatar src="https://example.com/avatar.png" name="John Doe" />);
    const img = screen.getByAltText('John Doe');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png');
  });

  it('shows initials when no src', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('handles single-word name', () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('limits initials to 2 characters', () => {
    render(<Avatar name="John Michael Doe" />);
    expect(screen.getByText('JM')).toBeInTheDocument();
  });

  it('applies size classes', () => {
    const { container } = render(<Avatar name="Test" size="lg" />);
    expect(container.firstChild).toHaveClass('h-10', 'w-10');
  });

  it('shows initials when src is null', () => {
    render(<Avatar src={null} name="Bob" />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});
