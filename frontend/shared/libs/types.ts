export interface Integration {
  name: string;
  desc: string;
  logoURI: string;
  bgColor: string;
  clientIDKey: string;
  clientSecretKey: string;
  // URI to call with OAuth code + client ID + client secret to generate refresh/access token.
  oauthURI: string;
  // Corresponds to /pages/api/integrations/<callbackName>/callback.
  callbackName: string;

  // Explanation of types:
  //  - private: requires each individual user to connect via OAuth (e.g., Slack)
  //  - shared: requires an Admin to connect via OAuth (e.g., Confluence)
  connectType: 'private' | 'shared';
}
