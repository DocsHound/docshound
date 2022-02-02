import crypto from 'crypto';

const ALGORITHM = 'aes-256-ctr';
const IV = crypto.randomBytes(16);

type Payload = {
  iv: string;
  content: string;
};

export const encrypt = (text: string, secretKeyB64: string): Payload => {
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(secretKeyB64, 'base64'),
    IV
  );
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return {
    iv: IV.toString('hex'),
    content: encrypted.toString('hex'),
  };
};

export const decrypt = (payload: Payload, secretKeyB64: string): string => {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(secretKeyB64, 'base64'),
    Buffer.from(payload.iv, 'hex')
  );

  const decrpyted = Buffer.concat([
    decipher.update(Buffer.from(payload.content, 'hex')),
    decipher.final(),
  ]);

  return decrpyted.toString();
};
