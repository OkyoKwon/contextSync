import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useLoginModal } from '../../hooks/use-login-modal';

export function LoginModal() {
  const { isOpen, closeLoginModal } = useLoginModal();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      closeLoginModal();
      navigate('/identify', { replace: true });
    }
  }, [isOpen, closeLoginModal, navigate]);

  return null;
}
