/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
import * as bodyParser from 'body-parser';
import { Request, Response } from 'express';
import morgan from 'morgan';
import { prisma, User } from '@warpportal/prisma';

const app = express();
app.use(morgan('combined'));
app.use(bodyParser.json());

type PasswdEntry = {
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

type GroupEntry = {
  // Group name
  gr_name: string;
  // Encrypted password (usually 'x' or '*')
  gr_passwd: string;
  // Group ID
  gr_gid: number;
  // List of group members
  gr_mem: string[];
};

type ShadowEntry = {
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

const userToPasswdEntry = (user: User): PasswdEntry => ({
  pw_name: user.local,
  pw_passwd: 'x',
  pw_uid: user.hash,
  pw_gid: user.hash,
  pw_gecos: user.name,
  pw_dir: `/home/${user.local}`,
  pw_shell: user.shell,
});

const userToGroupData = (user: User): GroupEntry => ({
  gr_name: user.local,
  gr_passwd: 'x',
  gr_gid: user.hash,
  gr_mem: [user.local],
});

const userToShadowData = (user: User): ShadowEntry => ({
  sp_namp: user.local,
  sp_lstchg: 16034,
  sp_min: 0,
  sp_max: 99999,
  sp_warn: 7,
  sp_pwdp: '$1$BXZIu72k$S7oxt9hBiBl/O3Rm3H4Q30',
});

app.get('/passwd', async (req: Request, res: Response) => {
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

app.get('/shadow', async (req: Request, res: Response) => {
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

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
server.on('error', console.error);
