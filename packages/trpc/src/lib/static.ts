import { createServerSideHelpers } from '@trpc/react-query/server';

import { appRouter } from './app';
import { createContext } from './context';
import superjson from 'superjson';

export const createStaticTrpc = async () =>
  createServerSideHelpers({
    transformer: superjson,
    router: appRouter,
    ctx: await createContext(),
  });
