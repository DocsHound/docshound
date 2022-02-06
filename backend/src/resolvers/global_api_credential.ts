import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import * as GraphQLScalars from 'graphql-scalars';
import { GlobalApiCredential } from '@generated/type-graphql';
import { AppRole, Prisma } from '@prisma/client';
import { GraphQLContext } from 'types';
import { encrypt } from 'services/crypto';
import { providerFields, publicProviderFields } from 'integrations/constants';
import { arraysEqual } from 'utils/objects';
import * as Slack from 'integrations/slack';
import {
  getGlobalAPICredential,
  globalCredentialMap,
} from 'shared/libs/credential';
import {
  DecryptedGlobalApiCredential,
  GlobalCredentialInputKV,
} from 'shared/libs/gql_types/credential';
import { Provider } from 'shared/libs/gql_types/integration';

@Resolver()
export class MyGlobalApiCredentialResolver {
  @Authorized(AppRole.SUPERADMIN)
  @Mutation((_returns) => GlobalApiCredential)
  async upsertGlobalApiCredential(
    @Ctx() ctx: GraphQLContext,
    @Arg('provider', (_type) => Provider) provider: Provider,
    @Arg('data', (_type) => [GlobalCredentialInputKV])
    data: Array<GlobalCredentialInputKV>
  ): Promise<GlobalApiCredential> {
    const secretKey = process.env.API_CRED_AES_KEY;
    if (!secretKey) {
      throw new Error('missing API_CRED_AES_KEY envvar');
    }
    const expectedFields = providerFields(provider).sort();
    const passedFields = data.map((d) => d.key).sort();

    if (!arraysEqual(passedFields, expectedFields)) {
      throw new Error(
        `data for ${provider} has keys ${passedFields} but expects ${expectedFields}`
      );
    }

    const { iv, content } = encrypt(JSON.stringify(data), secretKey);

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
        Slack.getOrCreateMainApp(ctx.prisma, true);
        break;
    }

    return ret;
  }

  @Authorized(AppRole.ADMIN)
  @Mutation((_returns) => GlobalApiCredential)
  async updateGlobalSharedUserCredential(
    @Ctx() ctx: GraphQLContext,
    @Arg('provider', (_type) => Provider) provider: Provider,
    @Arg('credentialsJSON', (_type) => GraphQLScalars.JSONObjectResolver)
    credentialsJSON: Prisma.JsonObject
  ): Promise<GlobalApiCredential> {
    const secretKey = process.env.API_CRED_AES_KEY;
    if (!secretKey) {
      throw new Error('missing API_CRED_AES_KEY envvar');
    }

    // TODO(richardwu): wrap in PRISMA transaction once
    // https://github.com/prisma/prisma/issues/9846#issuecomment-1029837126 merges.
    const creds = await ctx.prisma.globalApiCredential.findUnique({
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

    const ret = await ctx.prisma.globalApiCredential.update({
      where: {
        provider,
      },
      data: {
        encryptedSharedUserCredentials: content,
      },
    });

    // TODO(richardwu): Recreate client with new credentials if applicable.

    return ret;
  }

  @Authorized(AppRole.SUPERADMIN)
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
        data: providerFields(provider).map((key) => ({
          key,
          value: null,
        })),
      };

    const existMap = globalCredentialMap(exist);

    return {
      provider,
      exists: true,
      data: providerFields(provider).map((key) => ({
        key,
        value: existMap[key] ?? null,
      })),
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
        data: publicProviderFields(provider).map((key) => ({
          key,
          value: null,
        })),
      };

    const existMap = globalCredentialMap(exist);

    return {
      provider,
      exists: true,
      data: publicProviderFields(provider).map((key) => ({
        key,
        value: existMap[key] ?? null,
      })),
    };
  }
}
