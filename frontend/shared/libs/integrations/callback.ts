import { NextApiRequest, NextApiResponse } from 'next';
import {
  GlobalApiCredentialDocument,
  Provider,
  Query,
  UpdateGlobalSharedUserCredentialDocument,
  UpsertUserApiCredentialDocument,
} from 'generated/graphql_types';
import FormData from 'form-data';
import fetch, { Response } from 'node-fetch';
import { client } from 'shared/libs/apollo';
import { supabase } from 'shared/libs/supabase';
import { getOAuthInfo, integrations } from 'constants/integrations';
import { globalCredentialMap } from '../credential';
import { logger } from 'logging';

export const callbackHandler = async (
  req: NextApiRequest,
  res: NextApiResponse,
  provider: Provider
) => {
  const { clientIDKey, clientSecretKey, oauthURI, callbackName } =
    getOAuthInfo(provider);
  const redirectURI = `https://${req.headers.host}/api/integrations/${callbackName}/callback`;
  const providerName = integrations[provider].name;

  if ('error' in req.query) {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        `Could not complete ${providerName} OAuth: ${req.query.error}`
      )}`
    );
    return;
  }

  // Retrieve user from Supabase access token.
  const { user, error } = await supabase.auth.api.getUser(
    req.query['state'] as string
  );

  if (!user) {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        'Could not retrieve your profile: please try again.'
      )}`
    );
    return;
  }

  if (error) {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        `Could not retrieve your profile: ${error.status} ${error.message}`
      )}`
    );
    return;
  }

  // Retrieve access token for user.

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

  const creds = globalCredentialMap(result?.data);

  const secret = creds[clientSecretKey];
  if (!secret) {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        `Missing ${clientSecretKey}. A workspace admin should enable this in the workspace settings.`
      )}`
    );
    return;
  }
  const clientID = creds[clientIDKey];
  if (!clientID) {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        `Missing ${clientIDKey}. A workspace admin should enable this in the workspace settings.`
      )}`
    );
    return;
  }

  let resp: Response | null = null;
  if (provider === Provider.Slack) {
    const formData = new FormData();
    formData.append('code', req.query['code'] as string);
    formData.append('redirect_uri', redirectURI);
    formData.append('client_id', clientID);
    formData.append('client_secret', secret);
    resp = await fetch(oauthURI, {
      method: 'POST',
      body: formData,
    });
  } else if (provider === Provider.ConfluenceCloud) {
    // First get refresh token.
    const data = JSON.stringify({
      grant_type: 'authorization_code',
      code: req.query['code'],
      redirect_uri: redirectURI,
      client_id: clientID,
      client_secret: secret,
    });
    resp = await fetch(oauthURI, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: data,
    });
  } else {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        `Unsupported provider ${provider}`
      )}`
    );
  }

  if (resp === null || !resp.ok) {
    logger.error(
      'error with OAuth call for %s: %s',
      provider,
      await resp?.text()
    );
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        `Could not connect to ${providerName}: ${resp?.status} ${resp?.statusText}`
      )}`
    );
    return;
  }

  const respJSON: { ok: boolean; error?: string } = (await resp.json()) as any;

  // Only Slack has ok parameter.
  if (provider === Provider.Slack && !respJSON.ok) {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        `Could not connect to ${providerName}: ${respJSON.error}`
      )}`
    );
    return;
  }

  // NB: we use the GraphQL endpoint here instead of supabase CRUD
  // since we need server-side encryption.

  try {
    if (provider === Provider.Slack) {
      // User-specific token providers.
      await client.mutate({
        mutation: UpsertUserApiCredentialDocument,
        variables: {
          userId: user.id,
          provider,
          credentialsJSON: respJSON,
        },
      });
    } else if (provider === Provider.ConfluenceCloud) {
      // Shared access token providers.
      await client.mutate({
        mutation: UpdateGlobalSharedUserCredentialDocument,
        variables: {
          provider,
          credentialsJSON: respJSON,
        },
      });
    } else {
      res.redirect(
        `/integrations?status=error&message=${encodeURIComponent(
          `Unsupported provider ${provider}`
        )}`
      );
    }
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
      `Your ${providerName} account has been connected!`
    )}`
  );
};
