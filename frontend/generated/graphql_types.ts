// THIS FILE IS GENERATED, DO NOT EDIT!
import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: any;
  /** The javascript `Date` as integer. Type represents date and time as number of milliseconds from start of UNIX epoch. */
  Timestamp: number;
};

export type DecryptedGlobalApiCredential = {
  __typename?: 'DecryptedGlobalApiCredential';
  credentialsJSON: Scalars['JSONObject'];
  exists: Scalars['Boolean'];
  provider: Provider;
};

export type DecryptedUserApiCredential = {
  __typename?: 'DecryptedUserApiCredential';
  credentialsJSON: Scalars['JSONObject'];
  provider: Provider;
  userId: Scalars['String'];
};

/** If applicable, specifies the type of the document within the provider (e.g., "DOC" for Google Docs, "SLIDE" for Google Slides, "FILE" for Slack files). */
export enum DocType {
  Doc = 'Doc',
  File = 'File',
  Slide = 'Slide',
  WebPage = 'WebPage'
}

export type Document = {
  __typename?: 'Document';
  authors: Array<ProviderResource>;
  created?: Maybe<Scalars['Timestamp']>;
  desc?: Maybe<SearchResultText>;
  docType?: Maybe<DocType>;
  lastUpdated?: Maybe<Scalars['Timestamp']>;
  provider: Provider;
  title?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
};

export type GlobalApiCredential = {
  __typename?: 'GlobalApiCredential';
  createdAt: Scalars['Timestamp'];
  encryptedCredentials: Scalars['String'];
  encryptionIV: Scalars['String'];
  id: Scalars['Int'];
  provider: Scalars['String'];
  updatedAt: Scalars['Timestamp'];
};

export type Message = {
  __typename?: 'Message';
  author?: Maybe<ProviderResource>;
  created?: Maybe<Scalars['Timestamp']>;
  group?: Maybe<ProviderResource>;
  message?: Maybe<SearchResultText>;
  provider: Provider;
  url?: Maybe<Scalars['String']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  upsertGlobalApiCredential: GlobalApiCredential;
  upsertUserApiCredential: UserApiCredential;
};


export type MutationUpsertGlobalApiCredentialArgs = {
  credentialsJSON: Scalars['JSONObject'];
  provider: Provider;
};


export type MutationUpsertUserApiCredentialArgs = {
  credentialsJSON: Scalars['JSONObject'];
  provider: Provider;
  userId?: InputMaybe<Scalars['String']>;
};

/** Third-party integration/provider */
export enum Provider {
  Confluence = 'Confluence',
  Github = 'Github',
  GoogleDrive = 'GoogleDrive',
  Jira = 'Jira',
  Notion = 'Notion',
  Slack = 'Slack'
}

export type ProviderResource = {
  __typename?: 'ProviderResource';
  resourceID: Scalars['String'];
  resourceName?: Maybe<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  globalApiCredential?: Maybe<DecryptedGlobalApiCredential>;
  /** This returns Global API credentials that are allowed to be viewed by the public (e.g., public client ID). */
  publicGlobalApiCredential?: Maybe<DecryptedGlobalApiCredential>;
  search: Array<SearchResult>;
  userApiCredential?: Maybe<DecryptedUserApiCredential>;
};


export type QueryGlobalApiCredentialArgs = {
  provider: Provider;
};


export type QueryPublicGlobalApiCredentialArgs = {
  provider: Provider;
};


export type QuerySearchArgs = {
  query: Scalars['String'];
};


export type QueryUserApiCredentialArgs = {
  provider: Provider;
};

export type SearchResult = Document | Message;

export type SearchResultText = {
  __typename?: 'SearchResultText';
  matches: Array<TextSlice>;
  text: Scalars['String'];
};

export type TextSlice = {
  __typename?: 'TextSlice';
  e: Scalars['Float'];
  s: Scalars['Float'];
};

export type UserApiCredential = {
  __typename?: 'UserApiCredential';
  createdAt: Scalars['Timestamp'];
  encryptedCredentials: Scalars['String'];
  encryptionIV: Scalars['String'];
  id: Scalars['Int'];
  provider: Scalars['String'];
  updatedAt: Scalars['Timestamp'];
  userId: Scalars['String'];
};

export type GlobalApiCredentialQueryVariables = Exact<{
  provider: Provider;
}>;


export type GlobalApiCredentialQuery = { __typename?: 'Query', globalApiCredential?: { __typename?: 'DecryptedGlobalApiCredential', provider: Provider, exists: boolean, credentialsJSON: any } | null | undefined };

