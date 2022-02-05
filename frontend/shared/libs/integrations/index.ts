import { Provider } from 'generated/graphql_types';
import { useCallback, useEffect, useState } from 'react';
import { useMakeOAuthURL as useSlackURL } from './slack';

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
