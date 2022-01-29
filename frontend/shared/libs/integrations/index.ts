import { Provider } from 'generated/graphql_types';
import { useCallback, useEffect, useState } from 'react';
import { useMakeOAuthURL as useSlackURL } from './slack';

export const useOAuthURL = (provider: Provider, userId: string | undefined) => {
  const makeSlackURL = useSlackURL();
  const makeURL = useCallback(
    async (userId: string) => {
      switch (provider) {
        case Provider.Slack:
          return await makeSlackURL(userId);
        default:
          return null;
      }
    },
    [provider, makeSlackURL]
  );

  const [url, setURL] = useState<string | null | undefined>(undefined);
  const loading = url === undefined;

  useEffect(() => {
    if (!userId) return;
    if (url !== undefined) return;

    makeURL(userId).then((res) => setURL(res));
  }, [userId, url, makeURL]);

  return { url: url ?? null, loading, makeURL };
};
