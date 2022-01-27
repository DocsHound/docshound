import {
  Arg,
  Authorized,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import * as GraphQLScalars from 'graphql-scalars';
import { UserApiCredential } from '@generated/type-graphql';
import { AppRole, Prisma } from '@prisma/client';
import { GraphQLContext } from '../types';
import { decrypt, encrypt } from '../services/crypto';
import { Provider } from '../integrations/constants';

@ObjectType()
class DecryptedUserApiCredential {
  @Field((_type) => String)
  userId!: string;

  @Field((_type) => Provider)
  provider!: Provider;

  @Field((_type) => GraphQLScalars.JSONObjectResolver)
  credentialsJSON!: Prisma.JsonObject;
}

@Resolver((_of) => UserApiCredential)
export class MyUserApiCredentialResolver {
  @Authorized([AppRole.ADMIN, AppRole.USER])
  @Mutation((_returns) => UserApiCredential)
  async upsertUserApiCredential(
    @Ctx() ctx: GraphQLContext,
    @Arg('provider', (_type) => Provider) provider: Provider,
    @Arg('credentialsJSON', (_type) => GraphQLScalars.JSONObjectResolver)
    credentialsJSON: Prisma.JsonObject
  ): Promise<UserApiCredential> {
    const secretKey = process.env.API_CRED_AES_KEY;
    if (!secretKey) {
      throw new Error('missing API_CRED_AES_KEY envvar');
    }

    if (!ctx.user) {
      throw new Error('requires user to be signed in');
    }

    const userId = ctx.user.id;

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

  @Authorized([AppRole.ADMIN, AppRole.USER])
  @Query((_returns) => DecryptedUserApiCredential, { nullable: true })
  async userApiCredential(
    @Ctx() ctx: GraphQLContext,
    @Arg('provider', (_type) => Provider) provider: Provider
  ): Promise<DecryptedUserApiCredential | null> {
    if (!ctx.user) {
      throw new Error('requires user to be signed in');
    }

    const userId = ctx.user.id;

    const cred = await ctx.prisma.userApiCredential.findUnique({
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

    const credentialsJSON = JSON.parse(
      decrypt(
        { iv: cred.encryptionIV, content: cred.encryptedCredentials },
        secretKey
      )
    );

    return {
      userId,
      provider,
      credentialsJSON,
    };
  }
}
