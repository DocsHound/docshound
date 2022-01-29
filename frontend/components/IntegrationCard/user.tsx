import { useContext, useEffect, useState } from 'react';
import IntegrationCard from './base';
import { Button, Icon } from '@chakra-ui/react';
import { FaLink, FaUnlink } from 'react-icons/fa';
import { makeOAuthURL } from 'shared/libs/integrations/slack';
import { AppUserContext } from 'contexts/AppUser';
import { Provider, useUserApiCredentialQuery } from 'generated/graphql_types';
import { Credentials, Integration } from 'shared/libs/types';

const onClick = (provider: Provider, userId: string) => {
  switch (provider) {
    case Provider.Slack:
      window.open(makeOAuthURL(userId), '_self');
      break;
  }
};

const UserIntegrationCard = ({
  provider,
  integration,
}: {
  provider: Provider;
  integration: Integration;
}) => {
  const { name } = integration;
  const user = useContext(AppUserContext);
  const { data, loading } = useUserApiCredentialQuery({
    variables: { provider },
  });
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
          if (!user) return;
          onClick(provider, user.id);
        }}
        isLoading={loading || !user}
        variant={connected ? 'ghost' : undefined}
      >
        {buttonLabel}
      </Button>
    </IntegrationCard>
  );
};

export default UserIntegrationCard;
