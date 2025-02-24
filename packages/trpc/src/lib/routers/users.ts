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

    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          email: z.string(),
          name: z.string(),
        })
      )
      .mutation(async ({ ctx, input: { id, email, name } }) => {
        return ctx.db.user.update({
          where: { id },
          data: { email, name },
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
