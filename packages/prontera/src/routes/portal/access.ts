import { Request, Response } from 'express';
import { portalRouter } from './router';
import { getSerial, readTrustedCertificate, tryParseCertificate } from './util';
import { PolicyAction } from '@warpportal/prisma';
import { Certificate } from 'sshpk';

const tryValidateCertificateRevocation = async (certificate: Certificate) => {
  const check = await prisma.certificate.findFirst({
    where: {
      serial: getSerial(certificate),
    },
  });

  if (!check) {
    throw new Error('Certificate was not issued by the CA');
  }

  if (check.revokedAt) {
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

  return user.local;
};

const tryValidateCertificateExpiration = (certificate: Certificate) => {
  if (certificate.isExpired()) {
    throw new Error('Certificate has expired');
  }
};

const tryValidatePolicy = async (principal: string, hostname: string) => {
  const policies = await prisma.policy.findMany({
    where: {
      source: principal,
      destination: hostname,
    },
  });

  if (policies.length === 0) {
    throw new Error('Policy does not exist');
  }

  if (policies.some((policy) => policy.action === 'DENY')) {
    throw new Error('Policy is DENY');
  }

  if (
    !policies.some((policy) =>
      [PolicyAction.SUDO, PolicyAction.ALLOW].some(
        (action) => action === policy.action
      )
    )
  ) {
    throw new Error('Policy is not ALLOW or SUDO');
  }
};

const verifyCertificate = async (
  hostname: string,
  publicKey: string
): Promise<string | undefined> => {
  const sshCert = tryParseCertificate(publicKey);

  // The certificate must be signed by the trusted CA
  const ca = await tryValidateCertificateSignature(sshCert);
  // The certificate must not be expired
  tryValidateCertificateExpiration(sshCert);
  // The certificate has not been revoked by the CA.
  await tryValidateCertificateRevocation(sshCert);
  // The certificate must have a valid user principal
  const principal = await tryValidateUserPrincipal(sshCert);
  // the certificate's principal has a policy granting access to the server
  tryValidatePolicy(principal, hostname);
  // return valid access key
  return `cert-authority ${ca}`;
};

portalRouter.post('/access', async (req: Request, res: Response) => {
  const { 'public-key': publicKey, destination } = req.body;

  try {
    res.send(await verifyCertificate(destination, publicKey));
  } catch (error: any) {
    res.status(403).send({
      error: error.message,
    });
  }
});
