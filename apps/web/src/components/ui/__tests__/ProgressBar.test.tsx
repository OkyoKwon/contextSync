import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  it('displays percentage by default', () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('calculates percentage from value and max', () => {
    render(<ProgressBar value={3} max={10} />);
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('caps at 100%', () => {
    render(<ProgressBar value={150} max={100} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('handles max=0 gracefully', () => {
    render(<ProgressBar value={50} max={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('displays label when provided', () => {
    render(<ProgressBar value={50} label="Progress" />);
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('hides percentage when showPercentage is false', () => {
    render(<ProgressBar value={50} showPercentage={false} label="Progress" />);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });
});
