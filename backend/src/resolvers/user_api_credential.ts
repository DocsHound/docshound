import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import * as GraphQLScalars from 'graphql-scalars';
import { UserApiCredential } from '@generated/type-graphql';
import { AppRole, Prisma } from '@prisma/client';
import { GraphQLContext } from 'types';
import { encrypt } from 'services/crypto';
import { DecryptedUserApiCredential } from 'shared/libs/gql_types/credential';
import { getUserAPICredential } from 'shared/libs/credential';
import { Provider } from 'shared/libs/gql_types/integration';

@Resolver((_of) => UserApiCredential)
export class MyUserApiCredentialResolver {
  @Authorized(AppRole.USER)
  @Mutation((_returns) => UserApiCredential)
  async upsertUserApiCredential(
    @Ctx() ctx: GraphQLContext,
    @Arg('provider', (_type) => Provider) provider: Provider,
    @Arg('credentialsJSON', (_type) => GraphQLScalars.JSONObjectResolver)
    credentialsJSON: Prisma.JsonObject,
    @Arg('userId', { nullable: true }) userId?: string
  ): Promise<UserApiCredential> {
    const secretKey = process.env.API_CRED_AES_KEY;
    if (!secretKey) {
      throw new Error('missing API_CRED_AES_KEY envvar');
    }

    if (userId && ctx.user && userId !== ctx.user.id) {
      throw new Error(
        `passed in userId ${userId} does not match signed in userId ${ctx.user.id}`
      );
    }

    if (!userId) {
      if (!ctx.user)
        throw new Error(
          'requires user to be signed in or userId to be passed in'
        );
      userId = ctx.user.id;
    }

    const { iv, content } = encrypt(JSON.stringify(credentialsJSON), secretKey);

    return await ctx.prisma.userApiCredential.upsert({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      update: {
        encryptionIV: iv,
        encryptedCredentials: content,
      },
      create: {
        userId,
        provider,
        encryptionIV: iv,
        encryptedCredentials: content,
      },
    });
  }

  @Authorized(AppRole.USER)
  @Query((_returns) => DecryptedUserApiCredential, { nullable: true })
  async userApiCredential(
    @Ctx() ctx: GraphQLContext,
    @Arg('provider', (_type) => Provider) provider: Provider
  ): Promise<DecryptedUserApiCredential | null> {
    if (!ctx.user) {
      throw new Error('requires user to be signed in');
    }

    const userId = ctx.user.id;

    const exist = await getUserAPICredential(ctx.prisma, provider, userId);
    if (!exist) return null;

    return {
      userId,
      provider,
      credentialsJSON: exist,
    };
  }
}
