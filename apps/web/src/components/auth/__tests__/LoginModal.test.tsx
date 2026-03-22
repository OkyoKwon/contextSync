import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/test-utils';

vi.mock('../../../hooks/use-login-modal', () => ({
  useLoginModal: vi.fn(),
}));

vi.mock('../LoginHero', () => ({
  LoginHero: ({ compact }: { compact?: boolean }) => (
    <div data-testid="login-hero" data-compact={compact}>
      Login Hero Mock
    </div>
  ),
}));

import { useLoginModal } from '../../../hooks/use-login-modal';
import { LoginModal } from '../LoginModal';

describe('LoginModal', () => {
  it('renders modal when open', () => {
    vi.mocked(useLoginModal).mockReturnValue({
      isOpen: true,
      closeLoginModal: vi.fn(),
      openLoginModal: vi.fn(),
    });

    render(<LoginModal />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('login-hero')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    vi.mocked(useLoginModal).mockReturnValue({
      isOpen: false,
      closeLoginModal: vi.fn(),
      openLoginModal: vi.fn(),
    });

    render(<LoginModal />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('passes compact prop to LoginHero', () => {
    vi.mocked(useLoginModal).mockReturnValue({
      isOpen: true,
      closeLoginModal: vi.fn(),
      openLoginModal: vi.fn(),
    });

    render(<LoginModal />);
    expect(screen.getByTestId('login-hero')).toHaveAttribute('data-compact', 'true');
  });
});
