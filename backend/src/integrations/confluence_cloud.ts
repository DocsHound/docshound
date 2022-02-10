import { Prisma, PrismaClient } from '@prisma/client';
import axios, { AxiosResponse } from 'axios';
import { logger } from 'logging';
import path from 'path';
import {
  ConfCloudDoc,
  ESIndexPayload,
  indexConfCloudContent,
} from 'services/elasticsearch';
import {
  getGlobalAPICredential,
  globalCredentialMap,
  updateGlobalSharedUserCredential,
} from 'shared/libs/credential';
import {
  GlobalCredentialKey,
  Provider,
} from 'shared/libs/gql_types/integration';
import { convert } from 'html-to-text';
import { addTimedelta } from 'shared/libs/time';
import { DocType, Document, TextType } from 'shared/libs/gql_types/search';

// To add a new required token, simply add it to slackKeys.
const provider = Provider.ConfluenceCloud;
const curLogger = logger.child({ subservice: 'confluence-cloud' });

// See https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/#how-do-i-get-a-new-access-token--if-my-access-token-expires-or-is-revoked-.
interface SharedUserCreds extends Prisma.JsonObject {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

// See https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/#get-list-of-resources.
interface AccessibleResource {
  id: string;
  name: string;
  url: string;
  scopes: Array<string>;
  avatarUrl: string;
}

const getAPICreds = async (prisma: PrismaClient) => {
  const exist = await getGlobalAPICredential<SharedUserCreds>(prisma, provider);
  if (!exist) {
    curLogger.warn('could not make request: no global credentials');
    return null;
  }

  if (!exist.sharedUserCreds) {
    curLogger.warn('could not make request: no shared user credentials');
    return null;
  }

  return {
    globalCreds: globalCredentialMap(exist.globalCreds),
    sharedUserCreds: exist.sharedUserCreds,
  };
};

// This fetches & updates the access token (+ refresh token) to the DB. Returns if successful.
const fetchUpdateNewAccessToken = async (
  prisma: PrismaClient
): Promise<boolean> => {
  const exist = await getAPICreds(prisma);
  if (!exist) {
    return false;
  }
  curLogger.info(`fetching new access token...`);

  try {
    const resp = await axios.post<SharedUserCreds>(
      'https://auth.atlassian.com/oauth/token',
      {
        grant_type: 'refresh_token',
        client_id: exist.globalCreds[GlobalCredentialKey.ConfCloudClientID],
        client_secret:
          exist.globalCreds[GlobalCredentialKey.ConfCloudClientSecret],
        refresh_token: exist.sharedUserCreds.refresh_token,
      }
    );
    await updateGlobalSharedUserCredential(prisma, provider, resp.data);
    curLogger.info(`updated access/refresh token`);
    return true;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 403) {
      curLogger.error(
        'could not retrieve new access/refresh token: expired or user changed p/w, marking as invalid...'
      );
      await prisma.globalApiCredential.update({
        where: {
          provider,
        },
        data: {
          validSharedUserCredentials: false,
        },
      });
      return false;
    }
    throw err;
  }
};

