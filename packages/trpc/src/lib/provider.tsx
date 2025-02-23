'use client';

import { trpc } from './util';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getFetch, httpBatchLink, loggerLink } from '@trpc/react-query';
import { useState } from 'react';
import superjson from 'superjson';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 1000 } },
});

export function TrpcProvider({ children }: { children: React.ReactNode }) {
  // NOTE: Your production URL environment variable may be different
  const url = `http://${process.env.NEXT_PUBLIC_APP_DOMAIN}/api/trpc/`;

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: () => true,
        }),
        httpBatchLink({
          url,
          fetch: async (input, init?) => {
            const fetch = getFetch();
            return fetch(input, {
              ...init,
            });
          },
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
