import {
  useToast as useToastOriginal,
  UseToastOptions,
} from '@chakra-ui/react';

const useToast = (options?: UseToastOptions) =>
  useToastOriginal({
    duration: 5000,
    isClosable: true,
    position: 'top',
    variant: 'solid',
    ...options,
  });

export default useToast;
