import Head from 'next/head';
import countBy from 'lodash/countBy';
import groupBy from 'lodash/groupBy';
import pluralize from 'pluralize';
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
  Heading,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
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
import { useRouter } from 'next/router';
import {
  DocType,
  Maybe,
  Provider,
  ProviderResource,
  SearchResult,
  SearchResultText,
  useSearchLazyQuery,
} from 'generated/graphql_types';
import { getIntegration } from 'constants/integrations';

const results: Array<SearchResult> = [
  {
    __typename: 'Document',
    provider: Provider.Confluence,
    docType: DocType.WebPage,
    title: 'RFC: Centering a div',
    desc: {
      text: 'This is an rfc for centering divs ... Centering a div is rather difficult because of the complexities of CSS ... Every div matters',
      matches: [
        { s: 19, e: 33 },
        { s: 38, e: 53 },
        { s: 119, e: 122 },
      ],
    },
    url: 'https://docs.google.com/',
    lastUpdated: new Date().getTime() - 1000 * 60 * 32,
    created: new Date().getTime() - 1000 * 60 * 32,
    authors: [{ resourceID: '123', resourceName: 'Richard Wu' }],
  },
  {
    __typename: 'Document',
    provider: Provider.Confluence,
    docType: DocType.WebPage,
    title: 'Tutorial on Centering Divs',
    desc: {
      text: 'Centering divs are quite difficult: that is why we wrote this 20-minute tutorial on how to center a div.',
      matches: [
        { s: 0, e: 14 },
        { s: 91, e: 103 },
      ],
    },
    url: 'https://confluence.atlassian.com/',
    lastUpdated: new Date().getTime() - 1000 * 60 * 60 * 24 * 9,
    created: new Date().getTime() - 1000 * 60 * 32,
    authors: [{ resourceID: '123', resourceName: 'Richard Wu' }],
  },
];

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

const ResultLogo = ({
  provider,
  docType,
}: {
  provider: Provider;
  docType: Maybe<DocType> | undefined;
}) => {
  const docTypeSrc = getIntegration(provider, docType)['logoURI'];
  const providerSrc = getIntegration(provider)['logoURI'];
  const alt = getIntegration(provider, docType)['name'];
  if (docTypeSrc !== providerSrc) {
    return <DualLogo outerSrc={docTypeSrc} innerSrc={providerSrc} alt={alt} />;
  }
  return <SingleLogo src={providerSrc} alt={alt} />;
};

const FilterLogo = ({
  provider,
  docType,
}: {
  provider: Provider;
  docType: Maybe<DocType> | undefined;
}) => {
  return (
    <Image
      src={getIntegration(provider, docType)['logoURI']}
      alt={getIntegration(provider, docType)['name']}
      w="4"
      h="4"
    />
  );
};

const ResultText = ({ desc }: { desc: SearchResultText }) => {
  let prev = 0;
  let textElems: Array<ReactElement> = [];
  for (const { s, e } of desc.matches) {
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

const authorsText = (authors: Array<ProviderResource>) => {
  const names = authors
    .filter((a) => a.resourceName !== null)
    .map((a) => a.resourceName);
  if (!names) return null;
  if (names.length >= 3) {
    return `${names[0]} and ${names.length - 1} others`;
  }
  return names.join(', ');
};

const ResultItem = ({ result }: { result: SearchResult }) => {
  const linkColor = useColorModeValue('brand.500', 'brand.200');

  switch (result.__typename) {
    case 'Document':
      return (
        <HStack align="start" width="100%">
          <ResultLogo provider={result.provider} docType={result.docType} />
          <VStack align="start" flex="1">
            {!!result.title &&
              (!!result.url ? (
                <NextLink href={result.url} passHref>
                  <Link
                    fontSize="lg"
                    color={linkColor}
                    fontWeight="semibold"
                    isExternal
                  >
                    {result.title}
                  </Link>
                </NextLink>
              ) : (
                <Heading as="h3" fontWeight="semibold">
                  {result.title}
                </Heading>
              ))}
            <HStack fontSize="xs">
              {!!result.lastUpdated ? (
                <Text variant="secondary">
                  Updated{' '}
                  {humanReadableDuration(
                    new Date(result.lastUpdated),
                    new Date()
                  )}{' '}
                  ago
                </Text>
              ) : !!result.created ? (
                <Text variant="secondary">
                  Updated{' '}
                  {humanReadableDuration(new Date(result.created), new Date())}{' '}
                  ago
                </Text>
              ) : null}
              {/* TODO: lookup avatar */}
              {/* <Avatar src={author.avatar} size="xs"></Avatar> */}
              {!!result.authors && (
                <Text variant="secondary">{authorsText(result.authors)}</Text>
              )}
            </HStack>
            {!!result.desc && <ResultText desc={result.desc} />}
          </VStack>
        </HStack>
      );

    case 'Message':
      // TODO
      return null;
    default:
      return null;
  }
};

const Home: NextPageWithLayout = () => {
  const router = useRouter();
  const [query, setQuery] = useState((router.query.q as string) ?? '');
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    searchRef.current?.focus();
  }, []);
  const [searchResults, setSearchResults] =
    useState<Array<SearchResult> | null>(null);
  const [search, { data }] = useSearchLazyQuery();

  useEffect(() => {
    if (!router.query.q) return;

    search({ variables: { query: router.query.q as string } }).then((res) => {
      if (!!res.data?.search) setSearchResults([...res.data.search]);
    });
  }, [search, router.query.q]);

  const performSearch = () => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, q: query },
    });
  };

  useEffect(() => {
    console.log('search res', searchResults);
  }, [searchResults]);

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
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              await performSearch();
            }
          }}
          placeholder="Search across your apps, documents, and more."
          size="sm"
        ></Input>
        <Flex direction="row" align="flex-start" justify="space-between" my="5">
          <VStack maxW="800" align="start" spacing="5">
            {results.map((result, idx) => (
              <ResultItem key={idx} result={result} />
            ))}
          </VStack>
          <VStack align="flex-start">
            <Text variant="secondary" fontSize="xs">
              Found {pluralize('result', results.length, true)}
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
            {Object.entries(groupBy(results, 'provider'))
              .map(([provider, pResults]) =>
                Object.entries(countBy(pResults, 'docType')).map(
                  ([docType, count]) => ({
                    provider: provider as Provider,
                    docType: docType as DocType | undefined,
                    count,
                  })
                )
              )
              .flat()
              .map(({ provider, docType, count }) => (
                <Button
                  key={`${provider},${docType}`}
                  leftIcon={
                    <FilterLogo provider={provider} docType={docType} />
                  }
                  variant="ghost"
                  colorScheme="brand"
                  w="100%"
                  justifyContent="flex-start"
                  px="5"
                >
                  <HStack spacing="4" justify="space-between">
                    <Text style={{ textOverflow: 'ellipsis' }}>
                      {getIntegration(provider, docType)['name']}
                    </Text>
                    <Text style={{ fontVariant: 'tabular-nums' }}>{count}</Text>
                  </HStack>
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
