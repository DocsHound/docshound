import { App, ExpressReceiver } from '@slack/bolt';

const slackClientIDKey = 'SLACK_CLIENT_ID';
const slackClientSecretKey = 'SLACK_CLIENT_SECRET';
const slackBotTokenKey = 'SLACK_BOT_TOKEN';
const slackSigningSecretKey = 'SLACK_SIGNING_SECRET';
export const slackKeys = [
  slackClientIDKey,
  slackClientSecretKey,
  slackBotTokenKey,
  slackSigningSecretKey,
];

export const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET ?? '',
  endpoints: '/',
});

export const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});
