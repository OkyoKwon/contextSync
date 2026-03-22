import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useUpgradeModal } from '../../hooks/use-upgrade-modal';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../stores/auth.store';
import { useT } from '../../i18n/use-translation';

export function UpgradeModal() {
  const { isOpen, onSuccess, closeUpgradeModal } = useUpgradeModal();
  const t = useT();
  const setAuth = useAuthStore((s) => s.setAuth);
  const currentUser = useAuthStore((s) => s.user);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;

    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.upgrade(name.trim(), email.trim(), currentUser.id);
      if (!response.data) {
        setError('Upgrade failed');
        return;
      }
      const { token, user } = response.data;
      setAuth(token, user);
      closeUpgradeModal();
      setName('');
      setEmail('');
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upgrade failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={closeUpgradeModal} title={t('upgrade.modal.title')}>
      <p className="mb-4 text-sm text-text-secondary">{t('upgrade.modal.description')}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          className="rounded-md border border-border-default bg-surface px-4 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-tertiary/60 focus:border-btn-primary-bg focus:outline-none"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="rounded-md border border-border-default bg-surface px-4 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-tertiary/60 focus:border-btn-primary-bg focus:outline-none"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="flex cursor-pointer items-center justify-center rounded-md bg-btn-primary-bg px-6 py-3 font-mono text-sm font-medium text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? '...' : t('upgrade.modal.submit')}
        </button>
      </form>
    </Modal>
  );
}
