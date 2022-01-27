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
import { GlobalApiCredential } from '@generated/type-graphql';
import { AppRole, Prisma } from '@prisma/client';
import { GraphQLContext } from '../types';
import { decrypt, encrypt } from '../services/crypto';
import { Provider, providerFields } from '../integrations/constants';
import { arraysEqual } from '../utils/objects';

@ObjectType()
class DecryptedGlobalApiCredential {
  @Field((_type) => Provider)
  provider!: Provider;

  @Field((_type) => Boolean)
  exists!: boolean;

  @Field((_type) => GraphQLScalars.JSONObjectResolver)
  credentialsJSON!: Prisma.JsonObject;
}

@Resolver((_of) => GlobalApiCredential)
export class MyGlobalApiCredentialResolver {
  @Authorized(AppRole.ADMIN)
  @Mutation((_returns) => GlobalApiCredential)
  async upsertGlobalApiCredential(
    @Ctx() ctx: GraphQLContext,
    @Arg('provider', (_type) => Provider) provider: Provider,
    @Arg('credentialsJSON', (_type) => GraphQLScalars.JSONObjectResolver)
    credentialsJSON: Prisma.JsonObject
  ): Promise<GlobalApiCredential> {
    const secretKey = process.env.API_CRED_AES_KEY;
    if (!secretKey) {
      throw new Error('missing API_CRED_AES_KEY envvar');
    }
    const expectedFields = providerFields(provider).sort();
    const passedFields = Object.keys(credentialsJSON).sort();

    if (!arraysEqual(passedFields, expectedFields)) {
      throw new Error(
        `credentialsJSON for ${provider} has keys ${passedFields} but expects ${expectedFields}`
      );
    }

    const { iv, content } = encrypt(JSON.stringify(credentialsJSON), secretKey);

    return await ctx.prisma.globalApiCredential.upsert({
      where: { provider },
      update: {
        encryptionIV: iv,
        encryptedCredentials: content,
      },
      create: {
        provider,
        encryptionIV: iv,
        encryptedCredentials: content,
      },
    });
  }

  @Authorized(AppRole.ADMIN)
  @Query((_returns) => DecryptedGlobalApiCredential, { nullable: true })
  async globalApiCredential(
    @Ctx() ctx: GraphQLContext,
    @Arg('provider', (_type) => Provider) provider: Provider
  ): Promise<DecryptedGlobalApiCredential | null> {
    const cred = await ctx.prisma.globalApiCredential.findUnique({
      where: {
        provider,
      },
    });
    if (!cred)
      return {
        provider,
        exists: false,
        credentialsJSON: Object.fromEntries(
          providerFields(provider).map((key) => [key, null])
        ),
      };

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

    return {
      provider,
      exists: true,
      credentialsJSON: Object.fromEntries(
        providerFields(provider).map((key) => [key, exist[key] ?? null])
      ),
    };
  }
}
