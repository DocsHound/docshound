import { Provider } from 'shared/libs/gql_types/integration';
import { slackKeys, slackPublicKeys } from './slack';

export const providerFields = (provider: Provider) => {
  return {
    [Provider.Confluence]: [],
    [Provider.Github]: [],
    [Provider.GoogleDrive]: [],
    [Provider.Jira]: [],
    [Provider.Notion]: [],
    [Provider.Slack]: slackKeys,
  }[provider];
};

// These keys can be exposed to the frontend/public (e.g., client IDs for OAuth).
export const publicProviderFields = (provider: Provider) => {
  return {
    [Provider.Confluence]: [],
    [Provider.Github]: [],
    [Provider.GoogleDrive]: [],
    [Provider.Jira]: [],
    [Provider.Notion]: [],
    [Provider.Slack]: slackPublicKeys,
  }[provider];
};
