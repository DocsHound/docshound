import { extendTheme } from '@chakra-ui/react';
import components from './components';

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
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

const theme = extendTheme({ config, components, colors });

export default theme;
