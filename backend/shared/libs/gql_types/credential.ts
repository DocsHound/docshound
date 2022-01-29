import { Prisma } from '@prisma/client';
import { Field, ObjectType } from 'type-graphql';
import * as GraphQLScalars from 'graphql-scalars';
import { Provider } from './integration';

@ObjectType()
export class DecryptedGlobalApiCredential {
  @Field((_type) => Provider)
  provider!: Provider;

  @Field((_type) => Boolean)
  exists!: boolean;

  @Field((_type) => GraphQLScalars.JSONObjectResolver)
  credentialsJSON!: Prisma.JsonObject;
}

@ObjectType()
export class DecryptedUserApiCredential {
  @Field((_type) => String)
  userId!: string;

  @Field((_type) => Provider)
  provider!: Provider;

  // See https://api.slack.com/methods/oauth.v2.access for schema of a valid object.
  @Field((_type) => GraphQLScalars.JSONObjectResolver)
  credentialsJSON!: Prisma.JsonObject;
}
