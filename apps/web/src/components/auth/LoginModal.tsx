import { Modal } from '../ui/Modal';
import { LoginHero } from './LoginHero';
import { useLoginModal } from '../../hooks/use-login-modal';

export function LoginModal() {
  const { isOpen, closeLoginModal } = useLoginModal();

  return (
    <Modal isOpen={isOpen} onClose={closeLoginModal} title="">
      <LoginHero compact />
    </Modal>
  );
}
