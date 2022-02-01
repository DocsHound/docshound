import { NextApiRequest, NextApiResponse } from 'next';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { client } from 'shared/libs/apollo';
import {
  GlobalApiCredentialDocument,
  Provider,
  Query,
  UpsertUserApiCredentialDocument,
} from 'generated/graphql_types';
import {
  slackClientIDKey,
  slackClientSecretKey,
} from 'shared/libs/integrations/slack';

const provider = Provider.Slack;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if ('error' in req.query) {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        `Could not complete Slack OAuth: ${req.query.error}`
      )}`
    );
    return;
  }

  // Retrieve access token for user.
  const formData = new FormData();
  formData.append('code', req.query['code'] as string);
  formData.append(
    'redirect_uri',
    'https://localhost:3001/api/integrations/slack/callback'
  );

  let result: Query['globalApiCredential'];
  try {
    result = (
      await client.query<Query>({
        query: GlobalApiCredentialDocument,
        variables: { provider },
      })
    ).data.globalApiCredential;
  } catch (err) {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        'Could not retrieve API credentials from server.'
      )}`
    );
    return;
  }

  const secret = result?.credentialsJSON[slackClientSecretKey];
  if (!secret) {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        'Missing SLACK_CLIENT_SECRET. A workspace admin should enable this in the workspace settings.'
      )}`
    );
    return;
  }
  const clientID = result?.credentialsJSON[slackClientIDKey];
  if (!clientID) {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        'Missing SLACK_CLIENT_ID. A workspace admin should enable this in the workspace settings.'
      )}`
    );
    return;
  }

  formData.append('client_id', clientID);
  formData.append('client_secret', secret);
  // See https://api.slack.com/methods/oauth.v2.access for examples of responses.
  const resp = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    body: formData,
  });
  if (!resp.ok) {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        `Could not connect to Slack: ${resp.status} ${resp.statusText}`
      )}`
    );
    return;
  }

  const respJSON: { ok: boolean; error?: string } = (await resp.json()) as any;

  if (!respJSON.ok) {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        `Could not connect to Slack: ${respJSON.error}`
      )}`
    );
    return;
  }

  try {
    await client.mutate({
      mutation: UpsertUserApiCredentialDocument,
      variables: {
        userId: req.query['state'] as string,
        provider,
        credentialsJSON: respJSON,
      },
    });
  } catch (err) {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        'Could not save API credentials to server.'
      )}`
    );
    return;
  }

  res.redirect(
    `/integrations?status=success&message=${encodeURIComponent(
      'Your Slack account has been connected!'
    )}`
  );
}
