// Sample curl request to test the certificate verification

import fs from 'fs/promises';
import { Request, Response, Router } from 'express';
import { prisma, User } from '@warpportal/prisma';
import { promisify } from 'util';
import { exec } from 'child_process';
import { randomUUID } from 'crypto';
import {
  getTrustedPrivateKeyPath,
  getTemporaryCertificatePath,
  tryParseCertificate,
  getKeyId,
  getSerial,
  getFingerprint,
} from './util';

const execAsync = promisify(exec);

const generateCertificate = async (
  { email, local }: User,
  publicKey: string
) => {
  const caPath = getTrustedPrivateKeyPath();
  const tempPath = getTemporaryCertificatePath();
  const identity = `${tempPath}/${local}`;
  // make sure the path exists
  await fs.mkdir(tempPath, { recursive: true });
  // remove all files in the path
  await execAsync(`rm -rf ${identity}*`);
  // save the public key as a file
  await fs.writeFile(
    `${identity}.pub`,
    `${publicKey.replace('\n', '')} ${email}`
  );
  // update permissions
  await execAsync(`chmod 644 ${identity}.pub`);

  const id = randomUUID();
  const serial = Date.now();
  const expiration = '1h';

  await execAsync(
    `ssh-keygen -s ${caPath} -I ${id} -n ${local} -V +${expiration} -z ${serial} ${identity}.pub`
  );

  // read the content of the certificate
  const raw = await fs.readFile(`${identity}-cert.pub`, 'utf8');
  const parsed = tryParseCertificate(raw);

  // clean up
  await execAsync(`rm -rf ${identity}*`);

  return { raw, parsed };
};

export const issueCertificate = async (user: User, publicKey: string) => {
  const { raw, parsed } = await generateCertificate(user, publicKey);

  // save certificate to database
  await prisma.certificate.create({
    data: {
      id: getKeyId(parsed),
      serial: getSerial(parsed),
      fingerprint: getFingerprint(parsed),
      expiresAt: parsed.validUntil,
      createdAt: parsed.validFrom,
      publicKey: parsed.toString('openssh').replace(/\n/g, ''),
      userId: user.id,
      revokedAt: null,
    },
  });

  return raw;
};

export const issueRouter: Router = Router({ mergeParams: true });

issueRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { email, 'public-key': publicKey } = req.body;

    if (!email || !publicKey) {
      res.status(400).send({
        error: 'Missing email or public-key',
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      res.status(401).send({
        error: 'User does not exist in directory',
      });
      return;
    }

    const certificate = await issueCertificate(user, publicKey);

    if (!certificate) {
      res.status(500).send({
        error: 'Unable to issue certificate',
      });
      return;
    }

    res.send(certificate);
  } catch (error: any) {
    console.error(error);
    res.status(403).send({
      error: error.message,
    });
  }
});
