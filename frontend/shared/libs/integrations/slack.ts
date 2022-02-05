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

export const makeSlackOAuthURL = (
  clientID: string,
  redirectURI: string,
  sessionToken: String
) => {
  return `https://slack.com/oauth/v2/authorize?scope=${botScopes.join(
    ','
  )}&user_scope=${userScopes.join(
    ','
  )}&client_id=${clientID}&redirect_uri=${redirectURI}&state=${sessionToken}`;
};
