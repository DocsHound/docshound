import {
  DocType,
  GlobalCredentialKey,
  Maybe,
  Provider,
} from 'generated/graphql_types';
import { Integration } from 'shared/libs/types';

export const integrations: { [key in Provider]: Integration } = {
  [Provider.Github]: {
    name: 'Github',
    desc: 'Connect to search across your public & private repos.',
    logoURI: 'integration_logos/github.svg',
    bgColor: 'gray.100',
  },
  [Provider.Notion]: {
    name: 'Notion',
    desc: 'Connect to search across your workspaces and pages.',
    logoURI: 'integration_logos/notion.svg',
    bgColor: 'gray.100',
  },
  [Provider.Slack]: {
    name: 'Slack',
    desc: 'Connect to search across channels, messages, and threads.',
    logoURI: 'integration_logos/slack.svg',
    bgColor: 'red.50',
  },
  [Provider.GoogleDrive]: {
    name: 'Google Drive',
    desc: 'Connect to search across files including docs and slides.',
    logoURI: 'integration_logos/google-drive.svg',
    bgColor: 'yellow.50',
  },
  [Provider.ConfluenceCloud]: {
    name: 'Confluence (Clover)',
    desc: 'Connect to search across your spaces, pages, blog posts, and attachments.',
    logoURI: 'integration_logos/confluence.svg',
    bgColor: 'blue.50',
  },
  [Provider.ConfluenceServer]: {
    name: 'Confluence (Server)',
    desc: 'Connect to search across your spaces, pages, blog posts, and attachments.',
    logoURI: 'integration_logos/confluence.svg',
    bgColor: 'blue.50',
  },
  [Provider.Jira]: {
    name: 'Jira',
    desc: 'Connect to search across your issues and projects.',
    logoURI: 'integration_logos/jira.svg',
    bgColor: 'blue.50',
  },
};

export const getOAuthInfo = (
  provider: Provider
  // TODO: change return type to GlobalCredentialKey
): { clientIDKey: string; clientSecretKey: string; oauthURI: string } => {
  return {
    [Provider.Github]: { clientIDKey: '', clientSecretKey: '', oauthURI: '' },
    [Provider.Notion]: { clientIDKey: '', clientSecretKey: '', oauthURI: '' },
    [Provider.Slack]: {
      clientIDKey: GlobalCredentialKey.SlackClientId,
      clientSecretKey: GlobalCredentialKey.SlackClientSecret,
      // See https://api.slack.com/methods/oauth.v2.access for examples of responses.
      oauthURI: 'https://slack.com/api/oauth.v2.access',
    },
    [Provider.GoogleDrive]: {
      clientIDKey: '',
      clientSecretKey: '',
      oauthURI: '',
    },
    [Provider.ConfluenceCloud]: {
      clientIDKey: '',
      clientSecretKey: '',
      oauthURI: '',
    },
    [Provider.ConfluenceServer]: {
      clientIDKey: '',
      clientSecretKey: '',
      oauthURI: '',
    },
    [Provider.Jira]: { clientIDKey: '', clientSecretKey: '', oauthURI: '' },
  }[provider];
};

export const getIntegration = (
  provider: Provider,
  docType?: Maybe<DocType>
) => {
  if (provider === Provider.GoogleDrive && docType === DocType.Doc) {
    return {
      name: 'Google Docs',
      desc: 'Connect to search across your Docs files.',
      logoURI: 'integration_logos/google-docs.svg',
      bgColor: 'blue.50',
    };
  }

  return integrations[provider];
};
