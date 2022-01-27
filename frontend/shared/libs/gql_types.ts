import { gql } from '@apollo/client';

export type Credentials = {
  [key: string]: string | null;
};

// Sync with backend (integrations/constants.ts).
export enum Provider {
  CONFLUENCE = 'CONFLUENCE',
  GITHUB = 'GITHUB',
  GOOGLE_DRIVE = 'GOOGLE_DRIVE',
  JIRA = 'JIRA',
  NOTION = 'NOTION',
  SLACK = 'SLACK',
}

export interface GlobalApiCredential {
  provider: Provider;
  exists: boolean;
  credentialsJSON: Credentials;
}

export const DecryptedGlobalApiCredentialFields = gql`
  fragment DecryptedGlobalApiCredentialFields on DecryptedGlobalApiCredential {
    provider
    exists
    credentialsJSON
  }
`;

export interface UserApiCredential {
  userId: string;
  provider: Provider;
  credentialsJSON: Credentials;
}
