import {
  AspectRatio,
  Box,
  Center,
  Heading,
  Text,
  Image,
  Flex,
} from '@chakra-ui/react';
import { ReactNode } from 'react';
import { Integration } from 'shared/libs/types';

const IntegrationCard = ({
  integration: { name, desc, logoURI, bgColor },
  children,
}: {
  integration: Integration;
  children: ReactNode | Array<ReactNode>;
}) => {
  return (
    <>
      <Flex
        direction="column"
        justify="center"
        align="center"
        maxW="xs"
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        maxH="md"
        p="4"
      >
        <AspectRatio w="128px" ratio={1} borderRadius="lg" bg={bgColor}>
          <Center>
            <Image src={logoURI} alt={name} width="48px" />
          </Center>
        </AspectRatio>
        <Box p="6" pb="0" textAlign="center">
          <Heading as="h3" fontWeight="semibold" size="md" m="1">
            {name}
          </Heading>
          <Text fontSize="sm" m="1">
            {desc}
          </Text>

          {children}
        </Box>
      </Flex>
    </>
  );
};

export default IntegrationCard;
