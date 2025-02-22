import { initTRPC } from '@trpc/server';

import { InnerContext } from './context';
import superjson from 'superjson';

const t = initTRPC.context<InnerContext>().create({
  transformer: superjson,
});

export const middleware = t.middleware;
export const createCallerFactory = t.createCallerFactory;
export const mergeRouters = t.mergeRouters;

export const router = t.router;
export const procedure = t.procedure;
