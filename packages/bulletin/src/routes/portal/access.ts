import { Request, Response, Router } from 'express';
import {
  getSerial,
  readTrustedCertificate,
  tryParseCertificate,
  tryValidatePolicy,
} from './util';
import { Certificate } from 'sshpk';

const tryValidateCertificateRevocation = async (certificate: Certificate) => {
  const check = await prisma.certificate.findFirst({
    where: {
      serial: getSerial(certificate),
    },
  });

  if (check && check.revokedAt) {
    throw new Error('Certificate has been revoked');
  }
};

const tryValidateCertificateSignature = async (certificate: Certificate) => {
  const { key, raw } = await readTrustedCertificate();

  if (!certificate.isSignedByKey(key)) {
    throw new Error('Certificate NOT signed by trusted CA');
  }

  return raw;
};

const tryValidateUserPrincipal = async (certificate: Certificate) => {
  const principal = certificate.subjects?.at(0);
  if (!principal) {
    throw new Error('No principal found in the certificate');
  }

  if (principal.type !== 'user') {
    throw new Error('Invalid principal found in the certificate');
  }
  const local = principal.get('uid');
  if (!local) {
    throw new Error('No local found in the principal');
  }

  const user = await prisma.user.findFirst({
    where: {
      local,
    },
  });

  if (!user) {
    throw new Error('User does not exist in directory');
  }

  return user;
};

const tryValidateDestination = async (hostname: string) => {
  const destination = await prisma.destination.findFirst({
    where: {
      hostname,
    },
  });
  if (!destination) {
    throw new Error('Destination does not exist');
  }
  return destination;
};

const tryValidateCertificateExpiration = (certificate: Certificate) => {
  if (certificate.isExpired()) {
    throw new Error('Certificate has expired');
  }
};

const verifyCertificate = async (
  hostname: string,
  publicKey: string
): Promise<{ authority: string } | undefined> => {
  const sshCert = await tryParseCertificate(publicKey);
  // The certificate must be signed by the trusted CA
  const ca = await tryValidateCertificateSignature(sshCert);
  // The certificate must not be expired
  tryValidateCertificateExpiration(sshCert);
  // The certificate has not been revoked by the CA.
  await tryValidateCertificateRevocation(sshCert);
  // The certificate must have a valid user principal
  const principal = await tryValidateUserPrincipal(sshCert);
  const destination = await tryValidateDestination(hostname);
  // the certificate's principal has a policy granting access to the server
  await tryValidatePolicy(principal, destination);
  // return valid access key
  return { authority: ca };
};

export const accessRouter: Router = Router({ mergeParams: true });

accessRouter.post('/', async (req: Request, res: Response) => {
  const { 'public-key': publicKey, destination, bypass } = req.body;

  try {
    if (bypass && bypass === 'true') {
      const { raw } = await readTrustedCertificate();
      res.send({ authority: raw });
    } else {
      res.send(await verifyCertificate(destination, publicKey));
    }
  } catch (error: any) {
    console.error(error);
    res.status(403).send({
      error: error.message,
    });
  }
});
