import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const components = {
  Text: {
    variants: {
      secondary: {
        color: 'gray.400',
      },
    },
  },
  Heading: {
    baseStyle: {
      fontWeight: 'normal',
    },
  },
};

const colors = {
  // https://coolors.co/e3e2ff-cec9f5-b9b0eb-a397e2-8e7ed8-7964ce-644bc4-4e32bb-3919b1-2400a7
  brand: {
    50: '#E3E2FF',
    100: '#CEC9F5',
    200: '#B9B0EB',
    300: '#A397E2',
    400: '#8E7ED8',
    500: '#7964CE',
    600: '#644BC4',
    700: '#4E32BB',
    800: '#3919B1',
    900: '#2400A7',
  },
};

const sizes = {
  container: {},
};

const fontSizes = {
  // xs: '0.5rem',
  // sm: '0.75rem',
  // md: '0.875rem',
  // lg: '1rem',
  // xl: '1.125rem',
  // '2xl': '1.25rem',
  // '3xl': '1.5rem',
  // '4xl': '1.875rem',
  // '5xl': '2.25rem',
  // '6xl': '3rem',
  // '7xl': '3.75rem',
  // '8xl': '4.5rem',
  // '9xl': '6rem',
};

const theme = extendTheme({ config, components, fontSizes, colors });

export default theme;
