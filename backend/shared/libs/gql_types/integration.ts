import { registerEnumType } from 'type-graphql';

export enum Provider {
  Confluence = 'CONFLUENCE',
  Github = 'GITHUB',
  GoogleDrive = 'GOOGLE_DRIVE',
  Jira = 'JIRA',
  Notion = 'NOTION',
  Slack = 'SLACK',
}

registerEnumType(Provider, {
  name: 'Provider',
  description: 'Third-party integration/provider',
});
