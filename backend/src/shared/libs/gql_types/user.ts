import { AppRole, User } from '@generated/type-graphql';
import { Field, ObjectType } from 'type-graphql';

// Dummy types so we can access/sync these on the front-end.
// TODO(richardwu): remove once we include in a resolver.

@ObjectType()
export class DummyAppRole {
  @Field((_type) => AppRole)
  appRole!: AppRole;
}

@ObjectType()
export class DummyUser {
  @Field((_type) => User)
  user!: User;
}
