import { AppRole } from '@prisma/client';
import { Arg, Authorized, Ctx, Query, Resolver } from 'type-graphql';
import {
  DocType,
  ProviderDocType,
  SearchCount,
  SearchItem,
  SearchResult,
} from 'shared/libs/gql_types/search';
import { GraphQLContext } from 'types';
import {
  countQuery,
  ElasticIndex,
  searchConfCloudContent,
  searchSlackMessages,
} from 'services/elasticsearch';
import { getOrCreateMainApp, parseSlackMessageDoc } from 'integrations/slack';
import { Provider } from 'shared/libs/gql_types/integration';
import { parseConfCloudDoc } from 'integrations/confluence_cloud';

const providerRequested = (
  providerDocTypes: Array<ProviderDocType> | undefined,
  provider: Provider,
  docType?: DocType
) => {
  // TODO: check if integration is enabled/removed.
  return (
    !providerDocTypes ||
    providerDocTypes.some(
      ({ provider: reqProvider, docType: reqDocType }) =>
        reqProvider === provider && (!docType || reqDocType === docType)
    )
  );
};

@Resolver()
export class SearchResolver {
  @Authorized(AppRole.USER)
  @Query((_returns) => SearchResult)
  async search(
    @Ctx() ctx: GraphQLContext,
    @Arg('query') query: string,
    @Arg('providerDocTypes', (_type) => [ProviderDocType], { nullable: true })
    providerDocTypes?: Array<ProviderDocType>
  ): Promise<SearchResult> {
    if (!ctx.user)
      throw new Error(
        'requires user to be signed in or userId to be passed in'
      );
    const userId = ctx.user.id;
    // TODO: do everything in parallel

    const counts: Array<SearchCount> = await Promise.all([
      countQuery(query, ElasticIndex.SlackMessages).then((count) => ({
        provider: Provider.Slack,
        docType: null,
        count: count ?? 0,
      })),
      countQuery(query, ElasticIndex.ConfCloudContent).then((count) => ({
        provider: Provider.ConfluenceCloud,
        docType: null,
        count: count ?? 0,
      })),
    ]);

    const items: Array<typeof SearchItem> = [];
    if (providerRequested(providerDocTypes, Provider.Slack)) {
      const slackResults = await searchSlackMessages(query);
      if (slackResults) {
        const app = await getOrCreateMainApp(ctx.prisma);
        (
          await Promise.allSettled(
            slackResults.map((r) => parseSlackMessageDoc(app, r))
          )
        ).map((r) => {
          if (r.status === 'rejected') return;
          items.push(r.value);
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

    if (providerRequested(providerDocTypes, Provider.ConfluenceCloud)) {
      const confCloudResults = await searchConfCloudContent(query);
      if (confCloudResults)
        items.push(...confCloudResults.map(parseConfCloudDoc));
    }

    return {
      items,
      counts,
    };
  }
}
