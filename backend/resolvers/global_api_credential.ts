import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import * as GraphQLScalars from 'graphql-scalars';
import { GlobalApiCredential } from '@generated/type-graphql';
import { AppRole, Prisma } from '@prisma/client';
import { GraphQLContext } from '../types';
import { encrypt } from '../services/crypto';
import {
  providerFields,
  publicProviderFields,
} from '../integrations/constants';
import { arraysEqual } from '../utils/objects';
import * as Slack from '../integrations/slack';
import { getGlobalAPICredential } from '../shared/libs/credential';
import { DecryptedGlobalApiCredential } from '../shared/libs/gql_types/credential';
import { Provider } from '../shared/libs/gql_types/integration';

@Resolver()
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

    const ret = await ctx.prisma.globalApiCredential.upsert({
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

    // Recreate client with new credentials.
    // TODO(richardwu): need to broadcast updated credentials to all workers (use supabase realtime?)
    switch (provider) {
      case Provider.Slack:
        Slack.getOrCreateApp(ctx.prisma, true);
        break;
    }

    return ret;
  }

  @Authorized(AppRole.ADMIN)
  @Query((_returns) => DecryptedGlobalApiCredential, { nullable: true })
  async globalApiCredential(
    @Ctx() ctx: GraphQLContext,
    @Arg('provider', (_type) => Provider) provider: Provider
  ): Promise<DecryptedGlobalApiCredential | null> {
    const exist = await getGlobalAPICredential(ctx.prisma, provider);
    if (!exist)
      return {
        provider,
        exists: false,
        credentialsJSON: Object.fromEntries(
          providerFields(provider).map((key) => [key, null])
        ),
      };

    return {
      provider,
      exists: true,
      credentialsJSON: Object.fromEntries(
        providerFields(provider).map((key) => [key, exist[key] ?? null])
      ),
    };
  }

  @Authorized(AppRole.USER)
  @Query((_returns) => DecryptedGlobalApiCredential, {
    nullable: true,
    description:
      'This returns Global API credentials that are allowed to be viewed by the public (e.g., public client ID).',
  })
  async publicGlobalApiCredential(
    @Ctx() ctx: GraphQLContext,
    @Arg('provider', (_type) => Provider) provider: Provider
  ): Promise<DecryptedGlobalApiCredential | null> {
    const exist = await getGlobalAPICredential(ctx.prisma, provider);
    if (!exist)
      return {
        provider,
        exists: false,
        credentialsJSON: Object.fromEntries(
          publicProviderFields(provider).map((key) => [key, null])
        ),
      };

    return {
      provider,
      exists: true,
      credentialsJSON: Object.fromEntries(
        publicProviderFields(provider).map((key) => [key, exist[key] ?? null])
      ),
    };
  }
}
