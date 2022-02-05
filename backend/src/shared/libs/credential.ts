import { Prisma, PrismaClient } from '@prisma/client';
import { decrypt } from 'services/crypto';
import { GlobalCredentialOutputKV } from './gql_types/credential';
import { Provider } from './gql_types/integration';

export const getGlobalAPICredential = async (
  prisma: PrismaClient,
  provider: Provider
): Promise<Array<GlobalCredentialOutputKV> | null> => {
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

export const globalCredentialMap = (kvs: Array<GlobalCredentialOutputKV>) => {
  return Object.fromEntries(kvs.map(({ key, value }) => [key, value]));
};

export const getUserAPICredential = async (
  prisma: PrismaClient,
  provider: Provider,
  userId: string
): Promise<Prisma.JsonObject | null> => {
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
