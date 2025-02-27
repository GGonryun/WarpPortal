import publicProcedure from '../procedures/public';
import { router } from '../trpc';
import crypto from 'node:crypto';
import { shellSchema } from '@warpportal/shared';
import z from 'zod';
import { TrpcContext } from '../context';

export const users = router({
  users: router({
    list: publicProcedure.query(async ({ ctx }) => {
      return ctx.db.user.findMany();
    }),
    get: publicProcedure
      .input(
        z.object({
          id: z.number(),
        })
      )
      .query(async ({ ctx, input: { id } }) => {
        return ctx.db.user.findUniqueOrThrow({
          where: { id },
        });
      }),
    create: publicProcedure
      .input(
        z.object({
          email: z.string(),
          name: z.string(),
          shell: shellSchema,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { email, name, shell } = input;
        const [local, domain] = email.split('@');

        const hash = await computeDecimalHash(ctx, email);

        return ctx.db.user.create({
          data: { email, name, hash, shell, local, domain },
        });
      }),
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          email: z.string(),
          name: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, email, name } = input;

        const [local, domain] = email.split('@');
        const hash = await computeDecimalHash(ctx, email);

        return ctx.db.user.update({
          where: { id },
          data: { email, name, local, domain, hash },
        });
      }),
    attributes: router({
      list: publicProcedure
        .input(z.object({ userId: z.number() }))
        .query(async ({ ctx, input: { userId } }) => {
          return ctx.db.userAttributes.findMany({
            where: {
              userId,
            },
          });
        }),
      upsert: publicProcedure
        .input(
          z.object({
            id: z.string().optional(),
            key: z.string(),
            value: z.string(),
            userId: z.number(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const { id, userId, key, value } = input;
          if (!id) {
            return ctx.db.userAttributes.create({
              data: {
                key,
                value,
                userId,
              },
            });
          } else {
            return ctx.db.userAttributes.update({
              where: {
                id,
              },
              data: {
                key,
                value,
              },
            });
          }
        }),
    }),
  }),
});

/**
 * Attempts to compute a unique hash for the user based on their email.
 * This is a brute force method and should be replaced with a more efficient algorithm.
 */
const computeDecimalHash = async (ctx: TrpcContext, email: string) => {
  const startingHash = crypto.createHash('sha256').update(email).digest('hex');

  let hash = parseInt(startingHash, 16) % 999999999;

  let find = await ctx.db.user.findFirst({
    where: {
      hash,
    },
  });

  while (find) {
    hash++;
    // try again.
    find = await ctx.db.user.findFirst({
      where: {
        hash: hash,
      },
    });
  }

  return hash;
};