export type PublicGlobalApiCredentialQueryVariables = Exact<{
  provider: Provider;
}>;


export type PublicGlobalApiCredentialQuery = { __typename?: 'Query', publicGlobalApiCredential?: { __typename?: 'DecryptedGlobalApiCredential', provider: Provider, exists: boolean, credentialsJSON: any } | null | undefined };

export type UpsertGlobalApiCredentialMutationVariables = Exact<{
  provider: Provider;
  credentialsJSON: Scalars['JSONObject'];
}>;


export type UpsertGlobalApiCredentialMutation = { __typename?: 'Mutation', upsertGlobalApiCredential: { __typename?: 'GlobalApiCredential', id: number } };

export type UpsertUserApiCredentialMutationVariables = Exact<{
  userId: Scalars['String'];
  provider: Provider;
  credentialsJSON: Scalars['JSONObject'];
}>;


export type UpsertUserApiCredentialMutation = { __typename?: 'Mutation', upsertUserApiCredential: { __typename?: 'UserApiCredential', id: number } };

export type UserApiCredentialQueryVariables = Exact<{
  provider: Provider;
}>;


export type UserApiCredentialQuery = { __typename?: 'Query', userApiCredential?: { __typename?: 'DecryptedUserApiCredential', userId: string, provider: Provider, credentialsJSON: any } | null | undefined };

export type DocumentFieldsFragment = { __typename?: 'Document', provider: Provider, docType?: DocType | null | undefined, title?: string | null | undefined, url?: string | null | undefined, lastUpdated?: number | null | undefined, created?: number | null | undefined, desc?: { __typename?: 'SearchResultText', text: string, matches: Array<{ __typename?: 'TextSlice', s: number, e: number }> } | null | undefined, authors: Array<{ __typename?: 'ProviderResource', resourceID: string, resourceName?: string | null | undefined }> };

export type MessageFieldsFragment = { __typename?: 'Message', provider: Provider, url?: string | null | undefined, created?: number | null | undefined, group?: { __typename?: 'ProviderResource', resourceID: string, resourceName?: string | null | undefined } | null | undefined, message?: { __typename?: 'SearchResultText', text: string, matches: Array<{ __typename?: 'TextSlice', s: number, e: number }> } | null | undefined, author?: { __typename?: 'ProviderResource', resourceID: string, resourceName?: string | null | undefined } | null | undefined };

export type SearchQueryVariables = Exact<{
  query: Scalars['String'];
}>;


export type SearchQuery = { __typename?: 'Query', search: Array<{ __typename?: 'Document', provider: Provider, docType?: DocType | null | undefined, title?: string | null | undefined, url?: string | null | undefined, lastUpdated?: number | null | undefined, created?: number | null | undefined, desc?: { __typename?: 'SearchResultText', text: string, matches: Array<{ __typename?: 'TextSlice', s: number, e: number }> } | null | undefined, authors: Array<{ __typename?: 'ProviderResource', resourceID: string, resourceName?: string | null | undefined }> } | { __typename?: 'Message', provider: Provider, url?: string | null | undefined, created?: number | null | undefined, group?: { __typename?: 'ProviderResource', resourceID: string, resourceName?: string | null | undefined } | null | undefined, message?: { __typename?: 'SearchResultText', text: string, matches: Array<{ __typename?: 'TextSlice', s: number, e: number }> } | null | undefined, author?: { __typename?: 'ProviderResource', resourceID: string, resourceName?: string | null | undefined } | null | undefined }> };

export const DocumentFieldsFragmentDoc = gql`
    fragment DocumentFields on Document {
  provider
  docType
  title
  desc {
    text
    matches {
      s
      e
    }
  }
  url
  authors {
    resourceID
    resourceName
  }
  lastUpdated
  created
}
    `;
export const MessageFieldsFragmentDoc = gql`
    fragment MessageFields on Message {
  provider
  group {
    resourceID
    resourceName
  }
  message {
    text
    matches {
      s
      e
    }
  }
  url
  author {
    resourceID
    resourceName
  }
  created
}
    `;
export const GlobalApiCredentialDocument = gql`
    query globalApiCredential($provider: Provider!) {
  globalApiCredential(provider: $provider) {
    provider
    exists
    credentialsJSON
  }
}
    `;

/**
 * __useGlobalApiCredentialQuery__
 *
 * To run a query within a React component, call `useGlobalApiCredentialQuery` and pass it any options that fit your needs.
 * When your component renders, `useGlobalApiCredentialQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGlobalApiCredentialQuery({
 *   variables: {
 *      provider: // value for 'provider'
 *   },
 * });
 */
