// IMPORTANT: Create a stable getter for the query client that

import { cache } from 'react';
import { appRouter } from './app';
import { createCallerFactory } from './trpc';
import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from '@tanstack/react-query';
import { createHydrationHelpers } from '@trpc/react-query/rsc';
import { createInnerContext } from './context';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
      hydrate: {},
    },
  });
}

export const getQueryClient = cache(makeQueryClient);
const caller = createCallerFactory(appRouter)(cache(createInnerContext));
export const { trpc, HydrateClient } = createHydrationHelpers<typeof appRouter>(
  caller,
  getQueryClient
);
