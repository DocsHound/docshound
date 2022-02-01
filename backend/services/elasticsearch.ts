import { Client } from '@elastic/elasticsearch';

export const client = new Client({
  node: process.env.ELASTICSEARCH_URL,
});

const ESIDX_SLACK_MESSAGES = 'slack-messages';

interface SlackMessageDoc {
  ts: string;
  clientMsgID: string | null;
  text: string | null;
  userID: string;
  teamID: string | null;
  channelID: string;
  channelType: string;
}

export const indexSlackMessage = async (id: string, doc: SlackMessageDoc) => {
  await client.index({
    id,
    index: ESIDX_SLACK_MESSAGES,
    body: doc,
  });
  await client.indices.refresh({ index: ESIDX_SLACK_MESSAGES });
};
