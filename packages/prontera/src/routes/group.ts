import { User, prisma } from '@warpportal/prisma';
import { Application, Request, Response } from 'express';
export type GroupEntry = {
  // Group name
  gr_name: string;
  // Encrypted password (usually 'x' or '*')
  gr_passwd: string;
  // Group ID
  gr_gid: number;
  // List of group members
  gr_mem: string[];
};

export const userToGroupData = (user: User): GroupEntry => ({
  gr_name: user.local,
  gr_passwd: 'x',
  gr_gid: user.hash,
  gr_mem: [user.local],
});

export const groupRouter = (app: Application) =>
  app.get('/group', async (req: Request, res: Response) => {
    const name = req.query.name as string;
    const gid = req.query.gid as string;

    if (name) {
      const user = await prisma.user.findFirst({
        where: {
          local: name,
        },
      });

      if (user) {
        res.json(userToGroupData(user));
        return;
      }
    }
    if (gid) {
      const user = await prisma.user.findFirst({
        where: {
          hash: Number(gid),
        },
      });

      if (user) {
        res.json(userToGroupData(user));
        return;
      }
    }

    // TODO: in the examples we send back groups but for some reason this causes ssh to hang unless we 404 on the general queries.
    res.sendStatus(404);
  });
