import { Prisma, PrismaClient } from '@prisma/client';
import { decrypt, encrypt } from 'services/crypto';
import { GlobalCredentialOutputKV } from './gql_types/credential';
import { Provider } from './gql_types/integration';

export const getGlobalAPICredential = async <UserCred = Prisma.JsonObject>(
  prisma: PrismaClient,
  provider: Provider
): Promise<{
  globalCreds: Array<GlobalCredentialOutputKV>;
  sharedUserCreds: UserCred | null;
} | null> => {
  const cred = await prisma.globalApiCredential.findUnique({
    where: {
      provider,
    },
  });
  if (!cred) return null;

  // TODO(richardwu): what if secret key rotates? Invalidate all API credentials.
  const secretKey = process.env.API_CRED_AES_KEY;
  if (!secretKey) {
    throw new Error('missing API_CRED_AES_KEY envvar');
  }

  const globalCreds = JSON.parse(
    decrypt(
      { iv: cred.encryptionIV, content: cred.encryptedCredentials },
      secretKey
    )
  );

  const sharedUserCreds = cred.encryptedSharedUserCredentials
    ? JSON.parse(
        decrypt(
          {
            iv: cred.encryptionIV,
            content: cred.encryptedSharedUserCredentials,
          },
          secretKey
        )
      )
    : null;

  return { globalCreds, sharedUserCreds };
};

export const globalCredentialMap = (kvs: Array<GlobalCredentialOutputKV>) => {
  return Object.fromEntries(kvs.map(({ key, value }) => [key, value]));
};

export const updateGlobalSharedUserCredential = async (
  prisma: PrismaClient,
  provider: Provider,
  credentialsJSON: Prisma.JsonObject
) => {
  const secretKey = process.env.API_CRED_AES_KEY;
  if (!secretKey) {
    throw new Error('missing API_CRED_AES_KEY envvar');
  }

  // TODO(richardwu): wrap in PRISMA transaction once
  // https://github.com/prisma/prisma/issues/9846#issuecomment-1029837126 merges.
  const creds = await prisma.globalApiCredential.findUnique({
    where: {
      provider,
    },
  });
  if (!creds) {
    throw new Error(`no existing API credentials for ${provider}`);
  }

  const { content } = encrypt(
    JSON.stringify(credentialsJSON),
    secretKey,
    creds.encryptionIV
  );

  // TODO(richardwu): Recreate client(s) with new credentials if applicable.
  return await prisma.globalApiCredential.update({
    where: {
      provider,
    },
    data: {
      encryptedSharedUserCredentials: content,
      validSharedUserCredentials: true,
    },
  });
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
