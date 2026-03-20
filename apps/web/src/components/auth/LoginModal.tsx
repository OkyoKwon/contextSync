import { DarkModal } from '../ui/DarkModal';
import { LoginHero } from './LoginHero';
import { useLoginModal } from '../../hooks/use-login-modal';

export function LoginModal() {
  const { isOpen, closeLoginModal } = useLoginModal();

  return (
    <DarkModal isOpen={isOpen} onClose={closeLoginModal}>
      <LoginHero compact />
    </DarkModal>
  );
}
