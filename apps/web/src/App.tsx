import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppRoutes } from './routes';
import { LoginModal } from './components/auth/LoginModal';
import { UpgradeModal } from './components/auth/UpgradeModal';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useThemeSync } from './hooks/use-theme';
import { useLocaleSync } from './hooks/use-locale-sync';
import { useThemeStore } from './stores/theme.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function App() {
  useThemeSync();
  useLocaleSync();
  const theme = useThemeStore((s) => s.theme);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
          <LoginModal />
          <UpgradeModal />
        </BrowserRouter>
        <Toaster
          theme={theme}
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-default)',
              color: 'var(--color-text-primary)',
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
