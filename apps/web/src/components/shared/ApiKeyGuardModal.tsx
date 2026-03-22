import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useApiKeyGuard } from '../../hooks/use-api-key-guard';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../api/auth.api';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function ApiKeyGuardModal() {
  const { isOpen, onSuccess, closeApiKeyGuard } = useApiKeyGuard();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  const [apiKey, setApiKey] = useState('');

  const saveMutation = useMutation({
    mutationFn: () => authApi.updateApiKey(apiKey),
    onSuccess: (response) => {
      if (response.data && token) {
        setAuth(token, response.data);
      }
      setApiKey('');
      closeApiKeyGuard();
      onSuccess?.();
    },
  });

  const handleClose = () => {
    setApiKey('');
    saveMutation.reset();
    closeApiKeyGuard();
  };

  const handleSave = () => {
    if (!apiKey.trim()) return;
    saveMutation.mutate();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Set Anthropic API Key" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          An Anthropic API Key is required to use this feature. Please enter your key to continue.
        </p>
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
  );
}
