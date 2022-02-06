import {
  Box,
  Container,
  Heading,
  HStack,
  Text,
  Wrap,
  WrapItem,
  VStack,
} from '@chakra-ui/react';
import { UserIntegrationCard } from 'components/IntegrationCard';
import Dashboard from 'layouts/Dashboard';
import { workspace } from 'mocks/data';
import { NextApiRequest } from 'next';
import Head from 'next/head';
import { NextPageWithLayout } from 'pages/types';
import { FaLink } from 'react-icons/fa';
import { authServerSideProps } from 'shared/libs/supabase';
import { Provider } from 'generated/graphql_types';
import { integrations } from 'constants/integrations';
import SharedIntegrationCard from 'components/IntegrationCard/shared';
import { useHandleQueryMessage } from 'hooks/useQueryMessage';

const Integrations: NextPageWithLayout = () => {
  useHandleQueryMessage();

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
            Connecting to an integration allows you to search across files,
            messages, and documents with one search bar.
          </Text>
        </VStack>
        {/* Private */}
        <VStack p="4" align="start">
          <Heading as="h2" size="md">
            Private
          </Heading>
          <Text fontSize="sm">
            Private integrations allow you to search across private messages or
            files that only you have access to.
          </Text>
        </VStack>
        <Wrap spacing="4" justify="start" p="4">
          {Object.entries(integrations)
            .filter(([_, integration]) => integration.connectType === 'private')
            .map(([provider, integration]) => (
              <WrapItem key={integration.name}>
                <UserIntegrationCard
                  provider={provider as Provider}
                  integration={integration}
                ></UserIntegrationCard>
              </WrapItem>
            ))}
        </Wrap>
        {/* Shared */}
        <VStack p="4" align="start">
          <Heading as="h2" size="md">
            Shared
          </Heading>
          <Text fontSize="sm">
            Shared integrations are set up once for the entire workspace.
          </Text>
        </VStack>
        <Wrap spacing="4" justify="start" p="4">
          {Object.entries(integrations)
            .filter(([_, integration]) => integration.connectType === 'shared')
            .map(([provider, integration]) => (
              <WrapItem key={integration.name}>
                <SharedIntegrationCard
                  provider={provider as Provider}
                  integration={integration}
                ></SharedIntegrationCard>
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
