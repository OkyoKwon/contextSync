import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { Select } from '../Select';

describe('Select', () => {
  it('renders with label', () => {
    render(
      <Select label="Role">
        <option value="admin">Admin</option>
        <option value="member">Member</option>
      </Select>,
    );
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
  });

  it('renders options', () => {
    render(
      <Select label="Role">
        <option value="admin">Admin</option>
      </Select>,
    );
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(
      <Select label="Role" error="Required">
        <option>Pick one</option>
      </Select>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });

  it('sets aria-invalid when error exists', () => {
    render(
      <Select label="Role" error="Invalid">
        <option>Pick one</option>
      </Select>,
    );
    expect(screen.getByLabelText('Role')).toHaveAttribute('aria-invalid', 'true');
  });
});
