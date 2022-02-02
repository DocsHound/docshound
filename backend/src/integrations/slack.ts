import { PrismaClient } from '@prisma/client';
import { backOff, IBackOffOptions } from 'exponential-backoff';
import { App } from '@slack/bolt';
import { SearchAllArguments, WebAPICallResult } from '@slack/web-api';
import {
  ESIndexPayload,
  indexSlackMessage,
  SlackMessageDoc,
} from 'services/elasticsearch';
import { logger } from 'logging';
import { getGlobalAPICredential } from 'shared/libs/credential';
import { DecryptedUserApiCredential } from 'shared/libs/gql_types/credential';
import { Provider } from 'shared/libs/gql_types/integration';
import {
  Message,
  DocType,
  SearchResult,
  Document,
  TextType,
} from 'shared/libs/gql_types/search';
import { Profile } from '@slack/web-api/dist/response/UsersProfileGetResponse';
import { channelTypes } from '@slack/bolt/dist/types/events/message-events';

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
    logger.debug('creating new Slack app instance...');
    const prev = app;
    app = await createApp(prisma);
    if (app) {
      // TODO(richardwu): hide behind worker type flag
      await attachListeners(app);
      app.error(async (err) => {
        logger.error(
          `Slack Bolt app received error: ${err.code} ${err.message}, recreating app`
        );
        getOrCreateApp(prisma, true);
      });
      await app.start();
      await joinChannels(app);
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

const retryWithBackoff = <T>(
  fn: () => Promise<T>,
  options?: Partial<IBackOffOptions>
) => {
  return backOff(fn, {
    maxDelay: 1000,
    timeMultiple: 2,
    startingDelay: 100,
    numOfAttempts: 5,
    jitter: 'full',
    retry: async (e: WebAPICallResult) => {
      // Errors that make sense to retry: https://api.slack.com/methods/chat.getPermalink#errors.
      return ['ratelimited', 'service_unavailable', 'internal_error'].includes(
        e.error ?? ''
      );
    },
    ...options,
  });
};

const getPermalink = async (app: App, channelID: string, messageTS: string) => {
  const permalink = await retryWithBackoff(
    async () => {
      const resp = await app.client.chat.getPermalink({
        channel: channelID,
        message_ts: messageTS,
      });
      if (!resp.ok) {
        throw resp;
      }
      return resp.permalink ?? null;
    },
    {
      numOfAttempts: 100,
    }
  );
  return permalink;
};

const makeESIndexPayload = (
  doc: SlackMessageDoc
): ESIndexPayload<SlackMessageDoc> => {
  return {
    // Guaranteed uniqueness according to https://api.slack.com/messaging/retrieving#individual_messages.
    id: `${doc.channelID}:${doc.ts}`,
    doc,
  };
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
    if (message.subtype !== undefined) {
      logger.warn('received non-generic message subtype', message.subtype);
      return;
    }
    logger.info(
      'slack message received (channel: %s, ts: %s): %s',
      message.channel,
      message.ts,
      message.text
    );

    // TODO(richardwu): push onto persistent queue (Kafka? Redis?)

    try {
      const permalink = await getPermalink(app, message.channel, message.ts);

      await indexSlackMessage(
        makeESIndexPayload({
          ts: message.ts,
          clientMsgID: message.client_msg_id ?? null,
          text: message.text ?? null,
          userID: message.user,
          teamID: message.team ?? null,
          channelID: message.channel,
          channelType: message.channel_type,
          permalink,
        })
      );
    } catch (err) {
      logger.error(err);
    }
  });
};

// Joins all public channels.
const joinChannels = async (app: App) => {
  const resp = await app.client.conversations.list();
  if (!resp.ok) {
    return;
  }

  const availChannels =
    resp.channels?.filter((channel) => !channel.is_member) ?? [];
  if (availChannels.length)
    logger.info(`joining ${availChannels.length} channels...`);

  await Promise.all(
    availChannels.map(async (channel) => {
      await retryWithBackoff(async () => {
        if (!channel.id) return;
        const resp = await app.client.conversations.join({
          channel: channel.id,
        });
        if (!resp.ok) {
          throw resp;
        }
      });
    })
  );
};

