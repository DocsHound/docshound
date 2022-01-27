import { Box, IconButton, Flex, Tooltip } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { BsChevronBarLeft, BsChevronBarRight, BsList } from 'react-icons/bs';

interface Props {
  onShowSidebar: () => void;
  onCollapseSidebar: () => void;
  sidebarCollapsed: boolean;
  showDrawerButton: boolean;
  headerLeft?: ReactElement;
  headerCenter?: ReactElement;
  headerRight?: ReactElement;
}

const Header = ({
  showDrawerButton,
  sidebarCollapsed,
  onShowSidebar,
  onCollapseSidebar,
  headerLeft,
  headerCenter,
  headerRight,
}: Props) => {
  //   const headerBorder = useColorModeValue('gray.200', 'gray.600');

  return (
    <Flex
      id="test-123"
      p="4"
      flexDirection="row"
      justifyContent="space-between"
      //   borderColor={headerBorder}
      borderBottomWidth="1px"
    >
      <Box>
        <Box>
          {showDrawerButton ? (
            <IconButton
              variant="ghost"
              aria-label="Open sidebar"
              size="xs"
              icon={<BsList />}
              onClick={onShowSidebar}
            />
          ) : (
            <Tooltip
              placement="right"
              label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
              fontSize="xs"
            >
              <IconButton
                variant="ghost"
                aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
                size="xs"
                icon={
                  sidebarCollapsed ? (
                    <BsChevronBarRight />
                  ) : (
                    <BsChevronBarLeft />
                  )
                }
                onClick={onCollapseSidebar}
              />
            </Tooltip>
          )}
        </Box>
        {headerLeft}
      </Box>
      <Box flex="1" mx="4">
        {headerCenter}
      </Box>
      <Box>{headerRight}</Box>
    </Flex>
  );
};

export default Header;
