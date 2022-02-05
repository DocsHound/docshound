import {
  GlobalCredentialKey,
  GlobalCredentialOutputKv,
  Provider,
  usePublicGlobalApiCredentialLazyQuery,
} from 'generated/graphql_types';
import { globalCredentialMap } from '../credential';
import { supabase } from '../supabase';

export const slackClientIDKey = 'SLACK_CLIENT_ID';
export const slackClientSecretKey = 'SLACK_CLIENT_SECRET';
const provider = Provider.Slack;
const botScopes = [
  'channels:read',
  'users:read',
  'users:read.email',
  'users.profile:read',
  'usergroups:read',
];
const userScopes = [
  'groups:history',
  'im:history',
  'search:read',
  'channels:history',
  'mpim:history',
  'groups:read',
];

export const useMakeOAuthURL = () => {
  const [getGlobalAPICred] = usePublicGlobalApiCredentialLazyQuery({
    variables: {
      provider,
    },
  });

  const makeOAuthURL = async () => {
    return '';
    // const redirect = `${window.location.protocol}//${window.location.host}/api/integrations/slack/callback`;

    // const globalCred = await getGlobalAPICred();

    // const clientID = globalCredentialMap(
    //   globalCred.data?.publicGlobalApiCredential
    //     ?.data as Array<GlobalCredentialOutputKv>
    // )[GlobalCredentialKey.SlackClientId];
    // if (!clientID) {
    //   return null;
    // }

    // const sessionToken = supabase.auth.session()?.access_token;
    // if (!sessionToken) {
    //   return null;
    // }

    // return `https://slack.com/oauth/v2/authorize?scope=${botScopes.join(
    //   ','
    // )}&user_scope=${userScopes.join(
    //   ','
    // )}&client_id=${clientID}&redirect_uri=${redirect}&state=${sessionToken}`;
  };

  return makeOAuthURL;
};
