import { App, ExpressReceiver } from '@slack/bolt';

export const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET ?? '',
  endpoints: '/',
});

export const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});
