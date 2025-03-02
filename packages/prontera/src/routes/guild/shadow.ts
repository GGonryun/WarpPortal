import { User, prisma } from '@warpportal/prisma';
import { Request, Response, Router } from 'express';
import { guildRouter } from './router';

export type ShadowEntry = {
  // User's login name should match pw_name
  sp_namp: string;
  // Date of last password change (days since Jan 1, 1970)
  sp_lstchg: number;
  // Minimum number of days between password changes
  sp_min: number;
  // Maximum number of days the password is valid
  sp_max: number;
  // Number of days before password expiration to warn the user
  sp_warn?: number;
  // Encrypted password
  sp_pwdp?: string;
  // Number of inactive days after password expiration before the account is locked
  sp_inact?: number;
  // Number of days since Jan 1, 1970 until the account is disabled
  sp_expire?: number;
  // Reserved field for future use
  sp_flag?: number;
};

export const userToShadowData = (user: User): ShadowEntry => ({
  sp_namp: user.local,
  sp_lstchg: 16034,
  sp_min: 0,
  sp_max: 99999,
  sp_warn: 7,
  sp_pwdp: '$1$BXZIu72k$S7oxt9hBiBl/O3Rm3H4Q30',
});

export const shadowRouter: Router = Router({ mergeParams: true });

shadowRouter.get('/', async (req: Request, res: Response) => {
  const name = req.query.name as string;

  if (name) {
    const user = await prisma.user.findFirst({
      where: {
        local: name,
      },
    });
    if (user) {
      res.json(userToShadowData(user));
      return;
    }
  }
  // TODO: in the examples we send back groups but for some reason this causes ssh to hang unless we 404 on the general queries.
  res.sendStatus(404);
});
