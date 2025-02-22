import { createCallerFactory, router } from './trpc';
import publicProcedure from './procedures/public';
import { createContext } from './context';

export const appRouter = router({
  sayHello: publicProcedure.query(({ ctx }) => {
    return { greeting: `Hello World!` };
  }),
});

export const createCaller = createCallerFactory(appRouter);

export const createAsyncCaller = async () => {
  const context = await createContext();
  return createCaller(context);
};

export type AppRouter = typeof appRouter;
