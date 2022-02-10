import { registerEnumType } from 'type-graphql';

export enum Provider {
  ConfluenceCloud = 'CONFLUENCE_CLOUD',
  ConfluenceServer = 'CONFLUENCE_SERVER',
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

export enum GlobalCredentialKey {
  // Confluence Cloud.
  ConfCloudClientID = 'CONF_CLOUD_CLIENT_ID',
  ConfCloudClientSecret = 'CONF_CLOUD_CLIENT_SECRET',
  ConfCloudSpaceName = 'CONF_CLOUD_SPACE_NAME',
  // Slack.
  SlackClientID = 'SLACK_CLIENT_ID',
  SlackClientSecret = 'SLACK_CLIENT_SECRET',
  SlackAppToken = 'SLACK_APP_TOKEN',
  SlackBotToken = 'SLACK_BOT_TOKEN',
  SlackSigningSecret = 'SLACK_SIGNING_SECRET',
}

registerEnumType(GlobalCredentialKey, {
  name: 'GlobalCredentialKey',
  description: 'Key names which map to integration credential keys/secrets.',
});