// Tier-3: (50 calls/minute w/ bursts)
export const indexChannel = async (
  app: App,
  channelID: string,
  channelType: channelTypes,
  oldestTS: string
) => {
  let nextCursor: string | null | undefined = null;
  try {
    while (nextCursor !== undefined) {
      const resp = await retryWithBackoff(async () => {
        const resp = await app.client.conversations.history({
          channel: channelID,
          oldest: oldestTS,
          limit: 1000,
          ...(nextCursor ? { cursor: nextCursor } : {}),
        });
        if (!resp.ok) {
          throw resp;
        }
        return resp;
      });

      const messages: Array<ESIndexPayload<SlackMessageDoc>> = [];
      // TODO(richardwu): consider allSettled?
      (
        await Promise.all(
          resp.messages?.map(
            async (
              message
            ): Promise<ESIndexPayload<SlackMessageDoc> | null> => {
              if (!message.ts || !message.user) return null;
              const permalink = await getPermalink(app, channelID, message.ts);

              return makeESIndexPayload({
                ts: message.ts,
                clientMsgID: message.client_msg_id ?? null,
                text: message.text ?? null,
                userID: message.user,
                teamID: message.team ?? null,
                channelID,
                channelType,
                permalink,
              });
            }
          ) ?? []
        )
      ).forEach((m) => {
        if (m === null) return;
        messages.push(m);
      });
      // await indexSlackMessage(...messages);
      // TODO: log we've indexed up to latest TS.
      if (resp.has_more) {
        nextCursor = resp.response_metadata?.next_cursor;
      } else {
        nextCursor = undefined;
      }
    }
  } catch (err) {
    logger.error(err);
  }
};

const tsToDate = (ts: string) => {
  return new Date(1000 * parseFloat(ts));
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
            type: TextType.Markdown,
          }
        : null,
      group: match.channel?.id
        ? {
            resourceID: match.channel.id,
            resourceName: match.channel.name ?? null,
            resourceURL: match.team
              ? makeChannelURL(match.channel.id, match.team)
              : null,
          }
        : null,
      url: match.permalink ?? null,
      author: match.user
        ? {
            resourceID: match.user,
            resourceName: match.username ?? null,
            resourceURL: match.team
              ? makeUserURL(match.user, match.team)
              : null,
          }
        : null,
      // TODO(richardwu)
      avatar: null,
      created: match.ts ? tsToDate(match.ts) : null,
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
              // TODO: lookup separately
              resourceURL: null,
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

// TODO(richardwu): wrap in Redis/Memcache.
const resolveChannel = async (app: App, channelID: string) => {
  const resp = await app.client.conversations.info({
    channel: channelID,
  });
  if (!resp.ok) {
    logger.error(`failed to resolve Slack channel ${channelID}: ${resp.error}`);
    return null;
  }
  return resp.channel;
};

// TODO(richardwu): wrap in Redis/Memcache.
const resolveUser = async (
  app: App,
  userID: string
): Promise<Profile | null> => {
  const resp = await app.client.users.profile.get({
    user: userID,
  });
  if (!resp.ok) {
    logger.error(`failed to resolve Slack user ${userID}: ${resp.error}`);
    return null;
  }

  return resp.profile ?? null;
};

// See https://api.slack.com/reference/deep-linking#client__supported-uris.
const makeUserURL = (userID: string, teamID: string) =>
  `slack://user?team=${teamID}&id=${userID}`;
const makeChannelURL = (channelID: string, teamID: string) =>
  `slack://channel?team=${teamID}&id=${channelID}`;

export const parseSlackMessageDoc = async (
  app: App | null,
  doc: SlackMessageDoc
): Promise<Message> => {
  return await Promise.allSettled(
    app
      ? [resolveChannel(app, doc.channelID), resolveUser(app, doc.userID)]
      : [Promise.resolve(null), Promise.resolve(null)]
  ).then(([channelRes, userRes]) => {
    const user = userRes.status === 'fulfilled' ? userRes.value : null;
    const channel = channelRes.status === 'fulfilled' ? channelRes.value : null;

    return {
      provider,
      message: doc.text
        ? {
            text: doc.text,
            type: TextType.Markdown,
          }
        : null,
      group: {
        resourceID: doc.channelID,
        resourceName: channel?.name ?? null,
        resourceURL: doc.teamID
          ? makeChannelURL(doc.channelID, doc.teamID)
          : null,
      },
      url: doc.permalink,
      author: {
        resourceID: doc.userID,
        resourceName: !!user?.display_name
          ? user.display_name
          : !!user?.real_name
          ? user.real_name
          : null,
        resourceURL: doc.teamID ? makeUserURL(doc.userID, doc.teamID) : null,
      },
      avatar: user?.image_72 ?? null,
      created: tsToDate(doc.ts),
    };
  });
};