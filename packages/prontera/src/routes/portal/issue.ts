// Sample curl request to test the certificate verification

import fs from 'fs/promises';
import { Request, Response } from 'express';
import { prisma } from '@warpportal/prisma';
import { promisify } from 'util';
import { exec } from 'child_process';
import { randomUUID } from 'crypto';
import { portalRouter } from './router';
import {
  getTrustedPrivateKeyPath,
  getTemporaryCertificatePath,
  tryParseCertificate,
  getKeyId,
  getSerial,
  getFingerprint,
} from './util';

const execAsync = promisify(exec);

const generateCertificate = async (principal: string) => {
  const caPath = getTrustedPrivateKeyPath();
  const tempPath = getTemporaryCertificatePath();
  const identity = `${tempPath}/${principal}`;
  // make sure the path exists
  await fs.mkdir(tempPath, { recursive: true });
  // remove all files in the path
  await execAsync(`rm -rf ${identity}*`);
  // generate the basic certificate
  await execAsync(
    `ssh-keygen -t rsa -b 4096 -f ${identity} -C "${principal}" -N ""`
  );
  // fix permissions
  await execAsync(`chmod 600 ${identity}`);

  const id = randomUUID();
  const serial = Date.now();
  const expiration = '1h';
  await execAsync(
    `ssh-keygen -s ${caPath} -I ${id} -n ${principal} -V +${expiration} -z ${serial} ${identity}.pub`
  );

  // read the content of the certificate
  const certificate = await fs.readFile(`${identity}-cert.pub`, 'utf8');
  const parsed = tryParseCertificate(certificate);

  // clean up
  await execAsync(`rm -rf ${identity}*`);

  return parsed;
};

portalRouter.post('/issue', async (req: Request, res: Response) => {
  try {
    const { principal } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        email: principal,
      },
    });

    if (!user) {
      res.status(404).send({
        error: 'User not found',
      });
      return;
    }

    const certificate = await generateCertificate(principal);

    // save certificate to database
    const data = await prisma.certificate.create({
      data: {
        id: getKeyId(certificate),
        serial: getSerial(certificate),
        fingerprint: getFingerprint(certificate),
        expiresAt: certificate.validUntil,
        createdAt: certificate.validFrom,
        publicKey: certificate.toString('openssh').replace(/\n/g, ''),
        userId: user.id,
        revokedAt: null,
      },
    });

    res.send(data);
  } catch (error: any) {
    res.status(403).send({
      error: error.message,
    });
  }
});
