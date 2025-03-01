import { readFile } from 'fs/promises';
import { Certificate, parseCertificate, parseKey } from 'sshpk';

export const getFingerprint = (certificate: Certificate) => {
  try {
    return certificate.subjectKey.fingerprint('sha256').toString('base64');
  } catch (error) {
    throw new Error(`Failed to generate fingerprint: ${error}`);
  }
};

export const getSerial = (certificate: Certificate) => {
  const serial = certificate.serial;
  return hexToDecimal(serial.toString('hex'));
};

export const getKeyId = (certificate: Certificate) => {
  const keyId = certificate.signatures.openssh?.keyId;
  if (!keyId) {
    throw new Error('Key ID not found');
  }
  return keyId;
};

export const hexToDecimal = (hex: string) => {
  return parseInt(hex, 16);
};

export const tryParseCertificate = (certificate: string): Certificate => {
  try {
    return parseCertificate(certificate, 'openssh');
  } catch (error) {
    throw new Error(`Invalid certificate format: ${error}`);
  }
};

export const getTrustedPublicKeyPath = () => {
  return process.env.TRUSTED_CA_PUBLIC || '/etc/ssh/trusted_ca.pub';
};

export const getTrustedPrivateKeyPath = () => {
  return process.env.TRUSTED_CA_PRIVATE || '/etc/ssh/trusted_ca';
};

export const getTemporaryCertificatePath = () => {
  const path = process.env.TEMPORARY_CERTIFICATE_PATH;

  if (!path) {
    throw new Error('TEMPORARY_CERTIFICATE_PATH is not set');
  }

  return path;
};

export const readTrustedCertificate = async () => {
  const trustedCA = getTrustedPublicKeyPath();

  // Verify the certificate is signed by the trusted CA
  const raw = await readFile(trustedCA, 'utf8');
  const key = parseKey(raw, 'ssh');
  return { key, raw };
};
