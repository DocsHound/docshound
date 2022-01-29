import { PrismaClient } from '@prisma/client';
import { App, ExpressReceiver } from '@slack/bolt';
import { SearchAllArguments } from '@slack/web-api';
import { getGlobalAPICredential } from '../shared/libs/credential';
import { DecryptedUserApiCredential } from '../shared/libs/gql_types/credential';
import { Provider } from '../shared/libs/gql_types/integration';
import {
  Message,
  DocType,
  SearchResult,
  Document,
} from '../shared/libs/gql_types/search';

const slackClientIDKey = 'SLACK_CLIENT_ID';
const slackClientSecretKey = 'SLACK_CLIENT_SECRET';
const slackBotTokenKey = 'SLACK_BOT_TOKEN';
const slackSigningSecretKey = 'SLACK_SIGNING_SECRET';
export const slackKeys = [
  slackClientIDKey,
  slackClientSecretKey,
  slackBotTokenKey,
  slackSigningSecretKey,
];

const provider = Provider.Slack;

export const createApp = async (prisma: PrismaClient) => {
  const creds = await getGlobalAPICredential(prisma, provider);
  if (!creds) {
    return null;
  }

  const receiver = new ExpressReceiver({
    signingSecret: creds[slackSigningSecretKey],
    endpoints: '/',
  });
  const app = new App({
    token: creds[slackBotTokenKey],
    clientId: creds[slackClientIDKey],
    clientSecret: creds[slackClientSecretKey],
    receiver,
  });

  return app;
};

const extractUserToken = (
  userCred: DecryptedUserApiCredential
): string | null => {
  // @ts-ignore
  return userCred.credentialsJSON.authed_user?.access_token ?? null;
};

export const search = async (
  app: App,
  userCred: DecryptedUserApiCredential,
  query: string,
  args?: SearchAllArguments
): Promise<Array<typeof SearchResult>> => {
  const userToken = extractUserToken(userCred);
  if (!userToken) {
    throw new Error(
      `could not find userToken from userCred for user ${userCred.userId}`
    );
  }
  // See https://api.slack.com/methods/search.all.
  const rawResults = await app.client.search.all({
    query,
    token: userToken,
    sort: 'score',
    sort_dir: 'desc',
    ...args,
  });

  const results: Array<typeof SearchResult> = [];

  rawResults.messages?.matches?.forEach((match) => {
    const msg: Message = {
      provider,
      message: match.text
        ? {
            text: match.text,
            // TODO(richardwu)
            matches: [],
          }
        : null,
      group: match.channel?.id
        ? {
            resourceID: match.channel.id,
            resourceName: match.channel.name ?? null,
          }
        : null,
      url: match.permalink ?? null,
      author: match.user
        ? {
            resourceID: match.user,
            resourceName: match.username ?? null,
          }
        : null,
      created: match.ts ? new Date(1000 * parseFloat(match.ts)) : null,
    };
    results.push(msg);
  });

  rawResults.files?.matches?.forEach((match) => {
    const file: Document = {
      provider,
      docType: DocType.File,
      title: match.title ?? null,
      desc: null,
      url: match.permalink ?? null,
      authors: match.user
        ? [
            {
              resourceID: match.user,
              resourceName: match.username ?? null,
            },
          ]
        : [],
      lastUpdated: null,
      created: match.timestamp ? new Date(1000 * match.timestamp) : null,
    };
    results.push(file);
  });

  return results;
};
