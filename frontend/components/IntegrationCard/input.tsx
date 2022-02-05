import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import {
  GlobalCredentialKey,
  GlobalCredentialOutputKv,
} from 'generated/graphql_types';
import { Dispatch, SetStateAction, useState } from 'react';

const CredentialsInput = ({
  name,
  value,
  setCredentials,
}: {
  name: GlobalCredentialKey;
  value: string | null;
  setCredentials: Dispatch<
    SetStateAction<Array<GlobalCredentialOutputKv> | null>
  >;
}) => {
  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);
  return (
    <FormControl isRequired={true}>
      <FormLabel>{name}</FormLabel>
      <InputGroup size="md">
        <Input
          value={value ?? ''}
          onChange={(e) => {
            setCredentials((prev) => {
              const temp = { key: name, value: e.target.value };
              if (!prev) return [temp];

              return [...prev.filter(({ key }) => key !== name), temp];
            });
          }}
          type={show ? 'text' : 'password'}
        ></Input>

        <InputRightElement width="4.5rem">
          <Button h="1.75rem" size="sm" onClick={handleClick}>
            {show ? 'Hide' : 'Show'}
          </Button>
        </InputRightElement>
      </InputGroup>
    </FormControl>
  );
};

export default CredentialsInput;
