import { PrismaClient } from '@prisma/client';
import { AuthChecker, buildSchema } from 'type-graphql';
import { GraphQLContext } from '../types';
import { captureErrorMsg } from './errors';
import { MyGlobalApiCredentialResolver } from '../resolvers/global_api_credential';
import { MyUserApiCredentialResolver } from '../resolvers/user_api_credential';

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
    console.log('Query: ' + e.query);
    console.log('Duration: ' + e.duration + 'ms');
  });

  return prisma;
};

export const makeSchema = async () => {
  const schema = await buildSchema({
    resolvers: [MyGlobalApiCredentialResolver, MyUserApiCredentialResolver],
    validate: false,
    // Return date fields as unix seconds (instead of ISO string).
    dateScalarMode: 'timestamp',
    authChecker,
    authMode: 'error',
  });
  return schema;
};

const authChecker: AuthChecker<GraphQLContext> = ({ context, info }, roles) => {
  const opName = `${info.path.typename} ${info.path.key}`;

  if (
    !context.serverAdmin &&
    (!context.user || !roles.includes(context.user.role))
  ) {
    captureErrorMsg(
      `endpoint "${opName}" requires ${roles} roles, user ${context.user?.id} has role ${context.user?.role}`
    );
    return false;
  }

  return true;
};
