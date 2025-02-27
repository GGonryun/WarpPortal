import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { prisma } from '@warpportal/prisma';

type Session = {
  userId: string;
  roles: string[];
};

interface CreateInnerContextOptions extends Partial<CreateNextContextOptions> {
  session: Session | null | undefined;
}

export async function createInnerContext(options?: CreateInnerContextOptions) {
  return {
    db: prisma,
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
export type TrpcContext = Awaited<ReturnType<typeof createContext>>;