export function useGlobalApiCredentialQuery(baseOptions: Apollo.QueryHookOptions<GlobalApiCredentialQuery, GlobalApiCredentialQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GlobalApiCredentialQuery, GlobalApiCredentialQueryVariables>(GlobalApiCredentialDocument, options);
      }
export function useGlobalApiCredentialLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GlobalApiCredentialQuery, GlobalApiCredentialQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GlobalApiCredentialQuery, GlobalApiCredentialQueryVariables>(GlobalApiCredentialDocument, options);
        }
export type GlobalApiCredentialQueryHookResult = ReturnType<typeof useGlobalApiCredentialQuery>;
export type GlobalApiCredentialLazyQueryHookResult = ReturnType<typeof useGlobalApiCredentialLazyQuery>;
export type GlobalApiCredentialQueryResult = Apollo.QueryResult<GlobalApiCredentialQuery, GlobalApiCredentialQueryVariables>;
export const PublicGlobalApiCredentialDocument = gql`
    query publicGlobalApiCredential($provider: Provider!) {
  publicGlobalApiCredential(provider: $provider) {
    provider
    exists
    credentialsJSON
  }
}
    `;

/**
 * __usePublicGlobalApiCredentialQuery__
 *
 * To run a query within a React component, call `usePublicGlobalApiCredentialQuery` and pass it any options that fit your needs.
 * When your component renders, `usePublicGlobalApiCredentialQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePublicGlobalApiCredentialQuery({
 *   variables: {
 *      provider: // value for 'provider'
 *   },
 * });
 */
export function usePublicGlobalApiCredentialQuery(baseOptions: Apollo.QueryHookOptions<PublicGlobalApiCredentialQuery, PublicGlobalApiCredentialQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PublicGlobalApiCredentialQuery, PublicGlobalApiCredentialQueryVariables>(PublicGlobalApiCredentialDocument, options);
      }
export function usePublicGlobalApiCredentialLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PublicGlobalApiCredentialQuery, PublicGlobalApiCredentialQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PublicGlobalApiCredentialQuery, PublicGlobalApiCredentialQueryVariables>(PublicGlobalApiCredentialDocument, options);
        }
export type PublicGlobalApiCredentialQueryHookResult = ReturnType<typeof usePublicGlobalApiCredentialQuery>;
export type PublicGlobalApiCredentialLazyQueryHookResult = ReturnType<typeof usePublicGlobalApiCredentialLazyQuery>;
export type PublicGlobalApiCredentialQueryResult = Apollo.QueryResult<PublicGlobalApiCredentialQuery, PublicGlobalApiCredentialQueryVariables>;
export const UpsertGlobalApiCredentialDocument = gql`
    mutation upsertGlobalApiCredential($provider: Provider!, $credentialsJSON: JSONObject!) {
  upsertGlobalApiCredential(
    provider: $provider
    credentialsJSON: $credentialsJSON
  ) {
    id
  }
}
    `;
export type UpsertGlobalApiCredentialMutationFn = Apollo.MutationFunction<UpsertGlobalApiCredentialMutation, UpsertGlobalApiCredentialMutationVariables>;

/**
 * __useUpsertGlobalApiCredentialMutation__
 *
 * To run a mutation, you first call `useUpsertGlobalApiCredentialMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpsertGlobalApiCredentialMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [upsertGlobalApiCredentialMutation, { data, loading, error }] = useUpsertGlobalApiCredentialMutation({
 *   variables: {
 *      provider: // value for 'provider'
 *      credentialsJSON: // value for 'credentialsJSON'
 *   },
 * });
 */
export function useUpsertGlobalApiCredentialMutation(baseOptions?: Apollo.MutationHookOptions<UpsertGlobalApiCredentialMutation, UpsertGlobalApiCredentialMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpsertGlobalApiCredentialMutation, UpsertGlobalApiCredentialMutationVariables>(UpsertGlobalApiCredentialDocument, options);
      }
export type UpsertGlobalApiCredentialMutationHookResult = ReturnType<typeof useUpsertGlobalApiCredentialMutation>;
export type UpsertGlobalApiCredentialMutationResult = Apollo.MutationResult<UpsertGlobalApiCredentialMutation>;
export type UpsertGlobalApiCredentialMutationOptions = Apollo.BaseMutationOptions<UpsertGlobalApiCredentialMutation, UpsertGlobalApiCredentialMutationVariables>;
export const UpsertUserApiCredentialDocument = gql`
    mutation upsertUserApiCredential($userId: String!, $provider: Provider!, $credentialsJSON: JSONObject!) {
  upsertUserApiCredential(
    userId: $userId
    provider: $provider
    credentialsJSON: $credentialsJSON
  ) {
    id
  }
}
    `;
