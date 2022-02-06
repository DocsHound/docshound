import { AppRole } from '@prisma/client';
import { registerEnumType } from 'type-graphql';

registerEnumType(AppRole, {
  name: 'AppRole',
  description: 'App user role for authorization.',
});
