import { gql } from '@apollo/client';
import { DecryptedGlobalApiCredentialFields } from './gql_types';

export const queryGlobalApi = gql`
  ${DecryptedGlobalApiCredentialFields}
  query globalApiCredential($provider: Provider!) {
    globalApiCredential(provider: $provider) {
      ...DecryptedGlobalApiCredentialFields
    }
  }
`;
