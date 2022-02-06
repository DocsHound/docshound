import { useContext, useEffect, useState } from 'react';
import IntegrationCard from './base';
import { Button, Icon } from '@chakra-ui/react';
import { FaLink, FaUnlink } from 'react-icons/fa';
import { useOAuthURL } from 'shared/libs/integrations';
import { AppUserContext } from 'contexts';
import {
  Provider,
  Scalars,
  useUserApiCredentialQuery,
} from 'generated/graphql_types';
import { Integration } from 'shared/libs/types';
import useToast from 'hooks/useToast';
import { BsFillQuestionCircleFill } from 'react-icons/bs';

const UserIntegrationCard = ({
  provider,
  integration,
}: {
  provider: Provider;
  integration: Integration;
}) => {
  const { name } = integration;
  const toast = useToast();
  const user = useContext(AppUserContext);
  const { data, loading } = useUserApiCredentialQuery({
    variables: { provider },
  });
  const [credentials, setCredentials] = useState<Scalars['JSONObject'] | null>(
    null
  );
  const connected = credentials !== null;
  useEffect(() => {
    if (data?.userApiCredential) {
      setCredentials(data.userApiCredential.credentialsJSON);
    }
  }, [provider, data]);
  const buttonLabel = connected ? 'Disconnect' : 'Connect';

  const { url, loading: urlLoading } = useOAuthURL(provider);

  return (
    <IntegrationCard integration={integration}>
      {urlLoading || !!url ? (
        <Button
          m="4"
          aria-label={` ${name}`}
          leftIcon={<Icon as={connected ? FaUnlink : FaLink} />}
          colorScheme="brand"
          onClick={() => {
            if (!url) return;
            window.open(url, '_self');
          }}
          isLoading={loading || !user || urlLoading}
          variant={connected ? 'ghost' : undefined}
        >
          {buttonLabel}
        </Button>
      ) : (
        <Button
          m="4"
          onClick={() => {
            toast({
              title: `${name} not enabled in this workspace.`,
              description:
                'A workspace admin may enable this integration in Workspace Settings.',
              status: 'error',
            });
          }}
          leftIcon={<Icon as={BsFillQuestionCircleFill} />}
          variant="ghost"
          colorScheme="red"
        >
          Not Enabled
        </Button>
      )}
    </IntegrationCard>
  );
};

export default UserIntegrationCard;
