import { makeQueryParams } from '../strings';

const scopes = [
  // To obtain refresh token.
  'offline_access',
  'read:confluence-space.summary',
  'read:confluence-props',
  'read:confluence-content.all',
  'read:confluence-content.summary',
  'search:confluence',
  'read:confluence-user',
  'read:confluence-groups',
];

export const makeConfCloudOAuthURL = (
  clientID: string,
  redirectURI: string,
  sessionToken: string
) => {
  return `https://auth.atlassian.com/authorize?${makeQueryParams({
    audience: 'api.atlassian.com',
    client_id: clientID,
    scope: encodeURIComponent(scopes.join(' ')),
    redirect_uri: redirectURI,
    state: sessionToken,
    response_type: 'code',
    prompt: 'consent',
  })}`;
};
