import {
  GlobalCredentialKey,
  Provider,
} from 'shared/libs/gql_types/integration';

export const providerFields = (
  provider: Provider
): Array<GlobalCredentialKey> => {
  return {
    [Provider.ConfluenceCloud]: [],
    [Provider.ConfluenceServer]: [],
    [Provider.Github]: [],
    [Provider.GoogleDrive]: [],
    [Provider.Jira]: [],
    [Provider.Notion]: [],
    [Provider.Slack]: [
      GlobalCredentialKey.SlackClientID,
      GlobalCredentialKey.SlackClientSecret,
      GlobalCredentialKey.SlackAppToken,
      GlobalCredentialKey.SlackBotToken,
      GlobalCredentialKey.SlackSigningSecret,
    ],
  }[provider];
};

// These keys can be exposed to the frontend/public (e.g., client IDs for OAuth).
export const publicProviderFields = (
  provider: Provider
): Array<GlobalCredentialKey> => {
  return {
    [Provider.ConfluenceCloud]: [],
    [Provider.ConfluenceServer]: [],
    [Provider.Github]: [],
    [Provider.GoogleDrive]: [],
    [Provider.Jira]: [],
    [Provider.Notion]: [],
    [Provider.Slack]: [GlobalCredentialKey.SlackClientID],
  }[provider];
};