const makeRequest = async <ReturnType, ParamsType = any, DataType = any>(args: {
  prisma: PrismaClient;
  endpoint: string;
  params?: ParamsType;
  data?: DataType;
  maxRetries?: number;
}): Promise<AxiosResponse<ReturnType> | null> => {
  const { prisma, endpoint, params, data, maxRetries = 2 } = args;
  curLogger.info('making request to %s...', endpoint);

  if (maxRetries < 0) {
    curLogger.error('max retries exceeded for %s, returning', endpoint);
    return null;
  }

  const exist = await getAPICreds(prisma);
  if (!exist) {
    return null;
  }

  const spaceName = exist.globalCreds[GlobalCredentialKey.ConfCloudSpaceName];
  if (!spaceName) {
    curLogger.error(
      'could not make request: invalid space name, got %s',
      spaceName
    );
    return null;
  }

  const instance = axios.create({
    baseURL: 'https://api.atlassian.com',
    timeout: 5000,
    headers: {
      Authorization: `Bearer ${exist.sharedUserCreds.access_token}`,
    },
  });

  try {
    // TODO(richardwu): cache this? Or fetch everytime.
    const spacesResp = await instance.get<Array<AccessibleResource>>(
      '/oauth/token/accessible-resources'
    );
    const space = spacesResp.data.find((r) => r.name === spaceName);
    if (!space) {
      // TODO(richardwu): how to surface?
      curLogger.error('could not find space %s', spaceName);
      return null;
    }

    const resolvedEndpoint = path.join('/ex/confluence', space.id, endpoint);
    curLogger.info('resolved endpoint: %s', resolvedEndpoint);
    const resp = await instance.get<
      ReturnType,
      AxiosResponse<ReturnType>,
      DataType
    >(resolvedEndpoint, {
      params,
      data,
    });
    curLogger.info(`request to ${endpoint} succeeded`);
    return resp;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      switch (err.response?.status) {
        case 401:
          curLogger.warn(
            `401 error while trying to reach ${err.request.url}, fetching new access token...`
          );
          // Error with access token: try to fetch a new access token and retry.
          if (await fetchUpdateNewAccessToken(prisma)) {
            curLogger.info(`fetched new access token, retrying ${endpoint}...`);
            return makeRequest({ ...args, maxRetries: maxRetries - 1 });
          }
          curLogger.error('failed to fetch new access token');
        default:
          throw err;
      }
    } else {
      throw err;
    }
  }
};

interface GenericLinks {
  // e.g., https://docshound.atlassian.net/wiki/rest/api/content/<id>
  self: string;
  // e.g., https://docshound.atlassian.net/wiki
  base?: string;

  // The following links must be appended to base to resolve.
  // e.g., /x/S4AB
  tinyui?: string;
  // e.g., /pages/resumedraft.action?draftId=<id>
  editui?: string;
  // e.g., /spaces/~<spaceid>/pages/<id>/<title>
  webui?: string;
}

interface User {
  type: 'known';
  accountId: string;
  accountType: 'atlassian' | 'app';
  email: string;
  publicName: string;
  displayName: string | null;
  isExternalCollaborator: boolean;
  profilePicture: {
    path: string;
    width: number;
    height: number;
    isDefault: boolean;
  };
  _links: GenericLinks;
}

interface Space {
  id: string;
  // e.g., DOCSHOUND
  key: string;
  // e.g., DocsHound
  name: string;
  type: 'global' | 'personal';
  status: 'current';
  _links: GenericLinks;
}

interface LastUpdated {
  by: User;
  // e.g., "2022-02-01T23:21:50.056Z" (UTC)
  when: string;
  // e.g., "Feb 01, 2022"
  friendlyWhen: string;
  message: string;
  contentTypeModified: boolean;
  // Version #
  number: number;
  _links: GenericLinks;
}

interface ContentHistory {
  latest: boolean;
  // If not expand,
  lastUpdated: LastUpdated;
  createdBy: User;
  // e.g., "2022-02-01T23:21:50.056Z" (UTC)
  createdDate: string;
  _links: GenericLinks;
}

interface ContentBody {
  view: {
    // HTML (no Confluence stuff)
    value: string;
    representation: 'view';
    _expandable: {
      // e.g., /rest/api/content/<id>
      content: string;
    };
  };
}

interface Content {
  id: string;
  type: 'page' | 'blogpost' | 'attachment' | 'content';
  status: 'current';
  title: string;
  // If not expand, this is string
  space: Space;
  // If not expand, this is string
  history: ContentHistory;
  // If not expand, this is empty string
  body: ContentBody;
  _expandable: {
    // e.g., /rest/api/space~<spaceid>
    container: string;
    // e.g., /rest/api/content/<id>/restrictions/byOperation
    restrictions: string;
    // e.g., /rest/api/content/<id>/history
    history: string;
    // e.g., /rest/api/space~<spaceid>
    space: string;
  };
  // If not expand, empty string.
  metadata: {
    labels: {
      results: Array<{
        // e.g., global
        prefix: string;
        id: string;
        name: string;
        label: string;
      }>;
      start: number;
      limit: number;
      size: number;
      _links: {
        // e.g., "https://docshound.atlassian.net/wiki/rest/api/content/<id>/label"
        self: string;
        // e.g., /rest/api/content/229377/label?next=true&limit=200&start=200
        next: string;
      };
    };
  };
  _links: GenericLinks;
}

