import { DocType, Maybe, Provider } from 'generated/graphql_types';
import { Integration } from 'shared/libs/types';

export const integrations: Record<Provider, Integration> = {
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
  [Provider.Confluence]: {
    name: 'Confluence',
    desc: 'Connect to search across your wiki pages.',
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
