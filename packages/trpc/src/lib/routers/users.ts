import publicProcedure from '../procedures/public';
import { router } from '../trpc';
import z from 'zod';

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
    }),
  }),
});
