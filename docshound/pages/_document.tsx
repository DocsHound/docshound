import { ColorModeScript } from '@chakra-ui/react';
import NextDocument, { Html, Head, Main, NextScript } from 'next/document';
import theme from 'constants/theme';
import { rtlLocales } from 'constants/language';

export default class Document extends NextDocument {
  render() {
    const { locale } = this.props.__NEXT_DATA__;
    // From https://lingohub.com/academy/best-practices/rtl-language-list
    const dir = locale && rtlLocales.includes(locale) ? 'rtl' : 'ltr';

    return (
      <Html lang={locale} dir={dir}>
        <Head />
        <body>
          {/* 👇 Here's the script */}
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
