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
import { integrations } from 'components/IntegrationCard/common';
import { GlobalIntegrationCard } from 'components/IntegrationCard';
import Dashboard from 'layouts/Dashboard';
import { workspace } from 'mocks/data';
import { NextApiRequest } from 'next';
import Head from 'next/head';
import { NextPageWithLayout } from 'pages/types';
import { BsFillGearFill } from 'react-icons/bs';
import { authServerSideProps } from 'shared/libs/supabase';

const Settings: NextPageWithLayout = () => {
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
            Connected Apps
          </Heading>
          <Text fontSize="sm">
            Enable an integration for your workspace to allow your team members
            to search across files and documents.
          </Text>
        </VStack>
        <Wrap spacing="4" justify="start">
          {integrations.map((integration) => (
            <WrapItem key={integration.name}>
              <GlobalIntegrationCard
                integration={integration}
              ></GlobalIntegrationCard>
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
      <BsFillGearFill />
      <Heading as="h2" size="sm">
        Workspace Settings
      </Heading>
    </HStack>
  );
};

Settings.getLayout = (page) => (
  <Dashboard headerCenter={HeaderCenter()}>{page}</Dashboard>
);

export const getServerSideProps = ({ req }: { req: NextApiRequest }) => {
  return authServerSideProps(req);
};

export default Settings;
