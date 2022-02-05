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
} from '@chakra-ui/react';
import CredentialsInput from './input';
import { BsFillCheckCircleFill, BsFillPenFill } from 'react-icons/bs';
import {
  GlobalCredentialOutputKv,
  namedOperations,
  Provider,
  useGlobalApiCredentialQuery,
  useUpsertGlobalApiCredentialMutation,
} from 'generated/graphql_types';
import { Integration } from 'shared/libs/types';

const GlobalIntegrationCard = ({
  provider,
  integration,
}: {
  provider: Provider;
  integration: Integration;
}) => {
  const { name } = integration;
  const toast = useToast();
  const { data, loading } = useGlobalApiCredentialQuery({
    variables: { provider },
  });
  const [upsertCredentials] = useUpsertGlobalApiCredentialMutation({
    refetchQueries: [namedOperations.Query.globalApiCredential],
  });
  const [exists, setExists] = useState<boolean | null>(null);
  const [credentials, setCredentials] =
    useState<Array<GlobalCredentialOutputKv> | null>(null);

  useEffect(() => {
    if (data?.globalApiCredential) {
      setExists(data.globalApiCredential.exists);
      setCredentials(
        data.globalApiCredential.data as Array<GlobalCredentialOutputKv>
      );
    }
  }, [provider, data]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const buttonLabel = exists ? 'Configure' : 'Enable';

  const [disableMode, setDisableMode] = useState(false);

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
                    toast({
                      title: `Your ${name} API credentials were updated.`,
                      status: 'success',
                    });
                    setExists(true);
                    onClose();
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
                    <Spinner size="xl" color="brand.500" />
                  </Center>
                ) : (
                  <VStack spacing={4}>
                    {credentials
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
