import Head from 'next/head';
import {
  Text,
  Box,
  Container,
  Input,
  VStack,
  Flex,
  HStack,
  Icon,
  Link,
  Avatar,
  Image,
  useColorModeValue,
  Button,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { ReactElement, useEffect, useRef, useState } from 'react';
import { NextPageWithLayout } from 'pages/types';
import Dashboard from 'layouts/Dashboard';
import { user, workspace } from 'mocks/data';
import {
  humanReadableDatetime,
  humanReadableDuration,
  timeOfDay,
} from 'shared/libs/time';
import {
  BsMoonStarsFill,
  BsSunFill,
  BsSunriseFill,
  BsSunsetFill,
} from 'react-icons/bs';
import { Search2Icon } from '@chakra-ui/icons';
import { NextApiRequest } from 'next';
import { authServerSideProps } from 'shared/libs/supabase';

const results: Array<ResultItemProps> = [
  {
    source: 'google-drive-docs',
    title: 'RFC: Centering a div',
    desc: {
      text: 'This is an rfc for centering divs ... Centering a div is rather difficult because of the complexities of CSS ... Every div matters',
      bold: [
        { s: 19, e: 33 },
        { s: 38, e: 53 },
        { s: 119, e: 122 },
      ],
    },
    url: 'https://docs.google.com/',
    lastUpdated: new Date().getTime() - 1000 * 60 * 32,
    author: user,
  },
  {
    source: 'confluence',
    title: 'Tutorial on Centering Divs',
    desc: {
      text: 'Centering divs are quite difficult: that is why we wrote this 20-minute tutorial on how to center a div.',
      bold: [
        { s: 0, e: 14 },
        { s: 91, e: 103 },
      ],
    },
    url: 'https://confluence.atlassian.com/',
    lastUpdated: new Date().getTime() - 1000 * 60 * 60 * 24 * 9,
    author: user,
  },
];

type ResultSource = 'google-drive-docs' | 'confluence';

const SOURCE_SVG = {
  'google-drive-docs': '/integration_logos/google-docs.svg',
  confluence: '/integration_logos/confluence.svg',
};

const SOURCE_NAME = {
  'google-drive-docs': 'Google Docs',
  confluence: 'Confluence',
};

interface ResultDesc {
  text: string;
  bold: Array<{ s: number; e: number }>;
}

interface ResultItemProps {
  source: ResultSource;
  title: string;
  desc: ResultDesc;
  url: string;
  lastUpdated: number;
  author: {
    firstName: string;
    lastName: string;
    avatar: string;
  };
}

const DualLogo = ({
  outerSrc,
  innerSrc,
  alt,
}: {
  outerSrc: string;
  innerSrc: string;
  alt: string;
}) => {
  return (
    <Box position="relative" w="60px" h="60px">
      <Image src={outerSrc} alt={alt} w="48px" h="48px"></Image>
      <Avatar
        bg="white"
        src={innerSrc}
        size="sm"
        position="absolute"
        p="1"
        insetEnd={0}
        bottom={0}
      />
    </Box>
  );
};

const SingleLogo = ({ src, alt }: { src: string; alt: string }) => {
  return (
    <Box position="relative" w="60px" h="60px">
      <Image src={src} alt={alt} w="48px" h="48px"></Image>
    </Box>
  );
};

const ResultLogo = ({ source }: { source: ResultSource }) => {
  return {
    'google-drive-docs': (
      <DualLogo
        outerSrc={SOURCE_SVG['google-drive-docs']}
        innerSrc="/integration_logos/google-drive.svg"
        alt={SOURCE_SVG['google-drive-docs']}
      />
    ),
    confluence: (
      <SingleLogo
        src={SOURCE_SVG['confluence']}
        alt={SOURCE_SVG['confluence']}
      />
    ),
  }[source];
};

const FilterLogo = ({ source }: { source: ResultSource }) => {
  return (
    <Image src={SOURCE_SVG[source]} alt={SOURCE_NAME[source]} w="4" h="4" />
  );
};

const ResultDesc = ({ desc }: { desc: ResultDesc }) => {
  let prev = 0;
  let textElems: Array<ReactElement> = [];
  for (const { s, e } of desc.bold) {
    if (s !== prev) {
      textElems.push(<span key={prev}>{desc.text.slice(prev, s)}</span>);
    }
    textElems.push(
      <span key={s} style={{ fontWeight: 'bold' }}>
        {desc.text.slice(s, e)}
      </span>
    );
    prev = e;
  }
  if (desc.text.length !== prev) {
    textElems.push(<span key={prev}>{desc.text.slice(prev)}</span>);
  }

  return <Text>{textElems}</Text>;
};

const ResultItem = ({
  source,
  title,
  desc,
  url,
  lastUpdated,
  author,
}: ResultItemProps) => {
  const linkColor = useColorModeValue('brand.500', 'brand.200');

  return (
    <HStack align="start" width="100%">
      <ResultLogo source={source} />
      <VStack align="start" flex="1">
        <NextLink href={url} passHref>
          <Link
            fontSize="lg"
            color={linkColor}
            fontWeight="semibold"
            isExternal
          >
            {title}
          </Link>
        </NextLink>
        <HStack fontSize="xs">
          <Text variant="secondary">
            Updated {humanReadableDuration(new Date(lastUpdated), new Date())}{' '}
            ago
          </Text>
          <Avatar src={author.avatar} size="xs"></Avatar>
          <Text variant="secondary">
            {author.firstName} {author.lastName}
          </Text>
        </HStack>
        <ResultDesc desc={desc} />
      </VStack>
    </HStack>
  );
};

const Home: NextPageWithLayout = () => {
  const [query, setQuery] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  return (
    <Box>
      <Head>
        <title>DocsHound | {workspace.name}</title>
        <meta name="description" content={workspace.desc} />
        <link rel="icon" href={workspace.favicon} />
      </Head>
      <Container maxW="1080">
        <Input
          ref={searchRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          placeholder="Search across your apps, documents, and more."
          size="sm"
        ></Input>
        <Flex direction="row" align="flex-start" justify="space-between" my="5">
          <VStack maxW="800" align="start" spacing="5">
            {results.map(
              ({ source, title, desc, url, lastUpdated, author }) => (
                <ResultItem
                  key={url}
                  source={source}
                  title={title}
                  desc={desc}
                  url={url}
                  lastUpdated={lastUpdated}
                  author={author}
                />
              )
            )}
          </VStack>
          <VStack align="flex-start">
            <Text variant="secondary" fontSize="xs">
              Found 24k results
            </Text>
            <Button
              leftIcon={<Search2Icon />}
              variant="solid"
              colorScheme="brand"
              w="100%"
              justifyContent="flex-start"
              px="5"
            >
              All
            </Button>
            {Array.from(new Set(results.map((r) => r.source))).map((source) => (
              <Button
                key={source}
                leftIcon={<FilterLogo source={source} />}
                variant="ghost"
                colorScheme="brand"
                w="100%"
                justifyContent="flex-start"
                px="5"
              >
                {SOURCE_NAME[source]}
              </Button>
            ))}
          </VStack>
        </Flex>
      </Container>
    </Box>
  );
};

const HeaderCenter = () => {
  const date = new Date();
  const tod = timeOfDay(date);
  const readable = humanReadableDatetime(date, true);
  return (
    <Flex align="flex-start">
      <VStack align="flex-start">
        <Text fontSize="md">
          Good {tod}, {user.firstName}
        </Text>
        <HStack>
          <Icon
            boxSize={3}
            as={
              tod === 'morning'
                ? BsSunriseFill
                : tod === 'afternoon'
                ? BsSunFill
                : tod === 'evening'
                ? BsSunsetFill
                : BsMoonStarsFill
            }
            color={
              tod === 'morning'
                ? 'blue.300'
                : tod === 'afternoon'
                ? 'yellow.400'
                : tod === 'evening'
                ? 'orange.500'
                : 'purple.600'
            }
          ></Icon>
          <Text fontSize="xs" variant="secondary">
            {readable}
          </Text>
        </HStack>
      </VStack>
    </Flex>
  );
};

Home.getLayout = (page) => (
  <Dashboard headerCenter={HeaderCenter()}>{page}</Dashboard>
);

export const getServerSideProps = ({ req }: { req: NextApiRequest }) => {
  return authServerSideProps(req);
};

export default Home;
