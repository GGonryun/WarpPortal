import { createCallerFactory, mergeRouters } from './trpc';
import { createContext } from './context';
import { users } from './routers/users';

export const appRouter = mergeRouters(users);

export const createCaller = createCallerFactory(appRouter);

export const createAsyncCaller = async () => {
  const context = await createContext();
  return createCaller(context);
};
