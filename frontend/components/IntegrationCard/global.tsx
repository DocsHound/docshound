import useToast from 'hooks/useToast';
import { useEffect, useState } from 'react';
import IntegrationCard from './base';
import {
  Button,
  Center,
  chakra,
  Flex,
  Heading,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  useDisclosure,
  VStack,
  Text,
  Tag,
  TagLeftIcon,
  TagLabel,
  Tooltip,
} from '@chakra-ui/react';
import CredentialsInput from './input';
import {
  BsFillCheckCircleFill,
  BsFillPenFill,
  BsFillExclamationTriangleFill,
} from 'react-icons/bs';
import {
  AppRole,
  GlobalCredentialOutputKv,
  namedOperations,
  Provider,
  useGlobalApiCredentialQuery,
  User,
  useUpsertGlobalApiCredentialMutation,
} from 'generated/graphql_types';
import { Integration } from 'shared/libs/types';
import { useOAuthURL } from 'shared/libs/integrations';

const GlobalIntegrationCard = ({
  provider,
  integration,
  appUser,
}: {
  provider: Provider;
  integration: Integration;
  appUser: User;
}) => {
  const { name, connectType } = integration;
  const toast = useToast();
  const { data, loading } = useGlobalApiCredentialQuery({
    variables: { provider },
  });
  const [upsertCredentials] = useUpsertGlobalApiCredentialMutation({
    refetchQueries: [namedOperations.Query.globalApiCredential],
  });
  const [exists, setExists] = useState<boolean | null>(null);
  const [validSharedUserCreds, setValidSharedUserCreds] = useState<
    boolean | null
  >(null);
  const [credentials, setCredentials] =
    useState<Array<GlobalCredentialOutputKv> | null>(null);

  // For shared user OAuth.
  const requiresSharedUser = connectType === 'shared';
  const { url, loading: urlLoading } = useOAuthURL(provider);

  useEffect(() => {
    if (data?.globalApiCredential) {
      setExists(data.globalApiCredential.exists);
      setValidSharedUserCreds(data.globalApiCredential.validSharedUserCreds);
      setCredentials(
        data.globalApiCredential.data.map((d) => ({
          key: d.key,
          value: d.value ?? null,
        }))
      );
    }
  }, [provider, data]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const buttonLabel = exists ? 'Configure' : 'Enable';

  const [disableMode, setDisableMode] = useState(false);

  // Render nothing for user.
  if (appUser.role === AppRole.User) {
    return (
      <Center my="5">
        <Spinner size="md" colorScheme="brand"></Spinner>
      </Center>
    );
  }

  return (
    <>
      <IntegrationCard integration={integration}>
        <Button
          m="4"
          aria-label={`${buttonLabel} ${name}`}
          leftIcon={
            <Icon as={exists ? BsFillPenFill : BsFillCheckCircleFill} />
          }
          colorScheme="brand"
          onClick={onOpen}
          isLoading={loading}
          variant={exists ? 'ghost' : undefined}
        >
          {buttonLabel}
        </Button>
        {exists && requiresSharedUser && !validSharedUserCreds && (
          <Tag size="md" variant="subtle" colorScheme="orange">
            <TagLeftIcon boxSize="12px" as={BsFillExclamationTriangleFill} />
            <Tooltip
              placement="bottom"
              label="Pending OAuth access with Admin account."
              fontSize="xs"
            >
              <TagLabel>Action Required</TagLabel>
            </Tooltip>
          </Tag>
        )}
      </IntegrationCard>
      <Modal onClose={onClose} size="xl" isOpen={isOpen}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{name} Integration</ModalHeader>
          <ModalCloseButton />

          {disableMode ? (
            <VStack textAlign="center" m="4">
              <Heading as="h3" size="lg">
                Are you sure you want to remove {name} from your workspace?
              </Heading>
              <Text colorScheme="red">This action cannot be undone.</Text>
            </VStack>
          ) : (
            <chakra.form
              onSubmit={(e) => {
                e.preventDefault();
                if (!credentials) return;

                upsertCredentials({
                  variables: {
                    provider,
                    data: credentials,
                  },
                })
                  .then((res) => {
                    console.debug(
                      `upserted GlobalApiCredential ${res.data?.upsertGlobalApiCredential.id}`
                    );
                    setExists(true);
                    if (requiresSharedUser && !validSharedUserCreds) {
                      toast({
                        title: `Your ${name} API credentials were updated. OAuth access pending.`,
                        description: `Please connect via OAuth with an admin ${name} account to fully enable this app.`,
                        status: 'warning',
                      });
                    } else {
                      toast({
                        title: `Your ${name} API credentials were updated.`,
                        status: 'success',
                      });
                      onClose();
                    }
                  })
                  .catch((err) => {
                    toast({
                      title: `Your ${name} API credentials could not be updated.`,
                      description: err.message,
                      status: 'error',
                    });
                  });
              }}
            >
              <ModalBody width="100%">
                {credentials === null ? (
                  <Center>
                    <Spinner size="xl" colorScheme="brand" />
                  </Center>
                ) : (
                  <VStack spacing={8} w="100%">
                    {/* Only show API credential fields for super admin */}
                    {appUser.role === AppRole.Superadmin && (
                      <VStack spacing={4} w="100%">
                        {[...credentials]
                          .sort((a, b) => a.key.localeCompare(b.key))
                          .map(({ key, value }) => {
                            return (
                              <CredentialsInput
                                key={key}
                                name={key}
                                value={value}
                                setCredentials={setCredentials}
                              />
                            );
                          })}
                      </VStack>
                    )}
                    {/* Show OAuth connect button for super or regular admin */}
                    {exists && requiresSharedUser && (
                      <VStack spacing={4}>
                        <Text fontWeight="bold">
                          OAuth status:{' '}
                          <Text
                            as="span"
                            colorScheme={validSharedUserCreds ? 'green' : 'red'}
                          >
                            {validSharedUserCreds
                              ? 'Connected'
                              : 'Not Connected'}
                          </Text>
                        </Text>
                        <Button
                          colorScheme="brand"
                          isLoading={urlLoading}
                          onClick={() => {
                            if (!url) return;
                            window.open(url, '_self');
                          }}
                        >
                          Connect
                        </Button>
                      </VStack>
                    )}
                  </VStack>
                )}
              </ModalBody>
              <ModalFooter>
                <Flex
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center"
                  w="100%"
                >
                  <Button
                    variant="ghost"
                    onClick={() => setDisableMode(true)}
                    colorScheme="red"
                  >
                    Disable App
                  </Button>
                  <HStack>
                    <Button colorScheme="brand" mr={3} type="submit">
                      Save
                    </Button>
                    <Button variant="ghost" onClick={onClose}>
                      Close
                    </Button>
                  </HStack>
                </Flex>
              </ModalFooter>
            </chakra.form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default GlobalIntegrationCard;
