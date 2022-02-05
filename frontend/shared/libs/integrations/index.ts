import { NextApiRequest, NextApiResponse } from 'next';
import {
  GlobalApiCredentialDocument,
  Provider,
  Query,
  UpsertUserApiCredentialDocument,
} from 'generated/graphql_types';
import { useCallback, useEffect, useState } from 'react';
import { useMakeOAuthURL as useSlackURL } from './slack';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { client } from 'shared/libs/apollo';
import { supabase } from 'shared/libs/supabase';
import { getOAuthInfo, integrations } from 'constants/integrations';
import { globalCredentialMap } from '../credential';

export const useOAuthURL = (provider: Provider) => {
  const makeSlackURL = useSlackURL();
  const makeURL = useCallback(async () => {
    switch (provider) {
      case Provider.Slack:
        return await makeSlackURL();
      default:
        return null;
    }
  }, [provider, makeSlackURL]);

  const [url, setURL] = useState<string | null | undefined>(undefined);
  const loading = url === undefined;

  useEffect(() => {
    if (url !== undefined) return;

    makeURL().then((res) => setURL(res));
  }, [url, makeURL]);

  return { url: url ?? null, loading, makeURL };
};

export const callbackHandler = async (
  req: NextApiRequest,
  res: NextApiResponse,
  provider: Provider
) => {
  const redirectURI = `https://${
    req.headers.host
  }/api/integrations/${provider.toLowerCase()}/callback`;
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
  const formData = new FormData();
  formData.append('code', req.query['code'] as string);
  formData.append('redirect_uri', redirectURI);

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

  const { clientIDKey, clientSecretKey, oauthURI } = getOAuthInfo(provider);

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

  formData.append('client_id', clientID);
  formData.append('client_secret', secret);
  const resp = await fetch(oauthURI, {
    method: 'POST',
    body: formData,
  });
  if (!resp.ok) {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        `Could not connect to ${providerName}: ${resp.status} ${resp.statusText}`
      )}`
    );
    return;
  }

  const respJSON: { ok: boolean; error?: string } = (await resp.json()) as any;

  if (!respJSON.ok) {
    res.redirect(
      `/integrations?status=error&message=${encodeURIComponent(
        `Could not connect to ${providerName}: ${respJSON.error}`
      )}`
    );
    return;
  }

  try {
    await client.mutate({
      mutation: UpsertUserApiCredentialDocument,
      variables: {
        userId: user.id,
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
      `Your ${providerName} account has been connected!`
    )}`
  );
};
