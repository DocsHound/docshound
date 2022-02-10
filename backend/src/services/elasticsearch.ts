import { Client } from '@elastic/elasticsearch';
import { ResponseError } from '@elastic/elasticsearch/lib/errors';
import { channelTypes } from '@slack/bolt/dist/types/events/message-events';
import { logger } from 'logging';

export const client = new Client({
  node: process.env.ELASTICSEARCH_URL,
});

export enum ElasticIndex {
  SlackMessages = 'slack-messages',
  ConfCloudContent = 'conf-cloud-content',
}

const indexMappings = {
  [ElasticIndex.SlackMessages]: {
    properties: {
      ts: {
        type: 'keyword',
      },
      clientMsgID: {
        type: 'keyword',
      },
      text: {
        type: 'text',
      },
      userID: {
        type: 'keyword',
      },
      teamID: {
        type: 'keyword',
      },
      channelID: {
        type: 'keyword',
      },
      channelType: {
        type: 'keyword',
      },
      permalink: {
        type: 'keyword',
      },
    },
  },

  [ElasticIndex.ConfCloudContent]: {
    properties: {
      id: {
        type: 'keyword',
      },
      type: {
        type: 'keyword',
      },
      status: {
        type: 'keyword',
      },
      created: {
        type: 'date',
      },
      updated: {
        type: 'date',
      },
      title: {
        type: 'text',
      },
      body: {
        type: 'text',
      },
      baseURL: {
        type: 'keyword',
      },
      // Includes page title (so text since this may be too long).
      webLink: {
        type: 'text',
      },
      tinyLink: {
        type: 'keyword',
      },
      // Can be array/list.
      labels: {
        type: 'keyword',
      },
      version: {
        type: 'long',
      },
      // TODO: do we need to store all of this?
      createdBy: {
        properties: {
          accountID: {
            type: 'keyword',
          },
          accountType: {
            type: 'keyword',
          },
          email: {
            type: 'keyword',
          },
          publicName: {
            type: 'keyword',
          },
          profilePicURL: {
            type: 'keyword',
          },
        },
      },
      // TODO: do we need to store all of this?
      updatedBy: {
        properties: {
          accountID: {
            type: 'keyword',
          },
          accountType: {
            type: 'keyword',
          },
          email: {
            type: 'keyword',
          },
          publicName: {
            type: 'keyword',
          },
          profilePicURL: {
            type: 'keyword',
          },
        },
      },
      // Space. TODO: necessary to store everything? Or do a lookup?
      space: {
        properties: {
          id: {
            type: 'keyword',
          },
          key: {
            type: 'keyword',
          },
          name: {
            type: 'keyword',
          },
          type: {
            type: 'keyword',
          },
          webLink: {
            type: 'keyword',
          },
        },
      },
    },
  },
};

export const initIndices = async () => {
  for (const index of Object.values(ElasticIndex)) {
    try {
      await client.indices.get({ index });
    } catch (err) {
      if (err instanceof ResponseError && err.statusCode === 404) {
        await client.indices.create({ index });
        await client.indices.putMapping({ index, body: indexMappings[index] });
      } else {
        logger.error(err);
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

export interface ConfCloudDoc {
  id: string;
  type: string;
  status: string;
  created: string;
  updated: string;
  title: string;
  body: string;
  baseURL: string;
  webLink: string | null;
  tinyLink: string | null;
  labels: Array<string>;
  version: number;
  createdBy: {
    accountID: string;
    accountType: string;
    email: string;
    publicName: string;
    profilePicURL: string;
  };
  updatedBy: {
    accountID: string;
    accountType: string;
    email: string;
    publicName: string;
    profilePicURL: string;
  };
  space: {
    id: string;
    key: string;
    name: string;
    type: string;
    webLink: string | null;
  };
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

export interface ESIndexPayload<T> {
  id: string;
  doc: T;
}

export const indexSlackMessage = async (
  ...messages: Array<ESIndexPayload<SlackMessageDoc>>
) => {
  await Promise.all(
    messages.map(({ id, doc }) =>
      client.index({
        id,
        index: ElasticIndex.SlackMessages,
        body: doc,
      })
    )
  );
  await client.indices.refresh({ index: ElasticIndex.SlackMessages });
};

export const indexConfCloudContent = async (
  ...docs: Array<ESIndexPayload<ConfCloudDoc>>
) => {
  await Promise.all(
    docs.map(({ id, doc }) =>
      client.index({
        id,
        index: ElasticIndex.ConfCloudContent,
        body: doc,
      })
    )
  );
  await client.indices.refresh({ index: ElasticIndex.ConfCloudContent });
};

const queryParams = (
  index: ElasticIndex,
  query: string
): Record<string, any> => {
  switch (index) {
    case ElasticIndex.SlackMessages:
      return {
        query: {
          match: { text: query },
        },
      };
    case ElasticIndex.ConfCloudContent:
      return {
        query: {
          match: { body: { query, fuzziness: 'AUTO' } },
        },
      };
  }
};

export const countQuery = async (
  query: string,
  // TODO: change to provider.
  index: ElasticIndex
): Promise<number | null> => {
  const resp = await client.count<{ count: number }>({
    index,
    body: {
      ...queryParams(index, query),
    },
  });
  if (resp.statusCode !== 200) {
    logger.error(
      `received non-200 status while counting ${index} for "${query}": ${resp.warnings}`
    );
    return null;
  }

  return resp.body.count;
};

export const searchSlackMessages = async (
  query: string
): Promise<Array<SlackMessageDoc> | null> => {
  const index = ElasticIndex.SlackMessages;
  const resp = await client.search<
    ESSearchResult<SlackMessageDoc, { text: Array<string> }>
  >({
    index,
    body: {
      ...queryParams(index, query),
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
      sort: ['_score', { 'ts.keyword': 'desc' }],
    },
  });
  if (resp.statusCode !== 200) {
    logger.error(
      `received non-200 status while searching ${index} for "${query}": ${resp.warnings}`
    );
    return null;
  }

  return resp.body.hits.hits.map((h) => {
    if (!!h.highlight?.text) {
      return {
        ...h._source,
        text: h.highlight.text.join('…'),
      };
    }

    return h._source;
  });
};

export const searchConfCloudContent = async (
  query: string
): Promise<Array<ConfCloudDoc> | null> => {
  const index = ElasticIndex.ConfCloudContent;
  const resp = await client.search<
    ESSearchResult<ConfCloudDoc, { body: Array<string> }>
  >({
    index,
    body: {
      ...queryParams(index, query),
      highlight: {
        number_of_fragments: 3,
        fragment_size: 100,
        pre_tags: ['**'],
        post_tags: ['**'],
        fields: {
          body: {},
        },
      },
      sort: ['_score', { updated: 'desc' }],
    },
  });
  if (resp.statusCode !== 200) {
    logger.error(
      `received non-200 status while searching ${index} for "${query}": ${resp.warnings}`
    );
    return null;
  }

  return resp.body.hits.hits.map((h) => {
    if (!!h.highlight?.body) {
      return {
        ...h._source,
        body: h.highlight.body.map((s) => s.replace(/\n/g, '')).join('…'),
      };
    }

    return {
      ...h._source,
      body: h._source.body.replace(/\n/g, ''),
    };
  });
};
