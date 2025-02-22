import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createContext } from '@warpportal/trpc';
import { appRouter } from '@warpportal/trpc/server';
const handler = (request: Request) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: createContext,
  });
};

export { handler as GET, handler as POST };
