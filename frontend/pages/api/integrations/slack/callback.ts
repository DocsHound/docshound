import { NextApiRequest, NextApiResponse } from 'next';
import { clientID } from 'shared/libs/integrations/slack';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { client } from 'shared/libs/apollo';
import { queryGlobalApi } from 'shared/libs/gql_queries';
import { ApolloQueryResult, gql } from '@apollo/client';
import { GlobalApiCredential, Provider } from 'shared/libs/gql_types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Retrieve access token for user.
  const formData = new FormData();
  formData.append('code', req.query['code'] as string);
  formData.append(
    'redirect_uri',
    'https://localhost:3001/api/integrations/slack/callback'
  );
  formData.append('client_id', clientID);

  let result: ApolloQueryResult<{ globalApiCredential: GlobalApiCredential }>;
  try {
    result = await client.query({
      query: queryGlobalApi,
      variables: { provider: Provider.SLACK },
    });
  } catch (err) {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        'Could not retrieve API credentials from server.'
      )}`
    );
    return;
  }

  const secret =
    result.data.globalApiCredential.credentialsJSON['SLACK_CLIENT_SECRET'];
  if (!secret) {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        'Missing SLACK_CLIENT_SECRET. A workspace admin should enable this in the workspace settings.'
      )}`
    );
    return;
  }

  formData.append('client_secret', secret);
  console.log(req.query['code'], clientID, secret);
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
      mutation: gql`
        mutation upsertUserApiCredential(
          $userId: String!
          $provider: Provider!
          $credentialsJSON: JSONObject!
        ) {
          upsertUserApiCredential(
            userId: $userId
            provider: $provider
            credentialsJSON: $credentialsJSON
          ) {
            id
          }
        }
      `,
      variables: {
        userId: req.query['state'] as string,
        provider: Provider.SLACK,
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

  //   const supabase = makeSRoleSupabase();

  res.redirect(
    `/integrations?status=success&message=${encodeURIComponent(
      'Your Slack account has been connected!'
    )}`
  );
}
