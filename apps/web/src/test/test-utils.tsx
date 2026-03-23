import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, type RenderOptions, type RenderResult } from '@testing-library/react';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions): RenderResult {
  return render(ui, { wrapper: createWrapper(), ...options });
}

export function renderHookWithProviders<TResult>(hook: () => TResult) {
  return renderHook(hook, { wrapper: createWrapper() });
}

// Re-export everything from testing-library
export {
  render,
  renderHook,
  screen,
  waitFor,
  act,
  within,
  fireEvent,
} from '@testing-library/react';
