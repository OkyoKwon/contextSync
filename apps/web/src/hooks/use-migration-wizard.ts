import { useState, useCallback } from 'react';
import type { DbProvider } from '@context-sync/shared';

export type WizardStep = 'setup' | 'preview' | 'execute' | 'complete';

interface WizardState {
  readonly step: WizardStep;
  readonly connectionUrl: string;
  readonly provider: DbProvider;
  readonly sslEnabled: boolean;
  readonly isOpen: boolean;
}

const INITIAL_STATE: WizardState = {
  step: 'setup',
  connectionUrl: '',
  provider: 'supabase',
  sslEnabled: true,
  isOpen: false,
};

export function useMigrationWizard() {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  const open = useCallback(() => {
    setState({ ...INITIAL_STATE, isOpen: true });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const setStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const setConnectionInfo = useCallback(
    (info: { connectionUrl: string; provider: DbProvider; sslEnabled: boolean }) => {
      setState((prev) => ({ ...prev, ...info }));
    },
    [],
  );

  return {
    ...state,
    open,
    close,
    setStep,
    setConnectionInfo,
  };
}