// https://developer.atlassian.com/cloud/confluence/rest/api-group-content/#api-wiki-rest-api-content-get
interface ContentArray {
  results: Array<Content>;
  start: number;
  limit: number;
  size: number;
}

interface ContentArray {
  results: Array<Content>;
  start: number;
  limit: number;
  size: number;
  _links: {
    // e.g., https://docshound.atlassian.net/wiki
    base: string;
    // e.g., /wiki
    context: string;
    // e.g., /rest/api/content/search?next=true&cursor=_sa_WzE2NDQyMDI1MDUwMDAsIlx0MzI3ODk0IGwzNiQ%2BMSxEUDpXWk1SQktYZzJvIGNwIl0%3D&expand=space%2Chistory%2Chistory.lastUpdated%2Cbody.view&limit=5&start=5&cql=lastmodified+%3E%3D+2014-09-01+order+by+lastmodified+desc
    // Should pass this directly as the endpoint.
    next?: string;
    // e.g., https://docshound.atlassian.net/wiki/rest/api/content/search?expand=space%2Chistory%2Chistory.lastUpdated%2Cbody.view&cql=lastmodified+%3E%3D+2014-09-01+order+by+lastmodified+desc
    self: string;
  };
}

type ContentType = 'page' | 'blogpost' | 'attachment' | 'comment';

// See https://developer.atlassian.com/cloud/confluence/rest/api-group-content/#api-wiki-rest-api-content-get-request.
interface ContentReqParams {
  type?: ContentType;
  spaceKey?: string;
  // Required for type = page
  title?: string;
  status?: Array<string>;
  // Posting day of blogpost (yyyy-mm-dd).
  postingDay?: string;
  // Max 8 expansions: comma separated.
  expand?: string;
  orderby?: string;
}

interface SearchReqParams {
  cql: string;
  cqlcontext?: {
    spaceKey?: string;
    contentId?: string;
    contentStatuses?: string;
  };
  // Max 8 expansions: comma separated.
  expand: string;
  cursor?: string;
  limit?: number;
}

const getContentSummary = async ({
  prisma,
  afterModified,
  params,
  types = ['page', 'blogpost'],
}: {
  prisma: PrismaClient;
  // Format: yyyy-MM-dd or yyyy-MM-dd HH:mm
  afterModified: string;
  params?: Partial<ContentReqParams>;
  types?: Array<ContentType>;
}): Promise<ContentArray | undefined> => {
  // const resp = await makeRequest<ContentArray, ContentReqParams>(
  //   prisma,
  //   '/wiki/rest/api/content',
  //   {
  //     orderby: 'history.createdDate desc',
  //     expand: ['space', 'history', 'history.lastUpdated'].join(','),
  //     ...params,
  //   }
  // );

  const resp = await makeRequest<ContentArray, SearchReqParams>({
    prisma,
    // We use search here so we can order by lastmodified.
    endpoint: '/wiki/rest/api/content/search',
    params: {
      // See https://developer.atlassian.com/cloud/confluence/advanced-searching-using-cql.
      cql: `type IN (${types.join(
        ','
      )}) AND lastmodified >= "${afterModified}" order by lastmodified desc`,
      expand: [
        'space',
        'history',
        'history.lastUpdated',
        'body.view',
        'metadata.labels',
      ].join(','),
      limit: 1000,
      ...params,
    },
  });
  return resp?.data;
};

// For querying "next" from getContentSummary.
export const getContentSummaryNext = async (
  prisma: PrismaClient,
  nextEndpoint: string
): Promise<ContentArray | undefined> => {
  const resp = await makeRequest<ContentArray>({
    prisma,
    endpoint: nextEndpoint,
  });
  return resp?.data;
};

interface IndexOptions {
  fullIndex?: boolean;
}

// Link is anything under _links besides "self" (since "self" are resolved REST endpoints).
const makeFullURL = (contentArray: ContentArray, link: string) => {
  return path.join(
    contentArray._links.base,
    // Some links, e.g., profilePicture path, contains /wiki (since relative to root domain).
    link.replace(/^\/wiki/, '')
  );
};

