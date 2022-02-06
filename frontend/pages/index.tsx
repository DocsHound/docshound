import Head from 'next/head';
import countBy from 'lodash/countBy';
import groupBy from 'lodash/groupBy';
import ReactMarkdown from 'react-markdown';
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
  Button,
  Heading,
  Spinner,
  Center,
  UnorderedList,
  ListItem,
  Code,
  LinkOverlay,
  LinkBox,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { NextPageWithLayout } from 'pages/types';
import Dashboard from 'layouts/Dashboard';
import { user, workspace } from 'mocks/data';
import {
  conditionalDatetime,
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
  ProviderDocType,
  ProviderResource,
  SearchResult,
  SearchResultText,
  TextType,
  useSearchLazyQuery,
} from 'generated/graphql_types';
import { getIntegration } from 'constants/integrations';
import useToast from 'hooks/useToast';

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

const DocLogo = ({
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

const MessageLogo = ({
  provider,
  avatar,
  username,
  userURL,
}: {
  provider: Provider;
  avatar: Maybe<string> | undefined;
  username: Maybe<string> | undefined;
  userURL: Maybe<string> | undefined;
}) => {
  const providerSrc = getIntegration(provider)['logoURI'];
  const alt = username ?? `${getIntegration(provider)['name']} message`;

  const innerLogo = () => {
    if (avatar) {
      return <DualLogo outerSrc={avatar} innerSrc={providerSrc} alt={alt} />;
    }
    return <SingleLogo src={providerSrc} alt={alt} />;
  };

  if (userURL) {
    return (
      <LinkBox>
        <NextLink href={userURL} passHref>
          <LinkOverlay>{innerLogo()}</LinkOverlay>
        </NextLink>
      </LinkBox>
    );
  }

  return innerLogo();
};

const FilterLogo = ({
  provider,
  docType,
}: {
  provider: Provider;
  docType: Maybe<DocType>;
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
  switch (desc.type) {
    case TextType.Markdown:
      return (
        <ReactMarkdown
          components={{
            code: Code,
          }}
          className="react-markdown"
        >
          {desc.text}
        </ReactMarkdown>
      );
    case TextType.Raw:
      return <Text>{desc.text}</Text>;
    default:
      return null;
  }
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
  switch (result.__typename) {
    case 'Document':
      return (
        <HStack align="start" width="100%">
          <DocLogo provider={result.provider} docType={result.docType} />
          <VStack align="start" flex="1">
            {!!result.title &&
              (!!result.url ? (
                <NextLink href={result.url} passHref>
                  <Link
                    fontSize="lg"
                    colorScheme="brand"
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
                <Text colorScheme="gray">
                  Updated{' '}
                  {humanReadableDuration(
                    new Date(result.lastUpdated),
                    new Date()
                  )}{' '}
                  ago
                </Text>
              ) : !!result.created ? (
                <Text colorScheme="gray">
                  Updated{' '}
                  {humanReadableDuration(new Date(result.created), new Date())}{' '}
                  ago
                </Text>
              ) : null}
              {/* TODO: lookup avatar */}
              {/* <Avatar src={author.avatar} size="xs"></Avatar> */}
              {!!result.authors && (
                <Text colorScheme="gray">{authorsText(result.authors)}</Text>
              )}
            </HStack>
            {!!result.desc && <ResultText desc={result.desc} />}
          </VStack>
        </HStack>
      );

    case 'Message':
      return (
        <HStack align="start" width="100%">
          <MessageLogo
            provider={result.provider}
            avatar={result.avatar}
            username={result.author?.resourceName}
            userURL={result.author?.resourceURL}
          />
          <VStack align="start" flex="1">
            <HStack>
              {!!result.url ? (
                <NextLink href={result.url} passHref>
                  <Link
                    fontSize="lg"
                    colorScheme="brand"
                    fontWeight="semibold"
                    isExternal
                  >
                    {result.author?.resourceName ?? 'Slack User'}
                  </Link>
                </NextLink>
              ) : (
                <Heading as="h3" fontWeight="semibold">
                  {result.author?.resourceName ?? 'Slack User'}
                </Heading>
              )}
              {!!result.created ? (
                <Text colorScheme="gray">
                  {/* TODO(richardwu): pass through meridian */}
                  {conditionalDatetime(new Date(result.created), true)}
                </Text>
              ) : null}
              {!!result.group &&
                (!!result.group.resourceURL ? (
                  <NextLink href={result.group?.resourceURL} passHref>
                    <Link isExternal fontWeight="semibold">
                      #{result.group.resourceName ?? 'Slack Channel'}
                    </Link>
                  </NextLink>
                ) : (
                  <Text fontWeight="semibold">
                    #{result.group.resourceName ?? 'Slack Channel'}
                  </Text>
                ))}
            </HStack>
            {!!result.message && <ResultText desc={result.message} />}
          </VStack>
        </HStack>
      );
    default:
      return null;
  }
};

const Home: NextPageWithLayout = () => {
  const router = useRouter();
  const toast = useToast();

  const [initialQuery] = useState((router.query.q ?? '') as string);
  // Most recently executed query.
  const [query, setQuery] = useState(initialQuery);
  // Current value in input.
  const [inputValue, setInputValue] = useState(initialQuery);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    searchRef.current?.focus();
  }, []);
  const [search, { data, loading, error }] = useSearchLazyQuery();
  const searchResults: Array<SearchResult> = data?.search
    ? (data.search as Array<SearchResult>)
    : [];
  const [handledError, setHandledError] = useState(false);
  const [filterProviders, setFilterProviders] = useState<
    Record<string, ProviderDocType>
  >({});

  // Perform query on page load.
  useEffect(() => {
    if (initialQuery === '') return;
    search({ variables: { query: initialQuery, providerDocTypes: null } });
  }, [search, initialQuery]);

  // Update query params in URL if a query is executed.
  useEffect(() => {
    if (query === '') return;
    if (query === router.query.q) return;
    router.push({
      pathname: router.pathname,
      query: { ...router.query, q: query },
    });
  }, [router, query]);

  // Perform a search on the input value.
  const performSearch = (filterProviders: Record<string, ProviderDocType>) => {
    const temp = inputValue.trim();
    if (temp === '') return;
    search({
      variables: {
        query: temp,
        providerDocTypes:
          Object.keys(filterProviders).length === 0
            ? null
            : Object.values(filterProviders),
      },
    }).finally(() => {
      setHandledError(false);
    });
    setQuery(temp);
  };

  useEffect(() => {
    if (handledError) return;
    if (!error) return;
    setHandledError(true);
    toast({
      title: `Could not search for '${query}'.`,
      description: 'The search service is unavailable. Please try again.',
      status: 'error',
    });
  }, [handledError, error, toast, query]);

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
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              await performSearch(filterProviders);
            }
          }}
          placeholder="Search for e.g., 'quarterly goals' or 'onboarding'"
          size="sm"
        ></Input>
        <Box my="8">
          {loading ? (
            <Center>
              <Spinner size="xl" colorScheme="brand" />
            </Center>
          ) : query === '' ? (
            <Center>
              <Heading size="md" as="h3">
                Search across your connected apps for documents, files, and
                messages.
              </Heading>
            </Center>
          ) : searchResults.length === 0 ? (
            <VStack alignItems="flex-start" mx="4">
              <Text>
                Your search{' '}
                <span style={{ fontWeight: 'bold' }}>- {query} -</span> did not
                match any documents or messages.
              </Text>
              <Text>Suggestions:</Text>
              <Box px="4">
                <UnorderedList>
                  <ListItem>
                    Make sure that all words are spelled correctly.
                  </ListItem>
                  <ListItem>Try different keywords.</ListItem>
                  <ListItem>Try more general keywords.</ListItem>
                  <ListItem>Try fewer keywords.</ListItem>
                </UnorderedList>
              </Box>
            </VStack>
          ) : (
            <Flex direction="row" align="flex-start" justify="space-between">
              <VStack maxW="800" align="start" spacing="5">
                {searchResults.map((result, idx) => (
                  <ResultItem key={idx} result={result} />
                ))}
              </VStack>
              <VStack align="flex-start">
                <Text colorScheme="gray" fontSize="xs">
                  Found {pluralize('result', searchResults.length, true)}
                </Text>
                <Button
                  leftIcon={<Search2Icon />}
                  variant={
                    Object.keys(filterProviders).length === 0
                      ? 'solid'
                      : 'ghost'
                  }
                  colorScheme="brand"
                  w="100%"
                  justifyContent="flex-start"
                  px="5"
                  onClick={() => {
                    if (Object.keys(filterProviders).length !== 0) {
                      performSearch({});
                    }
                    setFilterProviders({});
                  }}
                >
                  All
                </Button>
                {Object.entries(groupBy(searchResults, 'provider'))
                  .map(([provider, pResults]) =>
                    Object.entries(countBy(pResults, 'docType')).map(
                      ([docType, count]) => {
                        return {
                          provider: provider as Provider,
                          docType:
                            docType === 'undefined'
                              ? null
                              : (docType as DocType),
                          count,
                        };
                      }
                    )
                  )
                  .flat()
                  .map(({ provider, docType, count }) => {
                    const key = `${provider},${docType}`;
                    const selected = key in filterProviders;

                    return (
                      <Button
                        key={key}
                        leftIcon={
                          <FilterLogo provider={provider} docType={docType} />
                        }
                        variant={selected ? 'solid' : 'ghost'}
                        colorScheme="brand"
                        w="100%"
                        justifyContent="flex-start"
                        px="5"
                        onClick={() => {
                          let newProviders = { ...filterProviders };
                          if (selected) {
                            if (key in newProviders) delete newProviders[key];
                          } else {
                            newProviders = {
                              ...newProviders,
                              [key]: { provider, docType },
                            };
                          }
                          setFilterProviders(newProviders);
                          // Always need to re-query.
                          performSearch(newProviders);
                        }}
                      >
                        <HStack spacing="4" justify="space-between">
                          <Text style={{ textOverflow: 'ellipsis' }}>
                            {getIntegration(provider, docType)['name']}
                          </Text>
                          <Text style={{ fontVariant: 'tabular-nums' }}>
                            {count}
                          </Text>
                        </HStack>
                      </Button>
                    );
                  })}
              </VStack>
            </Flex>
          )}
        </Box>
      </Container>
    </Box>
  );
};

const HeaderCenter = () => {
  const date = new Date();
  const tod = timeOfDay(date);
  // TODO(richardwu): meridian toggle
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
          <Text fontSize="xs" colorScheme="gray">
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
