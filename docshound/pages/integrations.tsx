import {
  AspectRatio,
  Box,
  Center,
  Container,
  Heading,
  HStack,
  Text,
  Image,
  Wrap,
  WrapItem,
  Button,
  Flex,
  Icon,
  VStack,
} from '@chakra-ui/react';
import Dashboard from 'layouts/Dashboard';
import { workspace } from 'mocks/data';
import Head from 'next/head';
import { NextPageWithLayout } from 'pages/types';
import { FaLink, FaUnlink } from 'react-icons/fa';

interface IntegrationCardProps {
  name: string;
  desc: string;
  logo: string;
  bgColor: string;
}

const IntegrationCard = ({
  name,
  desc,
  logo,
  bgColor,
}: IntegrationCardProps) => {
  return (
    <Flex
      direction="column"
      justify="center"
      align="center"
      maxW="xs"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      maxH="md"
      p="4"
    >
      <AspectRatio w="128px" ratio={1} borderRadius="lg" bg={bgColor}>
        <Center>
          <Image src={logo} alt={name} width="48px" />
        </Center>
      </AspectRatio>
      <Box p="6" pb="0" textAlign="center">
        <Heading as="h3" fontWeight="semibold" size="md" m="1">
          {name}
        </Heading>
        <Text fontSize="sm" m="1">
          {desc}
        </Text>

        <Button
          m="4"
          aria-label={`Connect ${name}`}
          leftIcon={<Icon as={FaLink} />}
          colorScheme="brand"
        >
          Connect
        </Button>
      </Box>
    </Flex>
  );
};

const integrations = [
  {
    name: 'Github',
    desc: 'Connect to search across your public & private repos.',
    logo: 'integration_logos/github.svg',
    bgColor: 'gray.100',
  },
  {
    name: 'Notion',
    desc: 'Connect to search across your workspaces and pages.',
    logo: 'integration_logos/notion.svg',
    bgColor: 'gray.100',
  },
  {
    name: 'Slack',
    desc: 'Connect to search across channels, messages, and threads.',
    logo: 'integration_logos/slack.svg',
    bgColor: 'red.50',
  },
  {
    name: 'Google Drive',
    desc: 'Connect to search across files including docs and slides.',
    logo: 'integration_logos/google-drive.svg',
    bgColor: 'yellow.50',
  },
  {
    name: 'Confluence',
    desc: 'Connect to search across your wiki pages.',
    logo: 'integration_logos/confluence.svg',
    bgColor: 'blue.50',
  },
  {
    name: 'Jira',
    desc: 'Connect to search across your issues and projects.',
    logo: 'integration_logos/jira.svg',
    bgColor: 'blue.50',
  },
];

const Integrations: NextPageWithLayout = () => {
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
            Connect to an integration to search across files and documents in
            that app.
          </Text>
        </VStack>
        <Wrap spacing="4" justify="start">
          {integrations.map(({ name, desc, logo, bgColor }) => (
            <WrapItem key={name}>
              <IntegrationCard
                name={name}
                desc={desc}
                logo={logo}
                bgColor={bgColor}
              ></IntegrationCard>
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

export default Integrations;
