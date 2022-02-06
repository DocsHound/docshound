import { PrismaClient } from '@prisma/client';
import { buildSchema } from 'type-graphql';
import { logger } from 'logging';
import { MyGlobalApiCredentialResolver } from 'resolvers/global_api_credential';
import { MyUserApiCredentialResolver } from 'resolvers/user_api_credential';
import { SearchResolver } from 'resolvers/search';
import { authChecker } from './auth';
import { DummyAppRole, DummyUser } from 'shared/libs/gql_types/user';

export const makeClient = () => {
  const prisma = new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'stdout',
        level: 'error',
      },
      {
        emit: 'stdout',
        level: 'info',
      },
      {
        emit: 'stdout',
        level: 'warn',
      },
    ],
  });
  prisma.$on('query', (e) => {
    logger.info('Query: %s', e.query);
    logger.info('Duration: %d ms', e.duration);
  });

  return prisma;
};

export const makeSchema = async () => {
  const schema = await buildSchema({
    resolvers: [
      MyGlobalApiCredentialResolver,
      MyUserApiCredentialResolver,
      SearchResolver,
    ],
    orphanedTypes: [DummyAppRole, DummyUser],
    validate: false,
    // Return date fields as unix seconds (instead of ISO string).
    dateScalarMode: 'timestamp',
    authChecker,
    authMode: 'error',
  });
  return schema;
};
