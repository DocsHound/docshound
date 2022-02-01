import { Client } from '@elastic/elasticsearch';
import { ResponseError } from '@elastic/elasticsearch/lib/errors';
import { channelTypes } from '@slack/bolt/dist/types/events/message-events';
import { captureError } from './errors';

export const client = new Client({
  node: process.env.ELASTICSEARCH_URL,
});

enum ElasticIndex {
  SlackMessages = 'slack-messages',
}

export const initIndices = async () => {
  for (const index of Object.values(ElasticIndex)) {
    try {
      await client.indices.get({ index });
    } catch (err) {
      if (err instanceof ResponseError && err.statusCode === 404) {
        // TODO(richardwu): Specify mappings for each field and additional indexes
        await client.indices.create({ index });
      } else {
        captureError(err);
      }
    }
  }
};

export interface SlackMessageDoc {
  ts: string;
  clientMsgID: string | null;
  text: string | null;
  userID: string;
  teamID: string | null;
  channelID: string;
  channelType: channelTypes;
  permalink: string | null;
}

interface ESSearchResult<T, Highlight = undefined> {
  _shards: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
  took: number;
  timed_out: boolean;
  hits: {
    total: { value: number; relation: 'eq' };
    max_score: number | null;
    hits: Array<{
      _index: string;
      _type: string;
      _id: string;
      _score: number;
      _source: T;
      highlight?: Highlight;
    }>;
  };
}

export const indexSlackMessage = async (id: string, doc: SlackMessageDoc) => {
  await client.index({
    id,
    index: ElasticIndex.SlackMessages,
    body: doc,
  });
  await client.indices.refresh({ index: ElasticIndex.SlackMessages });
};

export const searchSlackMessages = async (query: string) => {
  const resp = await client.search<
    ESSearchResult<SlackMessageDoc, { text: Array<string> }>
  >({
    index: ElasticIndex.SlackMessages,
    body: {
      query: {
        match: { text: query },
      },
      highlight: {
        // Don't fragment, but still highlight.
        number_of_fragments: 1,
        fragment_size: 1000,
        pre_tags: ['**'],
        post_tags: ['**'],
        fields: {
          text: {},
        },
      },
    },
  });
  if (resp.statusCode !== 200) {
    console.error(
      `received non-200 status while searching Slack messages for "${query}": ${resp.warnings}`
    );
    return null;
  }

  return resp.body.hits.hits.map((h) => {
    if (!!h.highlight?.text) {
      console.log(h.highlight.text, h._source.text);
      return {
        ...h._source,
        text: h.highlight.text.join('…'),
      };
    }

    return h._source;
  });
};
