import {
  Box,
  Container,
  Heading,
  HStack,
  Text,
  Wrap,
  WrapItem,
  VStack,
  AlertStatus,
} from '@chakra-ui/react';
import { UserIntegrationCard } from 'components/IntegrationCard';
import Dashboard from 'layouts/Dashboard';
import { workspace } from 'mocks/data';
import { NextApiRequest } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { NextPageWithLayout } from 'pages/types';
import { useEffect } from 'react';
import { FaLink } from 'react-icons/fa';
import { authServerSideProps } from 'shared/libs/supabase';
import useToast from 'hooks/useToast';
import { Provider } from 'generated/graphql_types';
import { integrations } from 'constants/integrations';

const Integrations: NextPageWithLayout = () => {
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (router.query.message) {
      toast({
        title: router.query.message,
        status: router.query.status as AlertStatus,
      });
    }
  }, [toast, router.query.message, router.query.status]);

  return (
    <Box>
      <Head>
        <title>{workspace.name} | Integrations | DocsHound</title>
        <meta
          name="description"
          content="Manage your DocsHound integrations here."
        />
        <link rel="icon" href={workspace.favicon} />
      </Head>
      <Container maxW="1600">
        <VStack p="4" align="start">
          <Heading as="h1" size="lg">
            Integrations
          </Heading>
          <Text fontSize="sm">
            Connect to an integration to search across your own files, messages,
            and documents.
          </Text>
        </VStack>
        <Wrap spacing="4" justify="start">
          {Object.entries(integrations).map(([provider, integration]) => (
            <WrapItem key={integration.name}>
              <UserIntegrationCard
                provider={provider as Provider}
                integration={integration}
              ></UserIntegrationCard>
            </WrapItem>
          ))}
        </Wrap>
      </Container>
    </Box>
  );
};

const HeaderCenter = () => {
  return (
    <HStack fontSize="sm" verticalAlign="center" height="100%">
      <FaLink />
      <Heading as="h2" size="sm">
        Integrations
      </Heading>
    </HStack>
  );
};

Integrations.getLayout = (page) => (
  <Dashboard headerCenter={HeaderCenter()}>{page}</Dashboard>
);

export const getServerSideProps = ({ req }: { req: NextApiRequest }) => {
  return authServerSideProps(req);
};

export default Integrations;
