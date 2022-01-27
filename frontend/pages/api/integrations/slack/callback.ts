import { NextApiRequest, NextApiResponse } from 'next';
import { clientID } from 'shared/libs/integrations/slack';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { client } from 'shared/libs/apollo';
import { queryGlobalApi } from 'shared/libs/gql_queries';
import { ApolloQueryResult } from '@apollo/client';
import { GlobalApiCredential, Provider } from 'shared/libs/gql_types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Retrieve access token for user.
  const formData = new FormData();
  formData.append('code', req.query['code'] as string);
  formData.append('client_id', clientID);

  let result: ApolloQueryResult<{ globalApiCredential: GlobalApiCredential }>;
  try {
    result = await client.query({
      query: queryGlobalApi,
      variables: { provider: Provider.SLACK },
    });
  } catch (err) {
    res.redirect(
      `/integrations?error_message=${encodeURIComponent(
        'Could not retrieve API credentials from server.'
      )}`
    );
    return;
  }

  const secret =
    result.data.globalApiCredential.credentialsJSON['SLACK_CLIENT_SECRET'];
  if (!secret) {
    res.redirect(
      `/integrations?error_message=${encodeURIComponent(
        'Missing SLACK_CLIENT_SECRET. A workspace admin should enable this in the workspace settings.'
      )}`
    );
    return;
  }

  formData.append('client_secret', secret);
  // See https://api.slack.com/methods/oauth.v2.access for examples of responses.
  const resp = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    body: formData,
  });
  if (!resp.ok) {
    res.redirect(
      `/integrations?error_message=${encodeURIComponent(
        `Could not connect to Slack: ${resp.status} ${resp.statusText}`
      )}`
    );
    return;
  }

  const respJSON: { ok: boolean; error?: string } = (await resp.json()) as any;

  if (!respJSON.ok) {
    res.redirect(
      `/integrations?error_message=${encodeURIComponent(
        `Could not connect to Slack: ${respJSON.error}`
      )}`
    );
    return;
  }

  //   const supabase = makeSRoleSupabase();

  res.redirect('/integrations?redirect=false');
}