const makeUserDoc = (contentArray: ContentArray, user: User) => {
  return {
    accountID: user.accountId,
    accountType: user.accountType,
    email: user.email,
    publicName: user.publicName,
    profilePicURL: makeFullURL(contentArray, user.profilePicture.path),
  };
};

const dateToModifiedFormat = (date: Date) => {
  const _padDigit = (digit: number) => {
    return `${digit}`.padStart(2, '0');
  };

  return `${date.getUTCFullYear()}-${_padDigit(
    date.getUTCMonth() + 1
  )}-${_padDigit(date.getUTCDate())} ${_padDigit(
    date.getUTCHours()
  )}:${_padDigit(date.getUTCMinutes())}`;
};

export const indexContent = async (
  prisma: PrismaClient,
  { fullIndex = false }: IndexOptions
) => {
  let nextURL: string | null | undefined = null;

  const latest = fullIndex
    ? null
    : await prisma.confCloudIndexLog.findFirst({
        orderBy: {
          latestModified: 'desc',
        },
      });
  const latestModified = latest?.latestModified
    ? // We subtract 1 day since we need to query in local timezone, but we have the UTC time.
      // Subtracting 1 day guarantees we don't miss anything regardless of timezone.
      dateToModifiedFormat(addTimedelta(latest.latestModified, { days: -1 }))
    : '1970-01-01';

  curLogger.info(
    'indexing w/ latest modified: %s (full: %s)...',
    latestModified,
    fullIndex
  );

  try {
    while (nextURL !== undefined) {
      const resp: ContentArray | undefined =
        nextURL === null
          ? await getContentSummary({ prisma, afterModified: latestModified })
          : await getContentSummaryNext(prisma, nextURL);

      if (!resp) {
        curLogger.warn('could not fetch content for indexing');
        return;
      }

      // TODO: add attachments/comments?
      const docs: Array<ESIndexPayload<ConfCloudDoc>> = resp.results.map(
        (r) => ({
          // URL for pages imply space + id = unique.
          id: `${r.space.id}:${r.id}`,
          doc: {
            id: r.id,
            type: r.type,
            status: r.status,
            created: r.history.createdDate,
            updated: r.history.lastUpdated.when,
            title: r.title,
            body: convert(r.body.view.value),
            baseURL: resp._links.base,
            webLink: r._links.webui ? makeFullURL(resp, r._links.webui) : null,
            tinyLink: r._links.tinyui
              ? makeFullURL(resp, r._links.tinyui)
              : null,
            labels: r.metadata.labels.results.map((l) => l.label),
            version: r.history.lastUpdated.number,
            createdBy: makeUserDoc(resp, r.history.createdBy),
            updatedBy: makeUserDoc(resp, r.history.lastUpdated.by),
            space: {
              id: r.space.id,
              key: r.space.key,
              name: r.space.name,
              type: r.space.type,
              webLink: r.space._links.webui
                ? makeFullURL(resp, r.space._links.webui)
                : null,
            },
          },
        })
      );

      if (docs) {
        await indexConfCloudContent(...docs);
        const latestModified = docs
          .map((d) => new Date(Date.parse(d.doc.updated)))
          .sort()
          .at(-1);

        if (latestModified) {
          await prisma.confCloudIndexLog.create({
            data: {
              fullIndex: fullIndex ?? false,
              latestModified,
              nResults: docs.length,
            },
          });
          curLogger.info('marked latestModified as %s', latestModified);
        }
      }

      nextURL = resp._links?.next;
      curLogger.info(
        'done indexing %d results, next? %s',
        docs.length,
        nextURL
      );
    }
  } catch (err) {
    curLogger.error(err);
  }
};

export const parseConfCloudDoc = (doc: ConfCloudDoc): Document => {
  return {
    provider,
    docType: doc.type === 'blogpost' ? DocType.BlogPost : DocType.Page,
    title: doc.title,
    desc: {
      text: doc.body,
      type: TextType.Markdown,
    },
    url: doc.webLink,
    // TODO: other authors.
    authors: [
      {
        resourceID: doc.createdBy.accountID,
        resourceName: doc.createdBy.publicName,
        resourceURL: path.join(doc.baseURL, 'people', doc.createdBy.accountID),
      },
    ],
    lastUpdated: new Date(Date.parse(doc.updated)),
    created: new Date(Date.parse(doc.created)),
  };
};
