/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
import * as bodyParser from 'body-parser';
import { Request, Response } from 'express';
import morgan from 'morgan';
import { prisma } from '@warpportal/prisma';

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

const passwdData: PasswdEntry[] = [
  {
    pw_name: 'testuser1',
    pw_passwd: 'x',
    pw_uid: 6000,
    pw_gid: 6000,
    pw_gecos: 'Testing',
    pw_dir: '/home/testuser1',
    pw_shell: '/bin/bash',
  },
  {
    pw_name: 'testuser2',
    pw_passwd: 'x',
    pw_uid: 6001,
    pw_gid: 6000,
    pw_gecos: '',
    pw_dir: '/home/testuser2',
    pw_shell: '/bin/bash',
  },
  {
    pw_name: 'testuser3',
    pw_passwd: 'x',
    pw_uid: 6002,
    pw_gid: 6001,
    pw_gecos: '',
    pw_dir: '/home/testuser3',
    pw_shell: '/bin/bash',
  },
  {
    pw_name: 'testuser4',
    pw_passwd: 'x',
    pw_uid: 6003,
    pw_gid: 6001,
    pw_gecos: '',
    pw_dir: '/home/testuser4',
    pw_shell: '/bin/bash',
  },
];

const groupData: GroupEntry[] = [
  {
    gr_name: 'testgroup1',
    gr_passwd: 'x',
    gr_gid: 6000,
    gr_mem: ['testuser1', 'testuser2'],
  },
  {
    gr_name: 'testgroup2',
    gr_passwd: 'x',
    gr_gid: 6001,
    gr_mem: ['testuser3', 'testuser4'],
  },
];

const shadowData: ShadowEntry[] = [
  {
    sp_namp: 'testuser1',
    sp_lstchg: 16034,
    sp_min: 0,
    sp_max: 99999,
  },
  {
    sp_namp: 'testuser2',
    sp_lstchg: 16034,
    sp_min: 0,
    sp_max: 99999,
  },
  {
    sp_namp: 'testuser3',
    sp_lstchg: 16034,
    sp_min: 0,
    sp_max: 99999,
  },
  {
    sp_namp: 'testuser4',
    sp_lstchg: 16034,
    sp_min: 0,
    sp_max: 99999,
  },
];

app.get('/passwd', async (req: Request, res: Response) => {
  const users = await prisma.user.findMany();
  console.log('found users', users);
  const name = req.query.name as string;
  const uid = req.query.uid as string;

  if (name) {
    const entry = passwdData.find((entry) => entry.pw_name === name);
    if (entry) {
      res.json(entry);
      return;
    }
    res.sendStatus(404);
    return;
  }

  if (uid) {
    const entry = passwdData.find((entry) => entry.pw_uid.toString() === uid);
    if (entry) {
      res.json(entry);
      return;
    }
    res.sendStatus(404);
    return;
  }

  res.json(passwdData);
});

app.get('/group', (req: Request, res: Response) => {
  const name = req.query.name as string;
  const gid = req.query.gid as string;

  if (name) {
    const entry = groupData.find((entry) => entry.gr_name === name);
    if (entry) {
      res.json(entry);
      return;
    }
    res.sendStatus(404);
    return;
  }

  if (gid) {
    const entry = groupData.find((entry) => entry.gr_gid.toString() === gid);
    if (entry) {
      res.json(entry);
      return;
    }
    res.sendStatus(404);
    return;
  }

  res.json(groupData);
});

app.get('/shadow', (req: Request, res: Response) => {
  const name = req.query.name as string;

  if (name) {
    const entry = shadowData.find((entry) => entry.sp_namp === name);
    if (entry) {
      res.json(entry);
      return;
    }
    res.sendStatus(404);
    return;
  }

  res.json(shadowData);
});

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
server.on('error', console.error);
