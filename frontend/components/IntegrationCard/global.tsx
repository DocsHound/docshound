import { gql, useMutation, useQuery } from '@apollo/client';
import useToast from 'hooks/useToast';
import { useEffect, useState } from 'react';
import { Credentials, Integration } from './common';
import IntegrationCard from './base';
import {
  Button,
  Center,
  chakra,
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
} from '@chakra-ui/react';
import CredentialsInput from './input';
import { BsFillCheckCircleFill, BsFillPenFill } from 'react-icons/bs';
import { queryGlobalApi } from 'shared/libs/gql_queries';

const GlobalIntegrationCard = ({
  integration,
}: {
  integration: Integration;
}) => {
  const { provider, name } = integration;
  const toast = useToast();
  const { data, loading } = useQuery(queryGlobalApi, {
    variables: { provider },
  });
  const [upsertCredentials] = useMutation(gql`
    mutation upsertGlobalApiCredential(
      $provider: Provider!
      $credentialsJSON: JSONObject!
    ) {
      upsertGlobalApiCredential(
        provider: $provider
        credentialsJSON: $credentialsJSON
      ) {
        id
      }
    }
  `);
  const [exists, setExists] = useState<boolean | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  useEffect(() => {
    if (data?.globalApiCredential) {
      setExists(data.globalApiCredential.exists);
      setCredentials(data.globalApiCredential.credentialsJSON);
    }
  }, [provider, data]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const buttonLabel = exists ? 'Configure' : 'Enable';

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

          <chakra.form
            onSubmit={(e) => {
              e.preventDefault();
              upsertCredentials({
                variables: {
                  provider,
                  credentialsJSON: credentials,
                },
              })
                .then((res) => {
                  console.debug(
                    `upserted GlobalApiCredential ${res.data.upsertGlobalApiCredential.id}`
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
                  {Object.entries(credentials).map(([key, value]) => {
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
              <Button colorScheme="brand" mr={3} type="submit">
                Save
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </chakra.form>
        </ModalContent>
      </Modal>
    </>
  );
};

export default GlobalIntegrationCard;
