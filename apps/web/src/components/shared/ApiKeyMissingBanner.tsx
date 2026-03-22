import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../api/auth.api';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function ApiKeyMissingBanner() {
  const hasKey = useAuthStore((s) => s.user?.hasAnthropicApiKey ?? false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const saveMutation = useMutation({
    mutationFn: () => authApi.updateApiKey(apiKey),
    onSuccess: (response) => {
      if (response.data && token) {
        setAuth(token, response.data);
      }
      setApiKey('');
      setIsModalOpen(false);
    },
  });

  if (hasKey) return null;

  const handleClose = () => {
    setIsModalOpen(false);
    setApiKey('');
    saveMutation.reset();
  };

  const handleSave = () => {
    if (!apiKey.trim()) return;
    saveMutation.mutate();
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">&#9888;</span>
          <p className="text-sm text-yellow-300">
            Anthropic API Key is not configured. Please set your API Key to use this feature.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="shrink-0 rounded-md bg-yellow-500/20 px-3 py-1.5 text-sm font-medium text-yellow-300 transition-colors hover:bg-yellow-500/30"
        >
          Set API Key
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleClose} title="Set Anthropic API Key" size="sm">
        <div className="space-y-4">
          <Input
            label="API Key"
            type="password"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          {saveMutation.isError && (
            <p className="text-sm text-red-400">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : 'Failed to save API Key. Please try again.'}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              isLoading={saveMutation.isPending}
              disabled={!apiKey.trim()}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
