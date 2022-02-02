import { AppRole } from '@prisma/client';
import { Arg, Authorized, Ctx, Query, Resolver } from 'type-graphql';
import { ProviderDocType, SearchResult } from 'shared/libs/gql_types/search';
import { GraphQLContext } from 'types';
import { searchSlackMessages } from 'services/elasticsearch';
import { getOrCreateApp, parseSlackMessageDoc } from 'integrations/slack';
import { Provider } from 'shared/libs/gql_types/integration';

@Resolver()
export class SearchResolver {
  @Authorized(AppRole.USER)
  @Query((_returns) => [SearchResult])
  async search(
    @Ctx() ctx: GraphQLContext,
    @Arg('query') query: string,
    @Arg('providerDocTypes', (_type) => [ProviderDocType], { nullable: true })
    providerDocTypes?: Array<ProviderDocType>
  ) {
    if (!ctx.user)
      throw new Error(
        'requires user to be signed in or userId to be passed in'
      );
    const userId = ctx.user.id;
    const results: Array<typeof SearchResult> = [];

    // -- ES Slack search

    if (
      !providerDocTypes ||
      providerDocTypes.some(({ provider }) => provider === Provider.Slack)
    ) {
      const slackResults = await searchSlackMessages(query);
      if (slackResults) {
        const app = await getOrCreateApp(ctx.prisma);
        (
          await Promise.allSettled(
            slackResults.map((r) => parseSlackMessageDoc(app, r))
          )
        ).map((r) => {
          if (r.status === 'rejected') return;
          results.push(r.value);
        });
      }
    }

    // -- Personal Slack search
    // const slackUserCred = await getUserAPICredential(
    //   ctx.prisma,
    //   Provider.Slack,
    //   userId
    // );
    // if (slackUserCred) {
    //   const slackApp = await Slack.getOrCreateApp(ctx.prisma);
    //   if (slackApp) {

    //     // results.push(
    //     //   ...(await Slack.search(
    //     //     slackApp,
    //     //     {
    //     //       userId,
    //     //       provider: Provider.Slack,
    //     //       credentialsJSON: slackUserCred,
    //     //     },
    //     //     query
    //     //   ))
    //     // );
    //   }
    // }

    return results;
  }
}
