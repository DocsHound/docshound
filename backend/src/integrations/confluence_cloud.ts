import { PrismaClient } from '@prisma/client';
import axios, { AxiosResponse } from 'axios';
import { logger } from 'logging';
import {
  getGlobalAPICredential,
  globalCredentialMap,
} from 'shared/libs/credential';
import {
  GlobalCredentialKey,
  Provider,
} from 'shared/libs/gql_types/integration';

// To add a new required token, simply add it to slackKeys.
const provider = Provider.ConfluenceCloud;

const makeRequest = async <ReturnType, DataType = any>(
  prisma: PrismaClient,
  endpoint: string,
  data?: DataType
) => {
  const exist = await getGlobalAPICredential(prisma, provider);
  if (!exist) {
    logger.warn(
      'could not make request to Confluence Cloud: no global credentials'
    );
    return null;
  }

  if (!exist.sharedUserCreds) {
    logger.warn(
      'could not make request to Confluence Cloud: no shared user credentials'
    );
    return null;
  }

  const globalCreds = globalCredentialMap(exist.globalCreds);
  const baseURL = globalCreds[GlobalCredentialKey.ConfCloudBaseURL];
  if (!baseURL) {
    logger.error(
      'could not make request to Confluence Cloud: no base URL, got %s',
      baseURL
    );
    return null;
  }

  const instance = axios.create({
    baseURL,
    timeout: 5000,
    headers: {
      Authorization: `Bearer ${exist.sharedUserCreds['access_token']}`,
    },
  });
  return instance.get<ReturnType, AxiosResponse<ReturnType>, DataType>(
    endpoint,
    {
      data,
    }
  );
};

interface Content {
  id: string;
  type: 'page' | 'blogpost' | 'attachment' | 'content';
  status: string;
  title: string;
}

// https://developer.atlassian.com/cloud/confluence/rest/api-group-content/#api-wiki-rest-api-content-get
interface ContentArray {
  results: Array<Content>;
  start: number;
  limit: number;
  size: number;
}

export const getAllContent = async (prisma: PrismaClient) => {
  const resp = await makeRequest<ContentArray>(
    prisma,
    '/wiki/rest/api/content'
  );
  console.log(resp?.data);
};
