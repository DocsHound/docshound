import { Provider } from 'shared/libs/gql_types';

export interface Integration {
  provider: Provider;
  name: string;
  desc: string;
  logo: string;
  bgColor: string;
}

export const integrations: Integration[] = [
  {
    name: 'Github',
    provider: Provider.GITHUB,
    desc: 'Connect to search across your public & private repos.',
    logo: 'integration_logos/github.svg',
    bgColor: 'gray.100',
  },
  {
    name: 'Notion',
    provider: Provider.NOTION,
    desc: 'Connect to search across your workspaces and pages.',
    logo: 'integration_logos/notion.svg',
    bgColor: 'gray.100',
  },
  {
    name: 'Slack',
    provider: Provider.SLACK,
    desc: 'Connect to search across channels, messages, and threads.',
    logo: 'integration_logos/slack.svg',
    bgColor: 'red.50',
  },
  {
    name: 'Google Drive',
    provider: Provider.GOOGLE_DRIVE,
    desc: 'Connect to search across files including docs and slides.',
    logo: 'integration_logos/google-drive.svg',
    bgColor: 'yellow.50',
  },
  {
    name: 'Confluence',
    provider: Provider.CONFLUENCE,
    desc: 'Connect to search across your wiki pages.',
    logo: 'integration_logos/confluence.svg',
    bgColor: 'blue.50',
  },
  {
    name: 'Jira',
    provider: Provider.JIRA,
    desc: 'Connect to search across your issues and projects.',
    logo: 'integration_logos/jira.svg',
    bgColor: 'blue.50',
  },
];
