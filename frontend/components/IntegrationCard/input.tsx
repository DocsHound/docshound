import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { Dispatch, SetStateAction, useState } from 'react';
import { Credentials } from 'shared/libs/types';

const CredentialsInput = ({
  name,
  value,
  setCredentials,
}: {
  name: string;
  value: string | null;
  setCredentials: Dispatch<SetStateAction<Credentials | null>>;
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
              return {
                ...prev,
                [name]: e.target.value,
              };
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
