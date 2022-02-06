import * as React from 'react';
import { Box, Divider, Flex, FlexProps, Text } from '@chakra-ui/react';

const DividerWithText = (props: FlexProps) => {
  const { children, ...flexProps } = props;
  return (
    <Flex align="center" color="gray.300" {...flexProps}>
      <Box flex="1">
        <Divider borderColor="currentcolor" />
      </Box>
      <Text as="span" px="3" colorScheme="gray" fontWeight="medium">
        {children}
      </Text>
      <Box flex="1">
        <Divider borderColor="currentcolor" />
      </Box>
    </Flex>
  );
};

export default DividerWithText;