export type UpsertUserApiCredentialMutationFn = Apollo.MutationFunction<UpsertUserApiCredentialMutation, UpsertUserApiCredentialMutationVariables>;

/**
 * __useUpsertUserApiCredentialMutation__
 *
 * To run a mutation, you first call `useUpsertUserApiCredentialMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpsertUserApiCredentialMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [upsertUserApiCredentialMutation, { data, loading, error }] = useUpsertUserApiCredentialMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      provider: // value for 'provider'
 *      credentialsJSON: // value for 'credentialsJSON'
 *   },
 * });
 */
export function useUpsertUserApiCredentialMutation(baseOptions?: Apollo.MutationHookOptions<UpsertUserApiCredentialMutation, UpsertUserApiCredentialMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpsertUserApiCredentialMutation, UpsertUserApiCredentialMutationVariables>(UpsertUserApiCredentialDocument, options);
      }
export type UpsertUserApiCredentialMutationHookResult = ReturnType<typeof useUpsertUserApiCredentialMutation>;
export type UpsertUserApiCredentialMutationResult = Apollo.MutationResult<UpsertUserApiCredentialMutation>;
export type UpsertUserApiCredentialMutationOptions = Apollo.BaseMutationOptions<UpsertUserApiCredentialMutation, UpsertUserApiCredentialMutationVariables>;
export const UserApiCredentialDocument = gql`
    query userApiCredential($provider: Provider!) {
  userApiCredential(provider: $provider) {
    userId
    provider
    credentialsJSON
  }
}
    `;

/**
 * __useUserApiCredentialQuery__
 *
 * To run a query within a React component, call `useUserApiCredentialQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserApiCredentialQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserApiCredentialQuery({
 *   variables: {
 *      provider: // value for 'provider'
 *   },
 * });
 */
export function useUserApiCredentialQuery(baseOptions: Apollo.QueryHookOptions<UserApiCredentialQuery, UserApiCredentialQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UserApiCredentialQuery, UserApiCredentialQueryVariables>(UserApiCredentialDocument, options);
      }
export function useUserApiCredentialLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UserApiCredentialQuery, UserApiCredentialQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UserApiCredentialQuery, UserApiCredentialQueryVariables>(UserApiCredentialDocument, options);
        }
export type UserApiCredentialQueryHookResult = ReturnType<typeof useUserApiCredentialQuery>;
export type UserApiCredentialLazyQueryHookResult = ReturnType<typeof useUserApiCredentialLazyQuery>;
export type UserApiCredentialQueryResult = Apollo.QueryResult<UserApiCredentialQuery, UserApiCredentialQueryVariables>;
export const SearchDocument = gql`
    query search($query: String!) {
  search(query: $query) {
    ... on Document {
      ...DocumentFields
    }
    ... on Message {
      ...MessageFields
    }
  }
}
    ${DocumentFieldsFragmentDoc}
${MessageFieldsFragmentDoc}`;

/**
 * __useSearchQuery__
 *
 * To run a query within a React component, call `useSearchQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchQuery({
 *   variables: {
 *      query: // value for 'query'
 *   },
 * });
 */
export function useSearchQuery(baseOptions: Apollo.QueryHookOptions<SearchQuery, SearchQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SearchQuery, SearchQueryVariables>(SearchDocument, options);
      }
export function useSearchLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SearchQuery, SearchQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SearchQuery, SearchQueryVariables>(SearchDocument, options);
        }
export type SearchQueryHookResult = ReturnType<typeof useSearchQuery>;
export type SearchLazyQueryHookResult = ReturnType<typeof useSearchLazyQuery>;
export type SearchQueryResult = Apollo.QueryResult<SearchQuery, SearchQueryVariables>;
export const namedOperations = {
  Query: {
    globalApiCredential: 'globalApiCredential',
    publicGlobalApiCredential: 'publicGlobalApiCredential',
    userApiCredential: 'userApiCredential',
    search: 'search'
  },
  Mutation: {
    upsertGlobalApiCredential: 'upsertGlobalApiCredential',
    upsertUserApiCredential: 'upsertUserApiCredential'
  },
  Fragment: {
    DocumentFields: 'DocumentFields',
    MessageFields: 'MessageFields'
  }
}