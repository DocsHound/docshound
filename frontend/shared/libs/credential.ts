import { GlobalCredentialOutputKv } from 'generated/graphql_types';

export const globalCredentialMap = (kvs?: Array<GlobalCredentialOutputKv>) => {
  return Object.fromEntries(kvs?.map(({ key, value }) => [key, value]) ?? []);
};
