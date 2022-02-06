import { integrations } from 'constants/integrations';
import {
  GlobalCredentialOutputKv,
  Provider,
  usePublicGlobalApiCredentialLazyQuery,
} from 'generated/graphql_types';
import { useCallback, useEffect, useState } from 'react';
import { globalCredentialMap } from '../credential';
import { supabase } from '../supabase';
import { makeConfCloudOAuthURL } from './confluence_cloud';
import { makeSlackOAuthURL } from './slack';

export const useOAuthURL = (provider: Provider) => {
  const [getGlobalAPICred] = usePublicGlobalApiCredentialLazyQuery({
    variables: {
      provider,
    },
  });

  const makeOAuthURL = useCallback(async (): Promise<string | null> => {
    const { clientIDKey, callbackName } = integrations[provider];
    const redirectURI = `${window.location.protocol}//${window.location.host}/api/integrations/${callbackName}/callback`;

    const globalCred = await getGlobalAPICred();
    const clientID = globalCredentialMap(
      globalCred.data?.publicGlobalApiCredential
        ?.data as Array<GlobalCredentialOutputKv>
    )[clientIDKey];
    if (!clientID) {
      console.warn(`no client ID for ${provider}, cannot create OAuth URL`);
      return null;
    }

    const sessionToken = supabase.auth.session()?.access_token;
    if (!sessionToken) {
      console.warn(
        `no user session token, cannot create ${provider} OAuth URL`
      );
      return null;
    }

    switch (provider) {
      case Provider.Slack:
        return makeSlackOAuthURL(clientID, redirectURI, sessionToken);
      case Provider.ConfluenceCloud:
        return makeConfCloudOAuthURL(clientID, redirectURI, sessionToken);
      default:
        console.warn(`unsupported provider ${provider} for OAuth`);
        return null;
    }
  }, [provider, getGlobalAPICred]);

  const [url, setURL] = useState<string | null | undefined>(undefined);
  const loading = url === undefined;
  useEffect(() => {
    if (url !== undefined) return;

    makeOAuthURL().then((res) => setURL(res));
  }, [url, makeOAuthURL]);

  return { url: url ?? null, loading };
};
