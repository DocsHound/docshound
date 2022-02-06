import { Search2Icon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Drawer,
  DrawerOverlay,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  DrawerContent,
  VStack,
  IconButton,
  useColorModeValue,
  Flex,
  Avatar,
  useColorMode,
  Tooltip,
  HStack,
  Badge,
  Text,
  Image,
  MenuButton,
  Menu,
  MenuItem,
  MenuList,
} from '@chakra-ui/react';
import { user } from 'mocks/data';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactElement, ReactNode, useContext } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  BsFillDoorOpenFill,
  BsFillGearFill,
  BsMoonFill,
  BsSunFill,
} from 'react-icons/bs';
import { FaLink } from 'react-icons/fa';
import { isMac } from 'shared/libs/platform';
import useToast from 'hooks/useToast';
import { supabase } from 'shared/libs/supabase';
import { AppUserContext } from 'contexts';
import { AppRole } from 'generated/graphql_types';

interface Props {
  onClose: () => void;
  onCollapse: () => void;
  isOpen: boolean;
  isCollapsed: boolean;
  variant?: 'drawer' | 'sidebar';
  width: string;
}

interface SidebarButtonProps {
  collapsed: boolean;
  text: string;
  icon: ReactElement;
  onClick: () => void;
  tooltipLabel?: ReactNode | string;
  menuButton?: boolean;
}

const SidebarButton = ({
  collapsed,
  text,
  icon,
  onClick,
  tooltipLabel,
  menuButton,
}: SidebarButtonProps) => {
  return (
    <Tooltip label={tooltipLabel ?? text} placement="right" fontSize="xs">
      {collapsed ? (
        menuButton ? (
          <MenuButton
            as={IconButton}
            variant="ghost"
            aria-label={text}
            icon={icon}
            size="md"
          />
        ) : (
          <IconButton
            variant="ghost"
            aria-label={text}
            icon={icon}
            onClick={onClick}
            size="md"
          ></IconButton>
        )
      ) : menuButton ? (
        <MenuButton
          as={Button}
          leftIcon={icon}
          w="100%"
          variant="ghost"
          size="md"
        />
      ) : (
        <Button
          leftIcon={icon}
          onClick={onClick}
          w="100%"
          variant="ghost"
          size="md"
        >
          {text}
        </Button>
      )}
    </Tooltip>
  );
};

const SidebarContent = ({
  collapsed,
  onCollapse,
}: {
  collapsed: boolean;
  onCollapse: () => void;
}) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const router = useRouter();
  const openSearch = () => {
    router.push('/');
  };
  const toast = useToast();
  const appUser = useContext(AppUserContext);

  useHotkeys('cmd+k, ctrl+k', (e) => {
    e.preventDefault();
    openSearch();
  });

  return (
    <Flex direction="column" justify="space-between" h="100%">
      {/* Top buttons */}
      <VStack>
        {/* Logo */}
        <Link href="/" passHref>
          <a>
            {collapsed ? (
              <Image src="/docshound-square.svg" alt="Docshound" maxW="48px" />
            ) : (
              <HStack>
                <Image
                  src="/docshound-square.svg"
                  alt="Docshound"
                  maxW="48px"
                />
                <Text fontWeight="bold">
                  {user.firstName} {user.lastName}
                </Text>
              </HStack>
            )}
          </a>
        </Link>
        {/* Search */}
        <SidebarButton
          collapsed={collapsed}
          tooltipLabel={
            <HStack>
              <Text>Search</Text>
              <Badge bg={colorMode === 'dark' ? 'gray.800' : 'gray.200'}>
                {isMac() ? '⌘ K' : 'Ctrl K'}
              </Badge>
            </HStack>
          }
          icon={<Search2Icon />}
          text="Search"
          onClick={() => {
            openSearch();
            onCollapse();
          }}
        />
      </VStack>

      {/* Bottom buttons */}
      <VStack>
        {/* Integrations */}
        <SidebarButton
          collapsed={collapsed}
          text="Integrations"
          icon={<FaLink />}
          onClick={() => {
            router.push('/integrations');
            onCollapse();
          }}
        />
        {/* Light/dark mode */}
        <SidebarButton
          collapsed={collapsed}
          text={colorMode === 'dark' ? 'Light mode' : 'Dark mode'}
          icon={colorMode === 'dark' ? <BsSunFill /> : <BsMoonFill />}
          onClick={() => {
            toggleColorMode();
            onCollapse();
          }}
        />

        {/* Admin mode: show workspace settings */}
        {!!appUser?.role &&
          [AppRole.Superadmin, AppRole.Admin].includes(appUser.role) && (
            <SidebarButton
              collapsed={collapsed}
              text={'Workspace Settings'}
              icon={<BsFillGearFill />}
              onClick={() => {
                router.push('/settings');
                onCollapse();
              }}
            />
          )}

        {/* User popover menu */}
        <Menu>
          <SidebarButton
            collapsed={collapsed}
            text="Account"
            icon={
              <Avatar
                size="sm"
                name={`${user.firstName} ${user.lastName}`}
                src={user.avatar}
              />
            }
            menuButton={true}
            onClick={() => {}}
          />

          <MenuList>
            <MenuItem
              icon={<BsFillDoorOpenFill />}
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                  toast({
                    title: 'Could not sign out.',
                    description:
                      (error as any).error_description ?? error.message,
                    status: 'error',
                  });
                }
              }}
            >
              Sign out
            </MenuItem>
          </MenuList>
        </Menu>
      </VStack>
    </Flex>
  );
};

const MainSidebar = ({
  isOpen,
  isCollapsed,
  variant,
  onClose,
  onCollapse,
  width,
}: Props) => {
  const sidebarBg = useColorModeValue('gray.50', 'gray.700');
  const sidebarBorder = useColorModeValue('gray.200', 'gray.600');

  return variant === 'drawer' ? (
    <Drawer isOpen={isOpen} placement="start" onClose={onClose}>
      <DrawerOverlay>
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Chakra-UI</DrawerHeader>
          <DrawerBody></DrawerBody>
        </DrawerContent>
      </DrawerOverlay>
    </Drawer>
  ) : (
    <Box
      position="fixed"
      insetStart={0}
      w={width}
      top={0}
      h="100%"
      bg={sidebarBg}
      borderColor={sidebarBorder}
      borderEndWidth="1px"
      py={2}
    >
      <SidebarContent onCollapse={onCollapse} collapsed={isCollapsed} />
    </Box>
  );
};

export default MainSidebar;
