import { Provider } from '../shared/libs/gql_types/integration';
import { slackKeys } from './slack';

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
