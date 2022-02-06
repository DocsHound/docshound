// This is adapted from the colorScheme implementation for variantGhost for Button.
// See: https://github.com/chakra-ui/chakra-ui/blob/eb8bff911e6ec9de0165ab1e8f5ca10d5e022459/packages/theme/src/components/button.ts.
import { mode } from '@chakra-ui/theme-tools';
type Dict = Record<string, any>;

function variantSolid(props: Dict) {
  const { colorScheme: c } = props;

  if (c === 'gray') {
    return {
      color: mode(`inherit`, `whiteAlpha.900`)(props),
    };
  }

  return {
    color: mode(`${c}.600`, `${c}.200`)(props),
  };
}

const variants = {
  solid: variantSolid,
};

const defaultProps = {
  variant: 'solid',
};

export default {
  variants,
  defaultProps,
};
