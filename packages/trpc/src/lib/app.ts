import { createCallerFactory, router } from './trpc';
import publicProcedure from './procedures/public';
import { createContext } from './context';

export const appRouter = router({
  sayHello: publicProcedure.query(({ ctx }) => {
    return { greeting: `Hello World!` };
  }),
  user: publicProcedure.query(async ({ ctx }) => {
    // wait for 5 seconds.
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return ctx.db.user.findUniqueOrThrow({ where: { id: 1 } });
  }),
});

export const createCaller = createCallerFactory(appRouter);

export const createAsyncCaller = async () => {
  const context = await createContext();
  return createCaller(context);
};

export type AppRouter = typeof appRouter;
