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
    clientIDKey: '',
    clientSecretKey: '',
    oauthURI: '',
    callbackName: 'github',
    connectType: 'shared',
  },
  [Provider.Notion]: {
    name: 'Notion',
    desc: 'Connect to search across your workspaces and pages.',
    logoURI: 'integration_logos/notion.svg',
    bgColor: 'gray.100',
    clientIDKey: '',
    clientSecretKey: '',
    oauthURI: '',
    callbackName: 'notion',
    connectType: 'shared',
  },
  [Provider.Slack]: {
    name: 'Slack',
    desc: 'Connect to search across channels, messages, and threads.',
    logoURI: 'integration_logos/slack.svg',
    bgColor: 'red.50',
    clientIDKey: GlobalCredentialKey.SlackClientId,
    clientSecretKey: GlobalCredentialKey.SlackClientSecret,
    // See https://api.slack.com/methods/oauth.v2.access for examples of responses.
    oauthURI: 'https://slack.com/api/oauth.v2.access',
    callbackName: 'slack',
    connectType: 'private',
  },
  [Provider.GoogleDrive]: {
    name: 'Google Drive',
    desc: 'Connect to search across files including docs and slides.',
    logoURI: 'integration_logos/google-drive.svg',
    bgColor: 'yellow.50',
    clientIDKey: '',
    clientSecretKey: '',
    oauthURI: '',
    callbackName: 'google_drive',
    connectType: 'shared',
  },
  [Provider.ConfluenceCloud]: {
    name: 'Confluence (Cloud)',
    desc: 'Connect to search across your spaces, pages, blog posts, and attachments.',
    logoURI: 'integration_logos/confluence.svg',
    bgColor: 'blue.50',
    clientIDKey: GlobalCredentialKey.ConfCloudClientId,
    clientSecretKey: GlobalCredentialKey.ConfCloudClientSecret,
    // See https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/#2--exchange-authorization-code-for-access-token.
    oauthURI: 'https://auth.atlassian.com/oauth/token',
    callbackName: 'confluence_cloud',
    connectType: 'shared',
  },
  [Provider.ConfluenceServer]: {
    name: 'Confluence (Server)',
    desc: 'Connect to search across your spaces, pages, blog posts, and attachments.',
    logoURI: 'integration_logos/confluence.svg',
    bgColor: 'blue.50',
    clientIDKey: '',
    clientSecretKey: '',
    oauthURI: '',
    callbackName: 'confluence_server',
    connectType: 'shared',
  },
  [Provider.Jira]: {
    name: 'Jira',
    desc: 'Connect to search across your issues and projects.',
    logoURI: 'integration_logos/jira.svg',
    bgColor: 'blue.50',
    clientIDKey: '',
    clientSecretKey: '',
    oauthURI: '',
    callbackName: 'jira',
    connectType: 'shared',
  },
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
