import '../styles/globals.css';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import theme from 'constants/theme';
import { AppPropsWithLayout } from 'pages/types';
import { useRouter } from 'next/router';
import { rtlLocales } from 'constants/language';

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);
  const { locale } = useRouter();
  const direction = locale && rtlLocales.includes(locale) ? 'rtl' : 'ltr';

  return (
    <ChakraProvider theme={extendTheme({ direction }, theme)}>
      {getLayout(<Component {...pageProps} />)}
    </ChakraProvider>
  );
}

export default MyApp;
