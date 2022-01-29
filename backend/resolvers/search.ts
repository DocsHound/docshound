import { AppRole } from '@prisma/client';
import { Arg, Authorized, Ctx, Query, Resolver } from 'type-graphql';
import * as Slack from '../integrations/slack';
import { SearchResult } from '../shared/libs/gql_types/search';
import { GraphQLContext } from '../types';
import { getUserAPICredential } from '../shared/libs/credential';
import { Provider } from '../shared/libs/gql_types/integration';

@Resolver()
export class SearchResolver {
  @Authorized(AppRole.USER)
  @Query((_returns) => [SearchResult])
  async search(@Ctx() ctx: GraphQLContext, @Arg('query') query: string) {
    if (!ctx.user)
      throw new Error(
        'requires user to be signed in or userId to be passed in'
      );
    const userId = ctx.user.id;
    const results: Array<typeof SearchResult> = [];

    // -- Slack search
    const slackUserCred = await getUserAPICredential(
      ctx.prisma,
      Provider.Slack,
      userId
    );
    if (slackUserCred) {
      const slackApp = await Slack.createApp(ctx.prisma);
      if (slackApp) {
        results.push(
          ...(await Slack.search(
            slackApp,
            {
              userId,
              provider: Provider.Slack,
              credentialsJSON: slackUserCred,
            },
            query
          ))
        );
      }
    }

    return results;
  }
}
