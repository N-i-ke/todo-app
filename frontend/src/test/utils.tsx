import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';

import { AuthProvider } from '../contexts/AuthContext';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  options: { withAuth?: boolean } & Omit<RenderOptions, 'wrapper'> = {},
) {
  const { withAuth = false, ...rest } = options;
  const queryClient = makeQueryClient();

  const Wrapper = ({ children }: { children: ReactNode }) => {
    if (withAuth) {
      return (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      );
    }
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };

  return { ...render(ui, { wrapper: Wrapper, ...rest }), queryClient };
}
