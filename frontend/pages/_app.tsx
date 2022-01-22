import '../styles/globals.css';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import theme from 'constants/theme';
import { AppPropsWithLayout } from 'pages/types';
import { useRouter } from 'next/router';
import { rtlLocales } from 'constants/language';
import useAuth from 'hooks/useAuth';
import { ReactElement, ReactNode } from 'react';

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);
  const { locale } = useRouter();
  const direction = locale && rtlLocales.includes(locale) ? 'rtl' : 'ltr';

  return (
    <ChakraProvider theme={extendTheme({ direction }, theme)}>
      <Inner>{getLayout(<Component {...pageProps} />)}</Inner>
    </ChakraProvider>
  );
}

const Inner = ({ children }: { children: ReactNode }) => {
  // This must go here so we can listen to auth changes everywhere.
  useAuth();
  return <>{children}</>;
};

export default MyApp;
