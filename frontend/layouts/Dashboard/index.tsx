import { Box, useBreakpointValue, useDisclosure } from '@chakra-ui/react';
import { ReactElement, useEffect, useState } from 'react';
import Header from 'widgets/Header';
import MainSidebar from 'widgets/MainSidebar';

interface Props {
  children: ReactElement;
  headerLeft?: ReactElement;
  headerCenter?: ReactElement;
  headerRight?: ReactElement;
}

const Dashboard = ({
  children,
  headerLeft,
  headerCenter,
  headerRight,
}: Props) => {
  const { isOpen: isSidebarOpen, onToggle: toggleOpenSidebar } =
    useDisclosure();
  const {
    isOpen: isSidebarCollapsed,
    onToggle: toggleCollapseSidebar,
    onOpen: collapseSidebar,
  } = useDisclosure({
    defaultIsOpen: true,
  });
  const variant = useBreakpointValue({
    base: 'drawer' as const,
    lg: 'sidebar' as const,
  });
  const sidebarWidth = isSidebarCollapsed ? '5rem' : '13rem';

  // For some reason we need to update this for when DOM loads.
  const [marginStart, setMarginStart] = useState<string | number>(sidebarWidth);
  useEffect(() => {
    if (variant === 'drawer') {
      setMarginStart(0);
      return;
    }
    setMarginStart(sidebarWidth);
  }, [variant, sidebarWidth]);

  return (
    <Box>
      <MainSidebar
        variant={variant}
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={toggleOpenSidebar}
        onCollapse={collapseSidebar}
        width={sidebarWidth}
      />
      <Box ms={marginStart}>
        <Header
          showDrawerButton={variant === 'drawer'}
          sidebarCollapsed={isSidebarCollapsed}
          onShowSidebar={toggleOpenSidebar}
          onCollapseSidebar={toggleCollapseSidebar}
          headerLeft={headerLeft}
          headerCenter={headerCenter}
          headerRight={headerRight}
        />
        <Box p="4">{children}</Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
