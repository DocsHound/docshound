import { AlertStatus } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import useToast from './useToast';

export const useHandleQueryMessage = () => {
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (router.query.message) {
      toast({
        title: router.query.message,
        status: router.query.status as AlertStatus,
      });
    }
    // Do not include toast here: otherwise it will cause a double trigger.
  }, [router.query.message, router.query.status]);
};
