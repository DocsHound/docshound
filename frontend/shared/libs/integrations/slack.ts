// TODO: retrieve from backend.
export const clientID = '2984827868465.2974499456932';
const botScopes =
  'channels:read,users:read,users:read.email,users.profile:read,usergroups:read';
const userScopes =
  'groups:history,im:history,search:read,channels:history,mpim:history,groups:read';

export const makeOAuthURL = (userId: string) => {
  const redirect = `${window.location.protocol}//${window.location.host}/api/integrations/slack/callback`;
  return `https://slack.com/oauth/v2/authorize?scope=${botScopes}&user_scope=${userScopes}&client_id=${clientID}&redirect_uri=${redirect}&state=${userId}`;
};
