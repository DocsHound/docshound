import { Provider } from '@supabase/supabase-js';
import {
  Box,
  Button,
  Heading,
  Image,
  Text,
  useColorModeValue,
  chakra,
  FormControl,
  Input,
  Stack,
  BoxProps,
  Icon,
} from '@chakra-ui/react';
import DividerWithText from 'components/DividerWithText';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { FaGithub, FaGoogle } from 'react-icons/fa';
import { assertEnvVar } from 'shared/libs/envvars';
import { supabase } from 'shared/libs/supabase';
import { capitalize } from 'shared/libs/strings';
import useToast from 'hooks/useToast';
import { logger } from 'logging';

const VALID_PROVIDERS: (Provider | 'email')[] = ['google', 'github', 'email'];

const Card = (props: BoxProps) => (
  <Box
    bg={useColorModeValue('white', 'gray.700')}
    py="8"
    px={{ base: '4', md: '10' }}
    shadow="base"
    rounded={{ sm: 'lg' }}
    {...props}
  />
);

const EmailForm = ({
  loading,
  setLoading,
}: {
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
}) => {
  const [email, setEmail] = useState('');
  const toast = useToast();

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signIn({ email });
      if (error) throw error;
    } catch (err: any) {
      toast({
        title: 'Could not sign-in with email.',
        description: err.error_description ?? err.message,
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <chakra.form
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
    >
      <Stack spacing="6" my="3">
        <FormControl id="email" isDisabled={loading}>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="myname@company.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormControl>
        <Button
          type="submit"
          colorScheme="brand"
          size="lg"
          fontSize="md"
          isDisabled={loading}
        >
          Continue
        </Button>
      </Stack>
    </chakra.form>
  );
};

export const getServerSideProps = () => {
  assertEnvVar('LOGIN_PROVIDERS');
  const loginProviders = (process.env.LOGIN_PROVIDERS ?? '')
    .split(',')
    .filter((v) => VALID_PROVIDERS.includes(v as Provider | 'email'));
  if (loginProviders.length === 0) {
    throw 'Please specify at least 1 valid LOGIN_PROVIDERS';
  }

  return {
    props: { loginProviders },
  };
};

const Login = ({ loginProviders }: { loginProviders: string[] }) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleLogin = async (provider: Provider) => {
    try {
      setLoading(true);
      const { user, session, error } = await supabase.auth.signIn(
        { provider },
        // Required when supabase on different domain.
        { redirectTo: `${window.location.protocol}//${window.location.host}` }
      );
      // NB: this proceeds shortly before redirecting to OAuth Screen, not after a success!
      logger.debug(`signing in with ${provider}: ${user}, ${session}`);
      if (error) throw error;
    } catch (err: any) {
      toast({
        title: `Could not sign-in with ${capitalize(provider)}.`,
        description: err.error_description ?? err.message,
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      bg={useColorModeValue('gray.50', 'inherit')}
      minH="100vh"
      py="12"
      px={{ base: '4', lg: '8' }}
    >
      <Box maxW="md" mx="auto">
        <Image
          src="/docshound-horizontal.svg"
          alt="Docshound"
          maxW="200px"
          mx="auto"
          my="6"
        />
        <Heading textAlign="center" size="xl" fontWeight="extrabold">
          Sign in to your account
        </Heading>
        <Text mt="4" mb="8" align="center" maxW="md" fontWeight="medium">
          <Text as="span">Don&apos;t have an account?</Text>
        </Text>
        <Card>
          {loginProviders.some((v) => ['google', 'github'].includes(v)) ? (
            <>
              <Stack mt="6" spacing="3">
                {loginProviders.includes('google') && (
                  <Button
                    variant="outline"
                    leftIcon={<Icon as={FaGoogle} />}
                    onClick={() => {
                      handleLogin('google');
                    }}
                  >
                    Continue with Google
                    {/* <VisuallyHidden>Login with Google</VisuallyHidden> */}
                    {/* <FaGoogle /> */}
                  </Button>
                )}
                {loginProviders.includes('github') && (
                  <Button
                    variant="outline"
                    leftIcon={<Icon as={FaGithub} />}
                    onClick={() => {
                      handleLogin('github');
                    }}
                  >
                    Continue with GitHub
                    {/* <VisuallyHidden>Login with Github</VisuallyHidden> */}
                  </Button>
                )}
              </Stack>
              <DividerWithText mt="6">or continue with email</DividerWithText>
            </>
          ) : (
            <DividerWithText mt="6">continue with email</DividerWithText>
          )}
          <EmailForm loading={loading} setLoading={setLoading} />
        </Card>
      </Box>
    </Box>
  );
};

export default Login;
