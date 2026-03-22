import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { StepWizard } from '../StepWizard';

const steps = [
  { id: 'step1', label: 'Setup' },
  { id: 'step2', label: 'Configure' },
  { id: 'step3', label: 'Finish' },
];

describe('StepWizard', () => {
  it('renders all step labels', () => {
    render(<StepWizard steps={steps} currentStepId="step1" />);
    expect(screen.getByText('Setup')).toBeInTheDocument();
    expect(screen.getByText('Configure')).toBeInTheDocument();
    expect(screen.getByText('Finish')).toBeInTheDocument();
  });

  it('shows step numbers for non-completed steps', () => {
    render(<StepWizard steps={steps} currentStepId="step1" />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows check icon for completed steps', () => {
    const { container } = render(<StepWizard steps={steps} currentStepId="step3" />);
    // Steps 1 and 2 are completed, should have SVG check marks
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });
});
