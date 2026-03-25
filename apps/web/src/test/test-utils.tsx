import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, type RenderOptions, type RenderResult } from '@testing-library/react';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

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

/**
 * Call at describe-level to wire MSW server lifecycle.
 * Tests can still call server.use() to override individual handlers.
 */
export function setupMsw() {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
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
