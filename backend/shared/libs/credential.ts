import { PrismaClient } from '@prisma/client';
import { decrypt } from '../../services/crypto';
import { Provider } from './gql_types/integration';

export const getGlobalAPICredential = async (
  prisma: PrismaClient,
  provider: Provider
): Promise<{ [key: string]: any } | null> => {
  const cred = await prisma.globalApiCredential.findUnique({
    where: {
      provider,
    },
  });
  if (!cred) return null;

  const secretKey = process.env.API_CRED_AES_KEY;
  if (!secretKey) {
    throw new Error('missing API_CRED_AES_KEY envvar');
  }

  const exist = JSON.parse(
    decrypt(
      { iv: cred.encryptionIV, content: cred.encryptedCredentials },
      secretKey
    )
  );
  return exist;
};

export const getUserAPICredential = async (
  prisma: PrismaClient,
  provider: Provider,
  userId: string
): Promise<{ [key: string]: any } | null> => {
  const cred = await prisma.userApiCredential.findUnique({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
  });
  if (!cred) return null;

  const secretKey = process.env.API_CRED_AES_KEY;
  if (!secretKey) {
    throw new Error('missing API_CRED_AES_KEY envvar');
  }

  const exist = JSON.parse(
    decrypt(
      { iv: cred.encryptionIV, content: cred.encryptedCredentials },
      secretKey
    )
  );

  return exist;
};
