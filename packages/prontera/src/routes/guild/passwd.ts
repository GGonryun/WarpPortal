import { User, prisma } from '@warpportal/prisma';
import { Request, Response, Router } from 'express';

export type PasswdEntry = {
  // User's login name
  pw_name: string;
  // Encrypted password (usually 'x' or '*')
  pw_passwd: string;
  // User ID
  pw_uid: number;
  // Group ID
  pw_gid: number;
  // User's full name or comment field
  pw_gecos: string;
  // Home directory
  pw_dir: string;
  // Login shell
  pw_shell: string;
};

export const userToPasswdEntry = (user: User): PasswdEntry => ({
  pw_name: user.local,
  pw_passwd: 'x',
  pw_uid: user.hash,
  pw_gid: user.hash,
  pw_gecos: user.name,
  pw_dir: `/home/${user.local}`,
  pw_shell: user.shell,
});

export const passwdRouter: Router = Router({ mergeParams: true });

passwdRouter.get('/', async (req: Request, res: Response) => {
  const name = req.query.name as string;
  const uid = req.query.uid as string;

  if (name) {
    const user = await prisma.user.findFirst({
      where: {
        local: name,
      },
    });

    if (user) {
      res.json(userToPasswdEntry(user));
      return;
    }
  }

  if (uid) {
    const user = await prisma.user.findFirst({
      where: {
        hash: Number(uid),
      },
    });
    if (user) {
      res.json(userToPasswdEntry(user));
      return;
    }
  }
  // TODO: in the examples we send back groups but for some reason this causes ssh to hang unless we 404 on the general queries.
  res.sendStatus(404);
});
