import IntegrationCard from './base';
import { Button, Icon } from '@chakra-ui/react';
import { useOAuthURL } from 'shared/libs/integrations';
import { Provider } from 'generated/graphql_types';
import { Integration } from 'shared/libs/types';
import useToast from 'hooks/useToast';
import { BsFillQuestionCircleFill } from 'react-icons/bs';
import { isMac } from 'shared/libs/platform';

const SharedIntegrationCard = ({
  provider,
  integration,
}: {
  provider: Provider;
  integration: Integration;
}) => {
  const { name } = integration;
  const toast = useToast();

  // TODO(richardwu): maybe have a cleaner way to check if an integration is enabled globally.
  // For now this will suffice.
  const { url, loading: urlLoading } = useOAuthURL(provider);
  const enabled = !!url;

  return (
    <IntegrationCard integration={integration}>
      <Button
        m="4"
        onClick={() => {
          if (enabled) {
            toast({
              title: `${name} is active!`,
              description: `Begin searching within this app now in Search (${
                isMac() ? '⌘ K' : 'Ctrl K'
              }).`,
              status: 'success',
            });
            return;
          }

          toast({
            title: `${name} not enabled in this workspace.`,
            description:
              'A workspace admin may enable this integration in Workspace Settings.',
            status: 'error',
          });
        }}
        leftIcon={<Icon as={BsFillQuestionCircleFill} />}
        variant="ghost"
        colorScheme={enabled ? 'green' : 'red'}
        isLoading={urlLoading}
      >
        {enabled ? 'Enabled' : 'Not Enabled'}
      </Button>
    </IntegrationCard>
  );
};

export default SharedIntegrationCard;
