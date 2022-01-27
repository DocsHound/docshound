import '../styles/globals.css';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import theme from 'constants/theme';
import { AppPropsWithLayout } from 'pages/types';
import { useRouter } from 'next/router';
import { rtlLocales } from 'constants/language';
import useAuth from 'hooks/useAuth';
import { ReactNode } from 'react';
import { ApolloProvider } from '@apollo/client';
import { client } from 'shared/libs/apollo';
import { AppUserContext, useAppUser } from 'contexts/AppUser';

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);
  const { locale } = useRouter();
  const direction = locale && rtlLocales.includes(locale) ? 'rtl' : 'ltr';

  return (
    <ApolloProvider client={client}>
      <ChakraProvider theme={extendTheme({ direction }, theme)}>
        <Inner>{getLayout(<Component {...pageProps} />)}</Inner>
      </ChakraProvider>
    </ApolloProvider>
  );
}

const Inner = ({ children }: { children: ReactNode }) => {
  // This must go here so we can listen to auth changes everywhere.
  const user = useAuth();
  const appUser = useAppUser(user);
  return (
    <AppUserContext.Provider value={appUser}>
      {children}
    </AppUserContext.Provider>
  );
};

export default MyApp;
