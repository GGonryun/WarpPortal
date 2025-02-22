import { CreateNextContextOptions } from '@trpc/server/adapters/next';

type Session = {
  userId: string;
  roles: string[];
};

interface CreateInnerContextOptions extends Partial<CreateNextContextOptions> {
  session: Session | null | undefined;
}

export async function createInnerContext(options?: CreateInnerContextOptions) {
  return {
    db: {},
    session: options?.session ?? null,
  };
}

export async function createContext() {
  const session = {
    userId: '1',
    roles: ['user'],
  };
  const inner = await createInnerContext({ session });

  return inner;
}

export type InnerContext = Awaited<ReturnType<typeof createInnerContext>>;
export type Context = Awaited<ReturnType<typeof createContext>>;
