import { registerEnumType } from 'type-graphql';
import { slackKeys } from './slack';

export enum Provider {
  CONFLUENCE = 'CONFLUENCE',
  GITHUB = 'GITHUB',
  GOOGLE_DRIVE = 'GOOGLE_DRIVE',
  JIRA = 'JIRA',
  NOTION = 'NOTION',
  SLACK = 'SLACK',
}

registerEnumType(Provider, {
  name: 'Provider',
  description: 'Third-party integration/provider',
});

export const providerFields = (provider: Provider) => {
  return {
    [Provider.CONFLUENCE]: [],
    [Provider.GITHUB]: [],
    [Provider.GOOGLE_DRIVE]: [],
    [Provider.JIRA]: [],
    [Provider.NOTION]: [],
    [Provider.SLACK]: slackKeys,
  }[provider];
};
