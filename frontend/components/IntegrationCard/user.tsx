import { gql, useQuery } from '@apollo/client';
import { useEffect, useState } from 'react';
import { Integration } from './common';
import IntegrationCard from './base';
import { Button, Icon } from '@chakra-ui/react';
import { FaLink, FaUnlink } from 'react-icons/fa';
import { makeOAuthURL } from 'shared/libs/integrations/slack';
import { Credentials, Provider } from 'shared/libs/gql_types';

const onClick = (provider: Provider) => {
  switch (provider) {
    case Provider.SLACK:
      window.open(
        makeOAuthURL(),
        '_blank',
        'location=yes,height=570,width=520,scrollbars=yes,status=yes'
      );
      break;
  }
};

const UserIntegrationCard = ({ integration }: { integration: Integration }) => {
  const { provider, name } = integration;
  const { data, loading } = useQuery(
    gql`
      query userApiCredential($provider: Provider!) {
        userApiCredential(provider: $provider) {
          userId
          provider
          credentialsJSON
        }
      }
    `,
    {
      variables: { provider },
    }
  );
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const connected = credentials !== null;
  useEffect(() => {
    if (data?.userApiCredential) {
      setCredentials(data.userApiCredential.credentialsJSON);
    }
  }, [provider, data]);
  const buttonLabel = connected ? 'Disconnect' : 'Connect';

  return (
    <IntegrationCard integration={integration}>
      <Button
        m="4"
        aria-label={` ${name}`}
        leftIcon={<Icon as={connected ? FaUnlink : FaLink} />}
        colorScheme="brand"
        onClick={() => {
          onClick(integration.provider);
        }}
        isLoading={loading}
        variant={connected ? 'ghost' : undefined}
      >
        {buttonLabel}
      </Button>
    </IntegrationCard>
  );
};

export default UserIntegrationCard;
