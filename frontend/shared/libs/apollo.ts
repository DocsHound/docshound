import {
  ApolloClient,
  ApolloLink,
  createHttpLink,
  InMemoryCache,
} from '@apollo/client';
import { RetryLink } from '@apollo/client/link/retry';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { captureError, captureErrorMsg } from './errors';
import util from 'util';

const MAX_RETRIES = 5;

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      captureErrorMsg(
        `[GraphQL error]: Message: ${message}, Location: ${util.inspect(
          locations
        )}, Path: ${path}, operation: ${operation.operationName}`
      );
    });
  } else if (networkError) {
    const retryCount = operation.getContext()['retryCount'];
    if (retryCount === undefined || retryCount > MAX_RETRIES) {
      captureError(networkError);
    } else {
      console.warn(`Retrying network error (${retryCount}/${MAX_RETRIES})`);
    }
  }
});

const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 2000,
    jitter: true,
  },
  attempts: async (count, operation, error) => {
    if (
      // If error is not related to connection, do not retry
      !error.message ||
      !['Failed to fetch', 'Network request failed'].includes(error.message)
    ) {
      return false;
    }

    operation.setContext((context: any) => ({
      ...context,
      retryCount: count,
    }));
    return count <= MAX_RETRIES;
  },
});

const httpLink = createHttpLink({
  uri: `${process.env.NEXT_PUBLIC_DOCSHOUND_BACKEND_URL}/graphql`,
  credentials: 'include',
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      // When running on the server, pass secret.
      'X-Docshound-Server-Admin-Secret':
        process.env.DOCSHOUND_SERVER_ADMIN_SECRET,
    },
  };
});

export const client = new ApolloClient({
  link: ApolloLink.from([authLink, errorLink, retryLink, httpLink]),
  cache: new InMemoryCache(),
});
