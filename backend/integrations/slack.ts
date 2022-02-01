import { PrismaClient } from '@prisma/client';
import { App } from '@slack/bolt';
import { SearchAllArguments } from '@slack/web-api';
import { indexSlackMessage } from '../services/elasticsearch';
import { getGlobalAPICredential } from '../shared/libs/credential';
import { DecryptedUserApiCredential } from '../shared/libs/gql_types/credential';
import { Provider } from '../shared/libs/gql_types/integration';
import {
  Message,
  DocType,
  SearchResult,
  Document,
} from '../shared/libs/gql_types/search';

// To add a new required token, simply add it to slackKeys.
const slackClientIDKey = 'SLACK_CLIENT_ID';
const slackClientSecretKey = 'SLACK_CLIENT_SECRET';
const slackAppTokenKey = 'SLACK_APP_TOKEN';
const slackBotTokenKey = 'SLACK_BOT_TOKEN';
const slackSigningSecretKey = 'SLACK_SIGNING_SECRET';
export const slackPublicKeys = [slackClientIDKey];
export const slackKeys = [
  slackClientIDKey,
  slackClientSecretKey,
  slackAppTokenKey,
  slackBotTokenKey,
  slackSigningSecretKey,
];
const provider = Provider.Slack;

let app: App | null = null;

export const getOrCreateApp = async (
  prisma: PrismaClient,
  forceCreate: boolean = false
) => {
  if (app === null || forceCreate) {
    console.debug('creating new Slack app instance...');
    const prev = app;
    app = await createApp(prisma);
    if (app) {
      // TODO: hide behind worker type flag
      await attachListeners(app);
      await app.start();
    }
    // Stop previous instance
    await prev?.stop();
  }
  return app;
};

const createApp = async (prisma: PrismaClient) => {
  const creds = await getGlobalAPICredential(prisma, provider);
  if (!creds) {
    return null;
  }

  const app = new App({
    token: creds[slackBotTokenKey],
    clientId: creds[slackClientIDKey],
    clientSecret: creds[slackClientSecretKey],
    signingSecret: creds[slackSigningSecretKey],
    appToken: creds[slackAppTokenKey],
    socketMode: true,
  });

  return app;
};

const attachListeners = async (app: App) => {
  app.message(async ({ message }) => {
    /*  Example payload/event/message format:
        message {
          client_msg_id: '5cd8c5c6-09f3-413d-8318-9fdc48875d6d',
          type: 'message',
          text: 'this is code:s\n```Abc do stuff ```\n&gt; quote is here',
          user: 'U02U5GJ1WLF',
          ts: '1643586259.871379',
          team: 'T02UYQBRJDP',
          blocks: [ { type: 'rich_text', block_id: '+pGW', elements: [Array] } ],
          channel: 'C02V9T33540',
          event_ts: '1643586259.871379',
          channel_type: 'channel'
        }
    */
    console.debug(message);
    if (message.subtype !== undefined) {
      console.debug('received non-generic message subtype', message.subtype);
      return;
    }
    await indexSlackMessage(
      // Guaranteed uniqueness according to https://api.slack.com/messaging/retrieving#individual_messages.
      `${message.channel}:${message.ts}`,
      {
        ts: message.ts,
        clientMsgID: message.client_msg_id ?? null,
        text: message.text ?? null,
        userID: message.user,
        teamID: message.team ?? null,
        channelID: message.channel,
        channelType: message.channel_type,
      }
    );
  });
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
