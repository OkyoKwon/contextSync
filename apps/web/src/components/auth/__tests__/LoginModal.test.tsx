import { describe, it, expect, vi } from 'vitest';
import { render } from '../../../test/test-utils';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../hooks/use-login-modal', () => ({
  useLoginModal: vi.fn(),
}));

import { useLoginModal } from '../../../hooks/use-login-modal';
import { LoginModal } from '../LoginModal';

describe('LoginModal', () => {
  it('navigates to /identify when modal opens', () => {
    const closeLoginModal = vi.fn();
    vi.mocked(useLoginModal).mockReturnValue({
      isOpen: true,
      closeLoginModal,
      openLoginModal: vi.fn(),
    });

    render(<LoginModal />);
    expect(closeLoginModal).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/identify', { replace: true });
  });

  it('renders nothing when closed', () => {
    vi.mocked(useLoginModal).mockReturnValue({
      isOpen: false,
      closeLoginModal: vi.fn(),
      openLoginModal: vi.fn(),
    });

    const { container } = render(<LoginModal />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null (no modal rendered)', () => {
    vi.mocked(useLoginModal).mockReturnValue({
      isOpen: false,
      closeLoginModal: vi.fn(),
      openLoginModal: vi.fn(),
    });

    const { container } = render(<LoginModal />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});
